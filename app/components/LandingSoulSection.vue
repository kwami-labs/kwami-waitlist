<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

type Personality = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  audio: string;
};

const props = defineProps<{
  id?: string;
  letter: string;
  title: string;
  description: string;
  personalities: Personality[];
}>();

const activeId = ref<string | null>(null);
let activeAudio: HTMLAudioElement | null = null;

function dispatchPreviewStop() {
  window.dispatchEvent(new CustomEvent('landing:voice-preview-stop'));
}

function getAudioStream(audio: HTMLAudioElement): MediaStream | null {
  const mediaAudio = audio as HTMLAudioElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };

  if (typeof mediaAudio.captureStream === 'function') return mediaAudio.captureStream();
  if (typeof mediaAudio.mozCaptureStream === 'function') return mediaAudio.mozCaptureStream();
  return null;
}

async function togglePersonality(personality: Personality) {
  if (activeId.value === personality.id) {
    activeAudio?.pause();
    if (activeAudio) activeAudio.currentTime = 0;
    activeAudio = null;
    activeId.value = null;
    dispatchPreviewStop();
    return;
  }

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    dispatchPreviewStop();
  }

  const audio = new Audio(personality.audio);
  audio.onended = () => {
    if (activeId.value === personality.id) {
      activeId.value = null;
      activeAudio = null;
      dispatchPreviewStop();
    }
  };

  try {
    await audio.play();
    activeAudio = audio;
    activeId.value = personality.id;
    const stream = getAudioStream(audio);
    if (stream) {
      window.dispatchEvent(new CustomEvent('landing:voice-preview-start', { detail: { stream } }));
    }
  } catch {
    activeAudio = null;
    activeId.value = null;
    dispatchPreviewStop();
  }
}

onUnmounted(() => {
  activeAudio?.pause();
  activeAudio = null;
  dispatchPreviewStop();
});
</script>

<template>
  <section class="feature-section" :id="props.id">
    <div class="feature-content soul-content">
      <div class="feature-copy">
        <div class="feature-letter">{{ props.letter }}</div>
        <h2 class="feature-title">{{ props.title }}</h2>
        <p class="feature-description">{{ props.description }}</p>
      </div>

      <div class="personality-list">
        <button
          v-for="personality in props.personalities"
          :key="personality.id"
          type="button"
          class="personality-card"
          :class="{ active: activeId === personality.id }"
          @click="togglePersonality(personality)"
        >
          <div class="personality-top">
            <div>
              <div class="personality-name">{{ personality.name }}</div>
              <div class="personality-tagline">{{ personality.tagline }}</div>
            </div>
            <div class="personality-state">
              {{ activeId === personality.id ? 'Pause' : 'Play' }}
            </div>
          </div>
          <p class="personality-description">{{ personality.description }}</p>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-section {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 48vw) minmax(18rem, 36rem);
  align-items: center;
  justify-content: center;
  column-gap: clamp(1rem, 3vw, 2rem);
  padding: 4rem clamp(2rem, 8vw, 6rem);
  position: relative;
  z-index: 12;
}

.feature-content {
  grid-column: 2;
  text-align: left;
  justify-self: start;
}

.soul-content {
  width: min(100%, 38rem);
  display: grid;
  gap: 1.2rem;
}

.feature-letter {
  font-size: clamp(2.2rem, 10vw, 6rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: rgba(246, 248, 255, 0.94);
  margin-bottom: 0.65rem;
  text-shadow: 0 0 28px rgba(53, 158, 238, 0.18);
}

.feature-title {
  font-size: clamp(1.2rem, 2.8vw, 1.8rem);
  color: #f4f7ff;
  margin-bottom: 0.55rem;
}

.feature-description {
  max-width: 42ch;
  font-size: clamp(0.92rem, 1.5vw, 1.05rem);
  line-height: 1.72;
  color: rgba(174, 184, 206, 0.96);
}

.personality-list {
  display: grid;
  gap: 0.85rem;
}

.personality-card {
  appearance: none;
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1rem 1rem 0.95rem;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.personality-card:hover,
.personality-card.active {
  border-color: rgba(53, 158, 238, 0.35);
  background: rgba(53, 158, 238, 0.08);
  transform: translateY(-1px);
}

.personality-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  margin-bottom: 0.55rem;
}

.personality-name {
  font-size: 1rem;
  font-weight: 700;
  color: #f4f7ff;
}

.personality-tagline {
  font-size: 0.78rem;
  color: rgba(166, 176, 200, 0.92);
}

.personality-state {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #03cea4;
}

.personality-description {
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(188, 196, 216, 0.92);
}

@media (max-width: 780px) {
  .feature-section {
    grid-template-columns: 1fr;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
  }
}
</style>
