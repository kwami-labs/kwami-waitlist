<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import type { Kwami } from 'kwami';
import type { KwamiConfig } from 'kwami';

const RANDOMIZE_INTERVAL_MS = 1_000;

const containerRef = ref<HTMLDivElement | null>(null);
const kwamiRef = shallowRef<Kwami | null>(null);
let rafId: number | null = null;
let randomizeTimer: ReturnType<typeof setInterval> | null = null;

const PALETTE = ['#359EEE', '#FFC43D', '#EF476F', '#03CEA4'] as const;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffleColors(): { x: string; y: string; z: string } {
  const a = [...PALETTE].sort(() => Math.random() - 0.5);
  return { x: a[0]!, y: a[1]!, z: a[2]! };
}

const subtypes = ['poles', 'donut', 'vintage'] as const;

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
  const subtype = subtypes[Math.floor(Math.random() * subtypes.length)]!;

  const kwamiConfig: KwamiConfig = {
    avatar: {
      renderer: 'blob-xyz',
      blob: {
        resolution: 160,
        spikes,
        time: timeConfig,
        rotation: { x: 0, y: 0, z: 0 },
        wireframe: false,
        shininess: rand(0, 0.55),
        colors,
        skin: { skin: 'tricolor', subtype },
      },
      scene: {
        enableControls: false,
      },
    },
  };

  const { Kwami } = await import('kwami');
  const kwami = new Kwami(canvas, kwamiConfig);
  kwamiRef.value = kwami;

  const isMobile = window.innerWidth <= 768;
  const scale = isMobile ? 3.2 : 3.5;
  kwami.avatar.setScale(scale);
  kwami.avatar.setWireframe(false);

  const blob = kwami.avatar.getBlob();
  const blobMesh = blob?.getMesh();
  if (blobMesh) {
    blobMesh.rotation.y = Math.PI / 2;
    const animate = () => {
      blobMesh.rotation.y += 0.01;
      blobMesh.rotation.x += 0.003;
      rafId = requestAnimationFrame(animate);
    };
    animate();
  }

  randomizeTimer = setInterval(() => {
    kwamiRef.value?.avatar.randomize();
  }, RANDOMIZE_INTERVAL_MS);
});

onUnmounted(async () => {
  if (randomizeTimer !== null) {
    clearInterval(randomizeTimer);
    randomizeTimer = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const k = kwamiRef.value;
  if (k) {
    await k.dispose();
    kwamiRef.value = null;
  }
});
</script>

<template>
  <div ref="containerRef" class="waitlist-blob" aria-hidden="true" />
</template>

<style scoped>
/* Fills the parent `.blob-zone` (not the whole viewport) */
.waitlist-blob {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.82;
}
</style>
