<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const canSubmit = computed(() => {
  const e = email.value.trim();
  return e.length > 3 && e.length <= 254 && emailPattern.test(e);
});

const heroProgress = computed(() => clamp(scrollY.value / (viewportH.value * 0.95), 0, 1));
const collapseProgress = computed(() => clamp((heroProgress.value - 0.1) / 0.8, 0, 1));
const infoFade = computed(() => 1 - clamp((heroProgress.value - 0.35) / 0.45, 0, 1));
const headerVisibility = computed(() => clamp((heroProgress.value - 0.45) / 0.35, 0, 1));

const blobStyle = computed(() => ({
  transform: `translate3d(${-22 * collapseProgress.value}vw, 0, 0) scale(${1 - 0.08 * collapseProgress.value})`,
}));

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
  pointerEvents: headerVisibility.value > 0.85 ? 'auto' : 'none',
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

    <div class="blob-zone" :style="blobStyle">
      <ClientOnly>
        <WaitlistBlob />
        <template #fallback>
          <div class="blob-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <header class="floating-header" :style="headerStyle">
      <div class="header-left">
        <WaitlistLogo width="92px" />
        <span class="header-title">KWAMI</span>
      </div>

      <form v-if="status !== 'success'" class="header-form" @submit.prevent="submit">
        <label class="sr-only" for="waitlist-email-header">Email</label>
        <input
          id="waitlist-email-header"
          v-model="email"
          class="input"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="you@example.com"
          :disabled="status === 'loading'"
        />
        <button class="btn" type="submit" :disabled="!canSubmit || status === 'loading'">
          <span v-if="status === 'loading'" class="btn-inner">
            <span class="spinner" />
            Joining...
          </span>
          <span v-else class="btn-inner">Join</span>
        </button>
      </form>
    </header>

    <main class="scroll-main">
      <section class="hero-section">
        <div class="hero-inner">
          <h1 class="title" :style="titleStyle" aria-label="kwami">
            <span class="title-main">KWAMI</span>
            <span class="title-sub">AI COMPANION</span>
          </h1>

          <div class="intro-copy" :style="{ opacity: infoFade }">
            <p class="lede">
              3D companions that hear you, speak with you, and evolve with your style.
            </p>
            <div class="features">
              <span class="pill">3D Avatars</span>
              <span class="pill">Voice AI</span>
              <span class="pill">Real-time</span>
            </div>
          </div>

          <article class="form-card" :style="introFormStyle">
            <Transition name="swap" mode="out-in">
              <div v-if="status !== 'success'" key="form" class="form-content">
                <form class="form" @submit.prevent="submit">
                  <label class="sr-only" for="waitlist-email-intro">Email</label>
                  <div class="form-row">
                    <input
                      id="waitlist-email-intro"
                      v-model="email"
                      class="input"
                      type="email"
                      name="email"
                      autocomplete="email"
                      placeholder="you@example.com"
                      :disabled="status === 'loading'"
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
                <p class="success-text">
                  We will send one email when Kwami launches.
                </p>
              </div>
            </Transition>
          </article>
        </div>
      </section>

      <section v-for="feature in features" :key="feature.letter" class="feature-section">
        <div class="feature-letter">{{ feature.letter }}</div>
        <h2 class="feature-title">{{ feature.title }}</h2>
        <p class="feature-description">{{ feature.description }}</p>
      </section>
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
  z-index: 1;
  pointer-events: none;
  transition: transform 140ms linear;
}

.blob-fallback {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 55% at 50% 50%, rgba(53, 158, 238, 0.1), transparent 65%);
}

.floating-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  background: linear-gradient(180deg, rgba(7, 9, 14, 0.86), rgba(7, 9, 14, 0));
  transition: opacity 180ms ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #f6f8ff;
}

.header-form {
  display: flex;
  gap: 0.45rem;
  width: min(100%, 26rem);
}

.scroll-main {
  position: relative;
  z-index: 10;
}

.hero-section {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.6rem;
}

.hero-inner {
  width: min(100%, 62rem);
  text-align: center;
}

.title {
  margin: 0;
  transform-origin: center center;
  will-change: transform;
  transition: transform 100ms linear;
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
  display: block;
  margin-top: 0.5rem;
  font-size: clamp(0.75rem, 1.9vw, 1.1rem);
  letter-spacing: 0.42em;
  font-weight: 700;
  color: rgba(180, 188, 210, 0.9);
}

.intro-copy {
  margin-top: 1.2rem;
  transition: opacity 180ms ease;
}

.lede {
  color: rgba(178, 186, 208, 0.96);
  font-size: clamp(0.94rem, 1.8vw, 1.12rem);
  line-height: 1.62;
  max-width: 46ch;
  margin: 0.2rem auto 1rem;
}

.features {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  color: rgba(160, 168, 190, 0.9);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  padding: 0.3rem 0.75rem;
}

.form-card {
  margin: 1.5rem auto 0;
  width: min(100%, 31rem);
  transition: transform 120ms linear, opacity 140ms ease;
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
}

.success-title {
  font-size: 1.25rem;
  color: #f0f2f8;
  margin-bottom: 0.42rem;
}

.success-text {
  color: rgba(160, 168, 190, 0.9);
}

.feature-section {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 5.5rem 1.2rem 2rem;
  position: relative;
  z-index: 12;
}

.feature-letter {
  font-size: clamp(2.2rem, 14vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: rgba(246, 248, 255, 0.94);
  margin-bottom: 0.85rem;
  text-shadow: 0 0 28px rgba(53, 158, 238, 0.18);
}

.feature-title {
  font-size: clamp(1.24rem, 3.1vw, 2rem);
  color: #f4f7ff;
  margin-bottom: 0.55rem;
}

.feature-description {
  max-width: 52ch;
  font-size: clamp(0.94rem, 1.6vw, 1.08rem);
  line-height: 1.72;
  color: rgba(174, 184, 206, 0.96);
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

@media (max-width: 780px) {
  .floating-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-form {
    width: 100%;
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
