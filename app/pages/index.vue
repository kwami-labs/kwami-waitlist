<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import memoryGraphMock from '~/assets/data/memory-graph.mock.json';

const supabase = useSupabaseClient();

const email = ref('');
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const message = ref('');
const scrollY = ref(0);
const viewportH = ref(1);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const features = [
  {
    letter: 'SOUL',
    title: 'Soul that adapts to you',
    description:
      'Kwami keeps a stable personality while adapting tone, rhythm, and expression to your style.',
  },
  {
    letter: 'MEMORY',
    title: 'Memory that stays useful',
    description:
      'Important context is remembered and surfaced at the right moment, so each conversation can continue naturally.',
  },
  {
    letter: 'VOICE',
    title: 'Real-time voice interaction',
    description:
      'Low-latency speech with expressive audio makes interactions feel like a live companion, not a chatbot.',
  },
  {
    letter: 'TOOLS',
    title: 'Tools connected to your workflow',
    description:
      'Kwami can call tools, act on context, and turn conversations into real actions across your environment.',
  },
];

const phoneFeatures = [
  {
    eyebrow: 'Voice calls',
    heading: 'Call your\ncompanion',
    desc: 'Start a real-time voice call with Kwami. It listens, responds, and reacts with expressive 3D animation — like talking to someone who actually gets you.',
  },
  {
    eyebrow: 'Video chats',
    heading: 'Face to\nface',
    desc: 'Kwami shows up as a living 3D avatar on your screen. See it react, emote, and express itself while you talk — no static chatbot interface.',
  },
  {
    eyebrow: 'Always with you',
    heading: 'Your pocket\ncompanion',
    desc: 'Whether you need a quick answer, a creative brainstorm, or just someone to talk to — Kwami is one tap away, anywhere.',
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const canSubmit = computed(() => {
  const e = email.value.trim();
  return e.length > 3 && e.length <= 254 && emailPattern.test(e);
});

// Phase 1: Hero collapse (0 → 1vh)
const heroProgress = computed(() => clamp(scrollY.value / (viewportH.value * 0.95), 0, 1));
const collapseProgress = computed(() => clamp((heroProgress.value - 0.1) / 0.8, 0, 1));
const infoFade = computed(() => 1 - clamp((heroProgress.value - 0.35) / 0.45, 0, 1));
const headerVisibility = computed(() => clamp((heroProgress.value - 0.45) / 0.35, 0, 1));

// Phase 2: Features (1vh → 5vh) — blob stays left during this phase
const featuresScrollStart = computed(() => viewportH.value * 1.0);
const featuresScrollEnd = computed(() => viewportH.value * 5.0);

// Phase 3-4: Phone enters + blob shrinks into phone (5vh → 7.5vh)
const phoneProgress = computed(() => {
  const start = viewportH.value * 4.1;
  const end = viewportH.value * 5.8;
  return clamp((scrollY.value - start) / (end - start), 0, 1);
});

const blobPhoneProgress = computed(() => {
  const start = viewportH.value * 4.35;
  const end = viewportH.value * 6.0;
  return clamp((scrollY.value - start) / (end - start), 0, 1);
});

// MEMORY graph takeover: enters from bottom, crosses, then exits to top.
const memoryGraphProgress = computed(() => {
  const start = viewportH.value * 1.55;
  const end = viewportH.value * 3.75;
  return clamp((scrollY.value - start) / (end - start), 0, 1);
});

// Fade the blob out during the MEMORY section, then bring it back.
const memoryBlobOpacity = computed(() => {
  const start = viewportH.value * 1.75;
  const end = viewportH.value * 3.25;
  const p = clamp((scrollY.value - start) / (end - start), 0, 1);
  return 1 - Math.sin(p * Math.PI);
});

const memoryGraphStyle = computed(() => {
  const p = memoryGraphProgress.value;
  let translateY = 55;
  let opacity = 0;

  if (p <= 0.5) {
    const t = p / 0.5;
    translateY = (1 - t) * 55;
    opacity = t;
  } else {
    const t = (p - 0.5) / 0.5;
    translateY = -t * 55;
    opacity = 1 - t * 0.15;
  }

  return {
    transform: `translate3d(0, ${translateY}vh, 0)`,
    opacity: String(opacity),
  };
});

// Blob positioning: left during hero/features, then right into phone
const blobStyle = computed(() => {
  const p = blobPhoneProgress.value;
  const heroShift = -22 * collapseProgress.value;
  const phoneShift = 25 * p;
  const shiftX = heroShift * (1 - p) + phoneShift;
  const shiftY = -12 * p;
  return {
    transform: `translate3d(${shiftX}vw, ${shiftY}vh, 0)`,
    opacity: String(memoryBlobOpacity.value),
  };
});

const titleStyle = computed(() => {
  const moveX = -42 * collapseProgress.value;
  const moveY = -31 * collapseProgress.value;
  const scale = 1 - 0.7 * collapseProgress.value;
  return {
    transform: `translate(${moveX}vw, ${moveY}vh) scale(${scale})`,
    opacity: String(1 - 0.15 * collapseProgress.value),
  };
});

const introFormStyle = computed(() => {
  const moveX = 32 * collapseProgress.value;
  const moveY = -30 * collapseProgress.value;
  const scale = 1 - 0.28 * collapseProgress.value;
  return {
    transform: `translate(${moveX}vw, ${moveY}vh) scale(${scale})`,
    opacity: String(infoFade.value),
  };
});

const headerStyle = computed(() => ({
  opacity: String(headerVisibility.value),
  pointerEvents: (headerVisibility.value > 0.85 ? 'auto' : 'none') as 'auto' | 'none',
}));

function updateScrollMetrics() {
  scrollY.value = window.scrollY || 0;
  viewportH.value = window.innerHeight || 1;
}

onMounted(() => {
  updateScrollMetrics();
  window.addEventListener('scroll', updateScrollMetrics, { passive: true });
  window.addEventListener('resize', updateScrollMetrics, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollMetrics);
  window.removeEventListener('resize', updateScrollMetrics);
});

async function submit() {
  if (!canSubmit.value || status.value === 'loading') return;
  status.value = 'loading';
  message.value = '';

  const normalized = email.value.trim().toLowerCase();
  const { error } = await supabase.from('waitlist_signups').insert({ email: normalized });

  if (!error) {
    status.value = 'success';
    email.value = '';
    return;
  }

  status.value = 'error';
  message.value = error.code === '23505'
    ? 'That email is already on the waitlist.'
    : error.message || 'Something went wrong. Please try again.';
}
</script>

<template>
  <div class="page">
    <div class="ambient" aria-hidden="true" />

    <!-- Blob: fixed, shifts left during features, right into phone -->
    <div class="blob-zone" :style="blobStyle">
      <ClientOnly>
        <LandingBlob :phone-progress="blobPhoneProgress" />
        <template #fallback>
          <div class="blob-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <!-- Phone: fixed, right half, enters after features -->
    <ClientOnly>
      <LandingPhone :progress="phoneProgress" />
    </ClientOnly>

    <div class="memory-graph-overlay" :style="memoryGraphStyle" aria-hidden="true">
      <ClientOnly>
        <LandingMemoryGraph :graph="memoryGraphMock" />
      </ClientOnly>
    </div>

    <!-- Sticky header -->
    <LandingHeader
      :status="status"
      :email="email"
      :can-submit="canSubmit"
      :style="headerStyle"
      @update:email="email = $event"
      @submit="submit"
    />

    <main class="scroll-main">
      <!-- Phase 1: Hero -->
      <LandingHeroSection
        :status="status"
        :email="email"
        :message="message"
        :can-submit="canSubmit"
        :title-style="titleStyle"
        :intro-form-style="introFormStyle"
        :info-fade="infoFade"
        @update:email="email = $event"
        @submit="submit"
      />

      <!-- Phase 2: Feature sections — blob left, text right -->
      <LandingFeatureSection
        v-for="feature in features"
        :key="feature.letter"
        :letter="feature.letter"
        :title="feature.title"
        :description="feature.description"
      />

      <!-- Phase 3-5: Phone features — each one is a full scroll section, text on the left -->
      <LandingPhoneFeatureSection
        v-for="(pf, i) in phoneFeatures"
        :key="'pf-' + i"
        :eyebrow="pf.eyebrow"
        :heading="pf.heading"
        :desc="pf.desc"
      />
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  background:
    radial-gradient(ellipse 120% 82% at 50% -20%, rgba(53, 158, 238, 0.1), transparent 55%),
    radial-gradient(ellipse 76% 55% at 82% 32%, rgba(239, 71, 111, 0.08), transparent 52%),
    radial-gradient(ellipse 76% 55% at 10% 70%, rgba(3, 206, 164, 0.08), transparent 50%),
    #06070a;
}

.ambient {
  position: fixed;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1000px;
  height: 52%;
  background: radial-gradient(ellipse at center, rgba(53, 158, 238, 0.1) 0%, transparent 72%);
  pointer-events: none;
  z-index: 0;
}

.blob-zone {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  transition: transform 120ms linear;
}

.memory-graph-overlay {
  position: fixed;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  transition: transform 180ms linear, opacity 180ms ease;
}

.blob-fallback {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 55% at 50% 50%, rgba(53, 158, 238, 0.1), transparent 65%);
}

.scroll-main {
  position: relative;
  z-index: 10;
}

@media (max-width: 780px) {
  .scroll-main {
    overflow-x: clip;
  }
}
</style>
