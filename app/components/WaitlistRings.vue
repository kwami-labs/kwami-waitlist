<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

export interface WaitlistRingsProps {
  ringCount?: number;
  baseRadiusRatio?: number;
  ringStrokeWidth?: number;
  cycleSeconds?: number;
  ringPulsePxPerIndex?: number;
  rotationDegreesPerSecond?: number;
  animateGradient?: boolean;
  colors?: string[];
  includeWordmark?: boolean;
  zIndex?: string | number;
  opacity?: number;
  /** Continuous pulse + rotation (ignored when expandOnceOnLoad is true). */
  running?: boolean;
  /** Animate from fully expanded → contracted once on load, then hold. */
  expandOnceOnLoad?: boolean;
  /** Duration of the initial contract (ms). */
  expandDurationMs?: number;
}

const props = withDefaults(defineProps<WaitlistRingsProps>(), {
  ringCount: 120,
  baseRadiusRatio: 0.16,
  ringStrokeWidth: 2,
  cycleSeconds: 6,
  ringPulsePxPerIndex: 8,
  rotationDegreesPerSecond: 360,
  animateGradient: true,
  colors: () => ['#359EEE', '#FFC43D', '#EF476F', '#03CEA4'],
  includeWordmark: false,
  zIndex: '0',
  opacity: 1,
  running: true,
  expandOnceOnLoad: true,
  expandDurationMs: 2200,
});

const WORDMARK_PATH =
  'M 200.8 70 L 200.8 67.1 L 240.2 67.1 L 240.2 7.2 L 217.7 55.4 L 195.2 7.1 L 195.2 70.1 L 192.2 70 L 192.2 0 L 195.2 0 L 217.7 48.3 L 240.2 0.1 L 243.2 0 L 243.2 70.1 L 200.8 70 Z M 121.7 3.1 L 59.1 3.1 L 59.1 0.1 L 126 0.1 L 100.5 70.2 L 87.5 34.6 L 74.6 70.2 L 49.1 0.1 L 52.3 0.1 L 74.6 61.4 L 87.5 25.8 L 100.5 61.4 L 121.7 3.1 Z M 139.4 70.1 L 139.4 67.1 L 176.2 67.1 L 155 8.8 L 132.7 70.1 L 129.5 70.1 L 155 0 L 180.5 70.1 L 139.4 70.1 Z M 39.8 0.1 L 44.1 0.1 L 10.5 33.5 L 47.3 70.1 L 43 70.1 L 6.2 33.5 L 39.8 0.1 Z M 0 0.1 L 3 0.1 L 3 70.1 L 0 70.1 L 0 0.1 Z M 266 0.1 L 266 70.1 L 263 70.1 L 263 0.1 L 266 0.1 Z';

const GRADIENT_BASE = { x1: 213.98, y1: 290, x2: 179.72, y2: 320 };

const svgRef = ref<SVGSVGElement | null>(null);
const ringsGroupRef = ref<SVGGElement | null>(null);
const wordmarkRef = ref<SVGPathElement | null>(null);

const gradientX1 = ref(GRADIENT_BASE.x1);
const gradientX2 = ref(GRADIENT_BASE.x2);

let loopRafId: number | null = null;
let expandRafId: number | null = null;
let loopStartTs: number | null = null;
let expandStartTs: number | null = null;
let cx = 0;
let cy = 0;
let baseRadius = 0;

let pulseValue = 0;
let contractFromRadius = 0;

const ellipseRefs: SVGEllipseElement[] = [];

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function parseHex(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim();
  if (!hex.startsWith('#')) return null;
  const raw = hex.slice(1);

  if (raw.length === 3) {
    const r = parseInt((raw[0] || '0') + (raw[0] || '0'), 16);
    const g = parseInt((raw[1] || '0') + (raw[1] || '0'), 16);
    const b = parseInt((raw[2] || '0') + (raw[2] || '0'), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
  }

  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
  }

  return null;
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const to = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`;
}

function interpolatePalette(palette: string[], t: number): string {
  if (!palette.length) return '#000000';
  if (palette.length === 1) return palette[0]!;

  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (palette.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;

  const a = palette[idx] || '#000000';
  const b = palette[Math.min(idx + 1, palette.length - 1)] || '#000000';

  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return frac < 0.5 ? a : b;

  return rgbToHex({
    r: Math.round(ca.r + (cb.r - ca.r) * frac),
    g: Math.round(ca.g + (cb.g - ca.g) * frac),
    b: Math.round(ca.b + (cb.b - ca.b) * frac),
  });
}

function applyRingRadii(pulse: number) {
  pulseValue = pulse;
  for (let i = 0; i < ellipseRefs.length; i++) {
    const count = i + 1;
    const e = ellipseRefs[i]!;
    const delta = pulse * count * props.ringPulsePxPerIndex;
    e.setAttribute('rx', String(baseRadius + delta));
    e.setAttribute('ry', String(baseRadius + delta));
  }
}

function setGradientFromPulse(pulse: number) {
  if (!props.animateGradient) return;
  const shift = pulse;
  gradientX1.value = GRADIENT_BASE.x1 + 380 * shift;
  gradientX2.value = GRADIENT_BASE.x2 + 300 * shift;
}

function resizeSvg() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vw <= 0 || vh <= 0) return;
  if (!svgRef.value) return;

  svgRef.value.setAttribute('viewBox', `0 0 ${vw} ${vh}`);

  cx = vw / 2;
  cy = vh / 2;
  baseRadius = Math.min(vw, vh) * props.baseRadiusRatio;

  for (let i = 0; i < ellipseRefs.length; i++) {
    const count = i + 1;
    const e = ellipseRefs[i]!;
    e.setAttribute('cx', String(cx));
    e.setAttribute('cy', String(cy));

    const t = count / ellipseRefs.length;
    e.style.opacity = String(1 - t);
    e.setAttribute('stroke', interpolatePalette(props.colors, t));
  }

  applyRingRadii(pulseValue);

  if (wordmarkRef.value && props.includeWordmark) {
    const textScale = Math.min(vw, vh) / 500;
    wordmarkRef.value.setAttribute(
      'transform',
      `translate(${cx - 133 * textScale}, ${cy - 35 * textScale}) scale(${textScale})`,
    );
  }
}

function tick(ts: number) {
  if (!props.running) {
    loopRafId = null;
    return;
  }

  if (loopStartTs === null) loopStartTs = ts;

  const elapsed = (ts - loopStartTs) / 1000;
  const phase = (elapsed % props.cycleSeconds) / props.cycleSeconds;

  const pulse = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);

  applyRingRadii(pulse);

  if (props.rotationDegreesPerSecond !== 0 && ringsGroupRef.value) {
    const angle = elapsed * props.rotationDegreesPerSecond;
    ringsGroupRef.value.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
  }

  setGradientFromPulse(pulse);

  loopRafId = requestAnimationFrame(tick);
}

function startLoopAnimation() {
  if (loopRafId !== null) return;
  loopStartTs = null;
  loopRafId = requestAnimationFrame(tick);
}

function stopLoopAnimation() {
  if (loopRafId !== null) {
    cancelAnimationFrame(loopRafId);
    loopRafId = null;
  }
  loopStartTs = null;
}

function expandFrame(ts: number) {
  if (expandStartTs === null) expandStartTs = ts;
  const elapsed = ts - expandStartTs;
  const dur = Math.max(1, props.expandDurationMs);
  const t = Math.min(1, elapsed / dur);
  const eased = easeOutCubic(t);

  for (let i = 0; i < ellipseRefs.length; i++) {
    const count = i + 1;
    const e = ellipseRefs[i]!;
    const endR = baseRadius + count * props.ringPulsePxPerIndex;
    const r = contractFromRadius + (endR - contractFromRadius) * eased;
    e.setAttribute('rx', String(r));
    e.setAttribute('ry', String(r));
  }

  setGradientFromPulse(1);

  if (ringsGroupRef.value) {
    ringsGroupRef.value.setAttribute('transform', `rotate(0 ${cx} ${cy})`);
  }

  if (t < 1) {
    expandRafId = requestAnimationFrame(expandFrame);
  } else {
    expandRafId = null;
    expandStartTs = null;
    pulseValue = 1;
  }
}

function startExpandAnimation() {
  stopExpandAnimation();

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  contractFromRadius = Math.max(vw, vh) * 1.2;

  for (let i = 0; i < ellipseRefs.length; i++) {
    const e = ellipseRefs[i]!;
    e.setAttribute('rx', String(contractFromRadius));
    e.setAttribute('ry', String(contractFromRadius));
  }

  expandStartTs = null;
  expandRafId = requestAnimationFrame(expandFrame);
}

function stopExpandAnimation() {
  if (expandRafId !== null) {
    cancelAnimationFrame(expandRafId);
    expandRafId = null;
  }
  expandStartTs = null;
}

function createEllipses() {
  if (!ringsGroupRef.value) return;

  if (props.expandOnceOnLoad) {
    pulseValue = 1;
  }

  ellipseRefs.length = 0;
  ringsGroupRef.value.innerHTML = '';

  for (let i = 0; i < props.ringCount; i++) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.classList.add('kwami-waitlist-ring');
    e.setAttribute('fill', 'none');
    e.setAttribute('stroke-width', String(props.ringStrokeWidth));
    ellipseRefs.push(e);
    ringsGroupRef.value.appendChild(e);
  }

  resizeSvg();
}

onMounted(() => {
  createEllipses();
  window.addEventListener('resize', resizeSvg, { passive: true });

  if (props.expandOnceOnLoad) {
    startExpandAnimation();
  } else if (props.running) {
    startLoopAnimation();
  }
});

onUnmounted(() => {
  stopLoopAnimation();
  stopExpandAnimation();
  window.removeEventListener('resize', resizeSvg);
});

watch(
  () => props.running,
  (running) => {
    if (props.expandOnceOnLoad) return;
    if (running) {
      startLoopAnimation();
    } else {
      stopLoopAnimation();
    }
  },
);

watch(
  () => props.ringCount,
  () => {
    stopLoopAnimation();
    stopExpandAnimation();
    createEllipses();
    if (props.expandOnceOnLoad) {
      startExpandAnimation();
    } else if (props.running) {
      startLoopAnimation();
    }
  },
);

const gradientId = `kwami-waitlist-grad-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div
    class="kwami-waitlist-rings"
    :style="{
      zIndex: zIndex,
      opacity: opacity,
    }"
  >
    <svg ref="svgRef" preserveAspectRatio="xMidYMid slice" class="rings-svg">
      <defs>
        <linearGradient
          :id="gradientId"
          :x1="gradientX1"
          :y1="GRADIENT_BASE.y1"
          :x2="gradientX2"
          :y2="GRADIENT_BASE.y2"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#000" stop-opacity="0" />
          <stop offset=".15" stop-color="#EF476F" stop-opacity="1" />
          <stop offset=".4" stop-color="#359EEE" stop-opacity="1" />
          <stop offset=".6" stop-color="#03CEA4" stop-opacity="1" />
          <stop offset=".78" stop-color="#FFC43D" stop-opacity="1" />
          <stop offset="1" stop-color="#000" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g ref="ringsGroupRef" id="kwami-waitlist-rings-group" />

      <path
        v-if="includeWordmark"
        ref="wordmarkRef"
        id="kwami-waitlist-wordmark"
        opacity="0.95"
        :d="WORDMARK_PATH"
        :stroke="`url(#${gradientId})`"
        stroke-linecap="round"
        stroke-miterlimit="100"
        stroke-width="2"
        fill="none"
      />
    </svg>
  </div>
</template>

<style scoped>
.kwami-waitlist-rings {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.rings-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
