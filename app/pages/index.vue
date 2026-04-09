<script setup lang="ts">
import memoryGraphMock from '~/assets/data/memory-graph.mock.json';
import personalitiesMock from '~/assets/data/personalities.mock.json';

const {
  email,
  status,
  message,
  canSubmit,
  submit,
} = useWaitlistForm();

const {
  infoFade,
  phoneProgress,
  blobPhoneProgress,
  memoryGraphStyle,
  blobStyle,
  titleStyle,
  introFormStyle,
  headerBgOpacity,
  introCopyStyle,
} = useScrollAnimations();

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
</script>

<template>
  <div class="page">
    <div class="ambient" aria-hidden="true" />

    <!-- Header background: fades in as elements reach header position -->
    <div
      class="header-bg"
      :style="{ opacity: headerBgOpacity }"
      aria-hidden="true"
    />

    <!-- Title: fixed, interpolates from hero center → top-left header -->
    <h1 class="hero-title" :style="titleStyle" aria-label="kwami">
      <span class="title-main">KWAMI</span>
    </h1>

    <!-- Subtitle: fixed but fades away with hero copy -->
    <p class="title-sub" :style="introCopyStyle">THE AI THAT FEELS ALIVE</p>

    <!-- Form: fixed, interpolates from hero center → top-right header -->
    <div class="hero-form-wrapper" :style="introFormStyle">
      <Transition name="swap" mode="out-in">
        <div v-if="status !== 'success'" key="form">
          <form class="hero-form" @submit.prevent="submit">
            <label class="sr-only" for="hero-email">Email</label>
            <div class="form-row">
              <input
                id="hero-email"
                :value="email"
                class="input"
                type="email"
                name="email"
                autocomplete="email"
                placeholder="you@example.com"
                :disabled="status === 'loading'"
                @input="email = ($event.target as HTMLInputElement).value"
              />
              <button class="btn" type="submit" :disabled="!canSubmit || status === 'loading'">
                <span v-if="status === 'loading'" class="btn-inner">
                  <span class="spinner" />
                  Joining...
                </span>
                <span v-else class="btn-inner">Join waitlist</span>
              </button>
            </div>
          </form>
          <Transition name="slide">
            <p v-if="message && status === 'error'" class="feedback is-error">
              {{ message }}
            </p>
          </Transition>
        </div>
        <div v-else key="success" class="success-content">
          <h2 class="success-title">You're on the list</h2>
          <p class="success-text">We will send one email when Kwami launches.</p>
        </div>
      </Transition>
    </div>

    <!-- Blob: fixed, shifts left during features, right into phone -->
    <div class="blob-zone" :style="blobStyle">
      <ClientOnly>
        <Blob :phone-progress="blobPhoneProgress" />
        <template #fallback>
          <div class="blob-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <!-- Phone: fixed, right half, enters after features -->
    <ClientOnly>
      <Phone :progress="phoneProgress" />
    </ClientOnly>

    <div class="memory-graph-overlay" :style="memoryGraphStyle" aria-hidden="true">
      <ClientOnly>
        <MemoryGraph3D :graph="memoryGraphMock" />
      </ClientOnly>
    </div>

    <main class="scroll-main">
      <!-- Phase 1: Hero (spacer + intro copy that fades) -->
      <HeroSection
        :info-fade="infoFade"
        :intro-copy-style="introCopyStyle"
      />

      <!-- Phase 2: Feature sections — blob left, text right -->
      <template v-for="feature in features" :key="feature.letter">
        <SoulSection
          v-if="feature.letter === 'SOUL'"
          id="soul"
          :letter="feature.letter"
          :title="feature.title"
          :description="feature.description"
          :personalities="personalitiesMock"
        />
        <FeatureSection
          v-else
          :id="feature.letter.toLowerCase()"
          :letter="feature.letter"
          :title="feature.title"
          :description="feature.description"
        />
      </template>

      <!-- Phase 3-5: Phone features — each one is a full scroll section, text on the left -->
      <PhoneFeatureSection
        v-for="(pf, i) in phoneFeatures"
        :key="'pf-' + i"
        :eyebrow="pf.eyebrow"
        :heading="pf.heading"
        :desc="pf.desc"
      />
    </main>

    <Footer />
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

/* Header background gradient */
.header-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 30;
  background: linear-gradient(180deg, rgba(7, 9, 14, 0.92) 0%, rgba(7, 9, 14, 0) 100%);
  pointer-events: none;
  transition: opacity 120ms ease;
}

/* Floating title */
.hero-title {
  margin: 0;
  text-align: center;
  white-space: nowrap;
}

.title-main {
  display: block;
  font-size: clamp(3.2rem, 17vw, 10.2rem);
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: 0.03em;
  color: #f6f8ff;
  text-shadow: 0 0 34px rgba(53, 158, 238, 0.22);
}

.title-sub {
  position: fixed;
  left: 50%;
  top: 52%;
  transform: translateX(-50%);
  z-index: 31;
  margin: 0;
  font-size: clamp(0.75rem, 1.9vw, 1.1rem);
  letter-spacing: 0.42em;
  font-weight: 700;
  color: rgba(180, 188, 210, 0.9);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

/* Floating form wrapper */
.hero-form-wrapper {
  width: min(100%, 31rem);
}

.form-row {
  display: flex;
  gap: 0.55rem;
}

.input {
  width: 100%;
  min-width: 0;
  background: rgba(8, 11, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.625rem;
  color: #f0f2f8;
  font-size: 0.9375rem;
  padding: 0.72rem 0.9rem;
  outline: none;
}

.input:focus {
  border-color: rgba(53, 158, 238, 0.65);
  box-shadow: 0 0 0 3px rgba(53, 158, 238, 0.15);
}

.btn {
  appearance: none;
  border: none;
  border-radius: 0.625rem;
  background: linear-gradient(135deg, #359eee 0%, #03cea4 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.72rem 1rem;
  cursor: pointer;
  min-width: 8.5rem;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.36rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

.feedback {
  margin-top: 0.8rem;
  font-size: 0.8rem;
}

.feedback.is-error {
  color: rgba(248, 154, 154, 0.95);
}

.success-content {
  padding: 0.85rem 0;
  text-align: center;
}

.success-title {
  font-size: 1.25rem;
  color: #f0f2f8;
  margin-bottom: 0.42rem;
}

.success-text {
  color: rgba(160, 168, 190, 0.9);
}

.swap-enter-active,
.swap-leave-active,
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.swap-enter-from,
.slide-enter-from,
.swap-leave-to,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

  .form-row {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
