<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import type { Kwami, KwamiConfig, AvatarBlobPreset } from 'kwami';

const props = defineProps<{
  /** 0 = hero size, 1 = shrunken to fit inside phone screen */
  phoneProgress?: number;
}>();

/**
 * The blob cycles through the library's 12 curated presets (`avatarBlobPresets`)
 * rather than randomising every parameter independently. Each preset is a
 * designed look — coordinated palette, matched shininess/opacity/light, tuned
 * spikes and wave timing — so every frame the page shows is one somebody chose.
 * Fully random values mostly produce muddy colours and incoherent surfaces.
 */
const PRESET_INTERVAL_MS = 7_000;

/** Low = slow morph between presets. The renderer eases toward each target. */
const TRANSITION_SPEED = 0.015;

/** Presets go up to resolution 280; that is a lot of vertices for a phone. */
const MAX_MOBILE_RESOLUTION = 160;

const containerRef = ref<HTMLDivElement | null>(null);
const kwamiRef = shallowRef<Kwami | null>(null);
let presetTimer: ReturnType<typeof setInterval> | null = null;
let removeClickHandler: (() => void) | null = null;
let removePreviewAudioHandlers: (() => void) | null = null;

function isMobileViewport() {
  return window.innerWidth <= 768;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

onMounted(async () => {
  if (!containerRef.value) return;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  containerRef.value.appendChild(canvas);

  await new Promise((r) => setTimeout(r, 10));

  const { Kwami, avatarBlobPresets } = await import('kwami');

  const isMobile = isMobileViewport();
  const heroScale = isMobile ? 3.2 : 3.5;

  const capResolution = (r: number) =>
    isMobile ? Math.min(r, MAX_MOBILE_RESOLUTION) : r;

  let current: AvatarBlobPreset =
    avatarBlobPresets[Math.floor(Math.random() * avatarBlobPresets.length)]!;

  // Seed the initial config from the first preset so the very first frame is
  // already a designed look rather than a default blob that then jumps.
  const seed = current.blob;
  const kwamiConfig: KwamiConfig = {
    avatar: {
      renderer: 'blob-xyz',
      blob: {
        skin: seed.skin?.type,
        resolution: capResolution(seed.skin?.resolution ?? 160),
        colors: seed.skin?.colors,
        shininess: seed.skin?.shininess,
        wireframe: seed.skin?.wireframe,
        spikes: seed.shape?.spikes,
        time: seed.animation?.time,
        rotation: seed.animation?.rotation,
      },
      scene: { enableControls: false },
    },
  };

  const kwami = new Kwami(canvas, kwamiConfig);
  kwamiRef.value = kwami;

  kwami.avatar.setScale(heroScale);

  const blob = kwami.avatar.getBlob();

  /**
   * Push a whole preset onto the live blob.
   *
   * `blob.shape.position` is deliberately skipped: it is exposed in the app's
   * settings panel as three 0–360° sliders, but nothing in the library maps it
   * to a renderer call, so there is no correct setter to forward it to.
   */
  function applyPreset(preset: AvatarBlobPreset) {
    if (!blob) return;
    const { skin, shape, animation, cursorTouch } = preset.blob;

    if (skin) {
      if (skin.type) kwami.avatar.setSkin(skin.type);
      if (skin.colors) blob.setColors(skin.colors.x, skin.colors.y, skin.colors.z);
      if (skin.opacity !== undefined) blob.setOpacity(skin.opacity);
      if (skin.shininess !== undefined) blob.setShininess(skin.shininess);
      if (skin.lightIntensity !== undefined) blob.setLightIntensity(skin.lightIntensity);
      if (skin.wireframe !== undefined) blob.setWireframe(skin.wireframe);
      if (skin.glassMode !== undefined) blob.setGlassMode(skin.glassMode);
      if (skin.resolution !== undefined) blob.setResolution(capResolution(skin.resolution));
    }

    if (shape) {
      if (shape.spikes) blob.setSpikes(shape.spikes.x, shape.spikes.y, shape.spikes.z);
      if (shape.amplitude) {
        blob.setAmplitude(shape.amplitude.x, shape.amplitude.y, shape.amplitude.z);
      }
      // Preset scale is ignored on purpose — the hero needs the blob sized to
      // fill the viewport, and each preset carries its own unrelated scale.
    }

    if (animation) {
      if (animation.time) blob.setTime(animation.time.x, animation.time.y, animation.time.z);
      if (animation.rotation) {
        blob.setRotation(animation.rotation.x, animation.rotation.y, animation.rotation.z);
      }
      if (animation.breathing !== undefined) {
        blob.audioEffects.breathing = animation.breathing;
      }
    }

    if (cursorTouch?.touch) {
      blob.setTouchStrength(cursorTouch.touch.strength);
      blob.setTouchDuration(cursorTouch.touch.duration);
      blob.setMaxTouchPoints(cursorTouch.touch.maxPoints);
    }
  }

  if (blob) {
    // Morph between presets instead of snapping to each one.
    blob.setTransitionSpeed(TRANSITION_SPEED);

    // Cursor tracking is built into the renderer — no hand-rolled pointermove
    // listener or requestAnimationFrame loop needed.
    blob.setCursorFollowEnabled(true);
    blob.setCursorFollowSensitivity(isMobile ? 0.6 : 1);

    applyPreset(current);

    // A page-wide click pulses the blob even though the hero sits above the
    // canvas. `triggerPulse` is the renderer's own entry point for this.
    const onWindowClick = () => blob.triggerPulse();
    window.addEventListener('click', onWindowClick, { passive: true });
    removeClickHandler = () => window.removeEventListener('click', onWindowClick);

    // Respect reduced-motion: settle on one designed look and stop cycling.
    if (!prefersReducedMotion() && avatarBlobPresets.length > 1) {
      presetTimer = setInterval(() => {
        let next = current;
        while (next.id === current.id) {
          next = avatarBlobPresets[Math.floor(Math.random() * avatarBlobPresets.length)]!;
        }
        current = next;
        applyPreset(current);
      }, PRESET_INTERVAL_MS);
    }
  }

  // Smooth blob scale toward phone screen size when phoneProgress changes.
  const phoneScaleTarget = 2.15;
  watch(
    () => props.phoneProgress ?? 0,
    (p) => {
      kwami.avatar.setScale(heroScale + (phoneScaleTarget - heroScale) * p);
    },
  );

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
  if (presetTimer !== null) { clearInterval(presetTimer); presetTimer = null; }
  if (removeClickHandler) { removeClickHandler(); removeClickHandler = null; }
  if (removePreviewAudioHandlers) { removePreviewAudioHandlers(); removePreviewAudioHandlers = null; }
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
