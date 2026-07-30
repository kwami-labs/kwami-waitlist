<script setup lang="ts">
// Single fullscreen waitlist page — no scrolling.
//
// The scrolling landing experience (feature sections, phone, memory graph,
// footer) is archived, not deleted. To bring it back, restore the previous
// version of this file from git and re-add the assets it needs:
//   git show HEAD:app/pages/index.vue
// The components it used still live in app/components/ and the scroll driver
// in app/composables/useScrollAnimations.ts.

const {
  email,
  status,
  message,
  canSubmit,
  submit,
} = useWaitlistForm();
</script>

<template>
  <div class="page">
    <div class="ambient" aria-hidden="true" />

    <div class="blob-zone">
      <ClientOnly>
        <Blob />
        <template #fallback>
          <div class="blob-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <main class="hero">
      <h1 class="hero-title" aria-label="kwami">
        <span class="title-main">KWAMI</span>
      </h1>

      <p class="title-sub">THE AI THAT FEELS ALIVE</p>

      <div class="hero-form-wrapper">
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
    </main>
  </div>
</template>

<style scoped>
.page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 120% 82% at 50% -20%, rgba(53, 158, 238, 0.1), transparent 55%),
    radial-gradient(ellipse 76% 55% at 82% 32%, rgba(239, 71, 111, 0.08), transparent 52%),
    radial-gradient(ellipse 76% 55% at 10% 70%, rgba(3, 206, 164, 0.08), transparent 50%),
    #06070a;
}

.ambient {
  position: absolute;
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
  position: absolute;
  inset: 0;
  z-index: 3;
}

.blob-fallback {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 55% at 50% 50%, rgba(53, 158, 238, 0.1), transparent 65%);
}

/* Fullscreen hero — everything sits in one non-scrolling column. */
.hero {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  padding: 1.6rem;
  /* Let pointer events through to the blob canvas; re-enabled on the form. */
  pointer-events: none;
}

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
  margin: 0;
  font-size: clamp(0.75rem, 1.9vw, 1.1rem);
  letter-spacing: 0.42em;
  font-weight: 700;
  color: rgba(180, 188, 210, 0.9);
  text-align: center;
  white-space: nowrap;
}

.hero-form-wrapper {
  width: min(100%, 31rem);
  margin-top: 0.9rem;
  pointer-events: auto;
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
  text-align: center;
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
