<script setup lang="ts">
const props = defineProps<{
  status: 'idle' | 'loading' | 'success' | 'error';
  email: string;
  message: string;
  canSubmit: boolean;
  titleStyle: Record<string, string>;
  introFormStyle: Record<string, string>;
  infoFade: number;
}>();

const emit = defineEmits<{
  (e: 'update:email', value: string): void;
  (e: 'submit'): void;
}>();
</script>

<template>
  <section class="hero-section">
    <div class="hero-inner">
      <h1 class="title" :style="props.titleStyle" aria-label="kwami">
        <span class="title-main">KWAMI</span>
        <span class="title-sub">THE AI THAT FEELS ALIVE</span>
      </h1>

      <div class="intro-copy" :style="{ opacity: props.infoFade }">
        <p class="lede">
          3D companions that hear you, speak with you, and evolve with your style.
        </p>
        <div class="features-pills">
          <span class="pill">3D Avatars</span>
          <span class="pill">Voice AI</span>
          <span class="pill">Real-time</span>
        </div>
      </div>

      <article class="form-card" :style="props.introFormStyle">
        <Transition name="swap" mode="out-in">
          <div v-if="props.status !== 'success'" key="form" class="form-content">
            <form class="form" @submit.prevent="emit('submit')">
              <label class="sr-only" for="landing-email-intro">Email</label>
              <div class="form-row">
                <input
                  id="landing-email-intro"
                  :value="props.email"
                  class="input"
                  type="email"
                  name="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  :disabled="props.status === 'loading'"
                  @input="emit('update:email', ($event.target as HTMLInputElement).value)"
                />
                <button class="btn" type="submit" :disabled="!props.canSubmit || props.status === 'loading'">
                  <span v-if="props.status === 'loading'" class="btn-inner">
                    <span class="spinner" />
                    Joining...
                  </span>
                  <span v-else class="btn-inner">Join waitlist</span>
                </button>
              </div>
            </form>

            <Transition name="slide">
              <p v-if="props.message && props.status === 'error'" class="feedback is-error">
                {{ props.message }}
              </p>
            </Transition>
          </div>

          <div v-else key="success" class="success-content">
            <h2 class="success-title">You're on the list</h2>
            <p class="success-text">We will send one email when Kwami launches.</p>
          </div>
        </Transition>
      </article>
    </div>
  </section>
</template>

<style scoped>
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

.features-pills {
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
  .form-row {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
