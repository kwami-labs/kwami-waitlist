<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import type { Kwami } from 'kwami';
import type { KwamiConfig } from 'kwami';

const props = defineProps<{
  /** 0 = hero size, 1 = shrunken to fit inside phone screen */
  phoneProgress?: number;
}>();

const RANDOMIZE_INTERVAL_MS = 2_000;

const containerRef = ref<HTMLDivElement | null>(null);
const kwamiRef = shallowRef<Kwami | null>(null);
let rafId: number | null = null;
let randomizeTimer: ReturnType<typeof setInterval> | null = null;
let removePointerHandlers: (() => void) | null = null;
let removePreviewAudioHandlers: (() => void) | null = null;
let removeClickProxyHandler: (() => void) | null = null;

const PALETTE = ['#359EEE', '#FFC43D', '#EF476F', '#03CEA4'] as const;

const ALL_SUBTYPES = [
  'radial', 'banded', 'striped', 'marble', 'fresnel', 'iridescent', 'spiral', 'plasma', 'gradient',
  'matte', 'glossy', 'metallic', 'subsurface',
  'chrome', 'clay', 'jade', 'toon-matcap', 'hologram',
  'flat', 'stepped', 'halftone', 'outlined',
] as const;

type Subtype = typeof ALL_SUBTYPES[number];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randColor() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function shuffleColors(): { x: string; y: string; z: string } {
  const a = [...PALETTE].sort(() => Math.random() - 0.5);
  return { x: a[0]!, y: a[1]!, z: a[2]! };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

onMounted(async () => {
  if (!containerRef.value) return;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  containerRef.value.appendChild(canvas);

  await new Promise((r) => setTimeout(r, 10));

  const spikes = { x: rand(0.15, 2.8), y: rand(0.15, 2.8), z: rand(0.15, 2.8) };
  const timeConfig = { x: rand(0.8, 5.5), y: rand(0.8, 5.5), z: rand(0.8, 5.5) };
  const colors = shuffleColors();

  const kwamiConfig: KwamiConfig = {
    avatar: {
      renderer: 'blob-xyz',
      blob: {
        resolution: 160,
        spikes,
        time: timeConfig,
        rotation: { x: 0, y: 0, z: 0 },
        wireframe: false,
        shininess: rand(10, 120),
        colors,
        skin: { skin: 'tricolor', subtype: 'poles' } as any,
      },
      scene: { enableControls: false },
    },
  };

  const { Kwami } = await import('kwami');
  const kwami = new Kwami(canvas, kwamiConfig);
  kwamiRef.value = kwami;

  const isMobile = window.innerWidth <= 768;
  const heroScale = isMobile ? 3.2 : 3.5;
  kwami.avatar.setScale(heroScale);

  // Smooth blob scale toward phone screen size when phoneProgress changes.
  let currentScale = heroScale;
  const phoneScaleTarget = 2.15;
  watch(
    () => props.phoneProgress ?? 0,
    (p) => {
      const target = heroScale + (phoneScaleTarget - heroScale) * p;
      currentScale = target;
      kwami.avatar.setScale(target);
    },
  );

  // Capture blob once — do not re-fetch from kwamiRef inside timer.
  const blob = kwami.avatar.getBlob();
  const blobMesh = blob?.getMesh();

  // Make click/touch interaction feel more like the stronger
  // "Touch Physics" squeeze from the app.
  if (blob) {
    try { blob.setTouchStrength(0.7); } catch {}
    try { blob.setTouchDuration(800); } catch {}
    try { blob.setMaxTouchPoints(8); } catch {}
  }

  // Pointer-driven rotation.
  if (blobMesh) {
    let targetY = Math.PI / 2;
    let targetX = 0;
    let hasPointerInput = false;
    let burstRemaining = 0;
    let accumulatedYawOffset = 0;
    let accumulatedPitchOffset = 0;
    let randomizeCount = 0;

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetY = Math.PI / 2 + clamp(nx, -1, 1) * 1.1;
      targetX = clamp(ny, -1, 1) * 0.55;
      hasPointerInput = true;
    };
    const onPointerLeave = () => { hasPointerInput = false; };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    removePointerHandlers = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };

    const animate = () => {
      const driftY = Math.sin(performance.now() * 0.00025) * 0.08;
      const driftX = Math.cos(performance.now() * 0.0002) * 0.04;

      if (burstRemaining > 0.0001) {
        const spinStep = Math.min(0.12, Math.max(0.01, burstRemaining * 0.055));
        accumulatedYawOffset += spinStep;
        accumulatedPitchOffset += spinStep * 0.04;
        burstRemaining = Math.max(0, burstRemaining - spinStep);
      }

      const desiredY = (hasPointerInput ? targetY : Math.PI / 2 + driftY) + accumulatedYawOffset;
      const desiredX = (hasPointerInput ? targetX : driftX) + accumulatedPitchOffset;

      blobMesh.rotation.y += (desiredY - blobMesh.rotation.y) * 0.08;
      blobMesh.rotation.x += (desiredX - blobMesh.rotation.x) * 0.08;

      rafId = requestAnimationFrame(animate);
    };
    animate();

    // Forward global clicks to the blob canvas so the built-in
    // raycast touch/pulse effect still works even when layout layers
    // sit visually above the canvas.
    const proxyClickToCanvas = (event: MouseEvent) => {
      const forwarded = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: event.clientX,
        clientY: event.clientY,
        button: event.button,
        buttons: event.buttons,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      });
      canvas.dispatchEvent(forwarded);
    };

    window.addEventListener('click', proxyClickToCanvas, { passive: true });
    removeClickProxyHandler = () => {
      window.removeEventListener('click', proxyClickToCanvas);
    };
 
    // Import randomizer helpers from the library — same as kwami-app panel.
    const { randomBlobSkinType, blobSkinSelectionFromSubtype } = await import('kwami') as any;

    const doRandomize = () => {
      if (!blob) return;

      // Pick a random subtype using the library randomizer (matches app panel behavior).
      const subtype: Subtype = randomBlobSkinType?.() ?? ALL_SUBTYPES[Math.floor(Math.random() * ALL_SUBTYPES.length)]!;
      try { kwami.avatar.setSkin(blobSkinSelectionFromSubtype(subtype)); } catch {}
      try { blob.setColors(randColor(), randColor(), randColor()); } catch {}
      try { kwami.avatar.setShininess(rand(10, 180)); } catch {}
      try { kwami.avatar.setWireframe(Math.random() > 0.85); } catch {}
      try { blob.setSpikes(rand(0.1, 3), rand(0.1, 3), rand(0.1, 3)); } catch {}
      try { blob.setAmplitude(rand(0.3, 1.5), rand(0.3, 1.5), rand(0.3, 1.5)); } catch {}
      try { blob.setTime(rand(0.5, 8), rand(0.5, 8), rand(0.5, 8)); } catch {}

      randomizeCount += 1;
      if (randomizeCount % 5 === 0) {
        burstRemaining = Math.PI / (4);
      }
    };

    doRandomize();
    randomizeTimer = setInterval(doRandomize, RANDOMIZE_INTERVAL_MS);
  }

  const onPreviewStart = async (event: Event) => {
    const customEvent = event as CustomEvent<{ stream?: MediaStream }>;
    const stream = customEvent.detail?.stream;
    if (!stream) return;
    try {
      await kwami.avatar.connectMediaStream(stream);
      kwami.avatar.setState('speaking');
    } catch {
      // Ignore preview audio hookup failures; blob still works normally.
    }
  };

  const onPreviewStop = () => {
    try {
      kwami.avatar.disconnectMediaStream();
      kwami.avatar.setState('idle');
    } catch {
      // Ignore disconnect failures
    }
  };

  window.addEventListener('voice-preview-start', onPreviewStart as EventListener);
  window.addEventListener('voice-preview-stop', onPreviewStop);
  removePreviewAudioHandlers = () => {
    window.removeEventListener('voice-preview-start', onPreviewStart as EventListener);
    window.removeEventListener('voice-preview-stop', onPreviewStop);
  };
});

onUnmounted(async () => {
  if (randomizeTimer !== null) { clearInterval(randomizeTimer); randomizeTimer = null; }
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  if (removePointerHandlers) { removePointerHandlers(); removePointerHandlers = null; }
  if (removePreviewAudioHandlers) { removePreviewAudioHandlers(); removePreviewAudioHandlers = null; }
  if (removeClickProxyHandler) { removeClickProxyHandler(); removeClickProxyHandler = null; }
  const k = kwamiRef.value;
  if (k) { await k.dispose(); kwamiRef.value = null; }
});
</script>

<template>
  <div ref="containerRef" class="waitlist-blob" aria-hidden="true" />
</template>

<style scoped>
.waitlist-blob {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: auto;
  opacity: 0.82;
}
</style>
