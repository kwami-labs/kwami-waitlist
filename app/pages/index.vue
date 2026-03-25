<script setup lang="ts">
import { ref, computed } from 'vue';

const supabase = useSupabaseClient();

const email = ref('');
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const message = ref('');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmit = computed(() => {
  const e = email.value.trim();
  return e.length > 3 && e.length <= 254 && emailPattern.test(e);
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
  if (error.code === '23505') {
    message.value = 'That email is already on the waitlist.';
    return;
  }
  message.value = error.message || 'Something went wrong. Please try again.';
}
</script>

<template>
  <div class="page">
    <WaitlistRings :z-index="0" :opacity="0.85" />

    <div class="ambient" aria-hidden="true" />

    <header class="header reveal" style="--d: 0.15s">
      <WaitlistLogo width="110px" />
    </header>

    <main class="shell">
      <div class="hero">
        <div class="blob-zone reveal" style="--d: 0.2s">
          <ClientOnly>
            <WaitlistBlob />
            <template #fallback>
              <div class="blob-fallback" aria-hidden="true" />
            </template>
          </ClientOnly>
        </div>

        <div
          class="card-outer reveal"
          :class="{ 'is-success': status === 'success' }"
          style="--d: 0.4s"
        >
          <div class="card-glow" aria-hidden="true" />
          <article class="card">
          <Transition name="swap" mode="out-in">
            <!-- ── Idle / Error state ── -->
            <div v-if="status !== 'success'" key="form" class="card-body">
              <div class="eyebrow reveal" style="--d: 0.55s">
                <span class="eyebrow-dot" />
                Coming soon
              </div>

              <h1 class="title reveal" style="--d: 0.65s">
                Meet your <span class="gradient-text">AI companion</span>
              </h1>

              <p class="lede reveal" style="--d: 0.75s">
                3D AI companions that see, hear, and speak — personalized to you. Sign up for one
                email when we launch on <span class="domain">kwami.io</span>.
              </p>

              <div class="features reveal" style="--d: 0.85s">
                <span class="pill">3D Avatars</span>
                <span class="pill">Voice AI</span>
                <span class="pill">Real-time</span>
              </div>

              <div class="divider reveal" style="--d: 0.9s" aria-hidden="true" />

              <form class="form reveal" style="--d: 0.95s" @submit.prevent="submit">
                <label class="sr-only" for="waitlist-email">Email</label>
                <div class="form-row">
                  <input
                    id="waitlist-email"
                    v-model="email"
                    class="input"
                    type="email"
                    name="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    :disabled="status === 'loading'"
                  />
                  <button
                    class="btn"
                    type="submit"
                    :disabled="!canSubmit || status === 'loading'"
                  >
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

              <p class="privacy reveal" style="--d: 1.05s">
                No spam — launch news only. Unsubscribe anytime.
              </p>
            </div>

            <!-- ── Success state ── -->
            <div v-else key="success" class="success-content">
              <div class="success-icon">
                <svg class="checkmark" viewBox="0 0 52 52">
                  <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                  <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <h2 class="success-title">You're on the list</h2>
              <p class="success-text">
                We'll send you one email when Kwami launches.<br />
                Get ready to meet your AI companion.
              </p>
            </div>
          </Transition>
          </article>
        </div>
      </div>
    </main>

    <footer class="footer reveal" style="--d: 1.15s">
      <span class="footer-brand">kwami.io</span>
      <span class="footer-sep">&middot;</span>
      <span>&copy; 2026</span>
    </footer>
  </div>
</template>

<style scoped>
/* ────────────────────────────────────────────────────
   Page shell
   ──────────────────────────────────────────────────── */
.page {
  min-height: 100dvh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  background:
    radial-gradient(ellipse 110% 70% at 50% -18%, rgba(53, 158, 238, 0.09), transparent 55%),
    radial-gradient(ellipse 70% 50% at 82% 32%, rgba(239, 71, 111, 0.05), transparent 50%),
    radial-gradient(ellipse 60% 42% at 12% 62%, rgba(3, 206, 164, 0.04), transparent 45%),
    #050608;
}

.ambient {
  position: fixed;
  top: -22%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 900px;
  height: 55%;
  background: radial-gradient(ellipse at center, rgba(53, 158, 238, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ────────────────────────────────────────────────────
   Entrance animation system
   ──────────────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(18px);
  animation: reveal 0.72s var(--ease-out) both;
  animation-delay: var(--d, 0s);
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ────────────────────────────────────────────────────
   Header
   ──────────────────────────────────────────────────── */
.header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: clamp(1.25rem, 3vw, 2rem) 1rem 0;
  flex-shrink: 0;
}

/* ────────────────────────────────────────────────────
   Shell — vertically centers the hero
   ──────────────────────────────────────────────────── */
.shell {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem var(--space-lg);
  pointer-events: none;
}

/* ────────────────────────────────────────────────────
   Hero — wrapper that stacks blob behind card
   ──────────────────────────────────────────────────── */
.hero {
  position: relative;
  width: 100%;
  max-width: 29rem;
}

/* ────────────────────────────────────────────────────
   Blob zone — positioned behind the card
   ──────────────────────────────────────────────────── */
.blob-zone {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.blob-fallback {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    ellipse 60% 55% at 50% 50%,
    rgba(53, 158, 238, 0.1),
    transparent 65%
  );
}

/* ────────────────────────────────────────────────────
   Card — animated gradient border
   ──────────────────────────────────────────────────── */
.card-outer {
  pointer-events: auto;
  position: relative;
  width: 100%;
  max-width: 29rem;
  border-radius: 1.25rem;
  padding: 1px;
  overflow: hidden;
  box-shadow:
    0 0 80px -20px rgba(53, 158, 238, 0.12),
    0 0 40px -10px rgba(3, 206, 164, 0.06);
  transition: box-shadow 0.6s var(--ease-out);
}

.card-outer:has(.input:focus) {
  box-shadow:
    0 0 100px -20px rgba(53, 158, 238, 0.18),
    0 0 50px -10px rgba(3, 206, 164, 0.1);
}

.card-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    #ef476f 70deg,
    #359eee 140deg,
    #03cea4 210deg,
    #ffc43d 280deg,
    transparent 360deg
  );
  opacity: 0.55;
  animation: glow-spin 5s linear infinite;
  transition: opacity 0.6s var(--ease-out);
}

.card-outer:has(.input:focus) .card-glow {
  opacity: 0.75;
}

.card-outer.is-success .card-glow {
  background: conic-gradient(from 0deg, transparent 0deg, #03cea4 120deg, #22d3ee 240deg, transparent 360deg);
  opacity: 0.5;
}

@keyframes glow-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.card {
  position: relative;
  z-index: 1;
  background: rgba(10, 12, 20, 0.88);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border-radius: calc(1.25rem - 1px);
  padding: clamp(1.5rem, 4vw, 2rem);
}

.card-body {
  display: flex;
  flex-direction: column;
}

/* ────────────────────────────────────────────────────
   Eyebrow
   ──────────────────────────────────────────────────── */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(160, 168, 190, 0.95);
  margin-bottom: 0.75rem;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #03cea4;
  flex-shrink: 0;
  animation: pulse-dot 2.2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(3, 206, 164, 0.45);
  }
  50% {
    opacity: 0.65;
    box-shadow: 0 0 0 7px rgba(3, 206, 164, 0);
  }
}

/* ────────────────────────────────────────────────────
   Title
   ──────────────────────────────────────────────────── */
.title {
  font-size: clamp(1.55rem, 4.5vw, 1.95rem);
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 0.875rem;
  color: #f0f2f8;
}

.gradient-text {
  background: linear-gradient(90deg, #359eee, #03cea4, #ffc43d, #359eee);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: 200% center;
  }
}

/* ────────────────────────────────────────────────────
   Lede
   ──────────────────────────────────────────────────── */
.lede {
  color: rgba(160, 168, 190, 0.95);
  font-size: 0.9375rem;
  margin-bottom: 1.25rem;
  line-height: 1.6;
  max-width: 34ch;
}

.domain {
  color: #e8eaf2;
  font-weight: 500;
}

/* ────────────────────────────────────────────────────
   Feature pills
   ──────────────────────────────────────────────────── */
.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.pill {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: rgba(160, 168, 190, 0.85);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 100px;
  padding: 0.3rem 0.75rem;
  transition:
    border-color var(--duration-normal) var(--ease-out),
    background var(--duration-normal) var(--ease-out);
}

.pill:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

/* ────────────────────────────────────────────────────
   Divider
   ──────────────────────────────────────────────────── */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  margin-bottom: 1.25rem;
}

/* ────────────────────────────────────────────────────
   Form
   ──────────────────────────────────────────────────── */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

@media (min-width: 520px) {
  .form-row {
    flex-direction: row;
    align-items: stretch;
    gap: 0.5rem;
  }

  .input {
    flex: 1;
    min-width: 0;
  }

  .btn {
    flex-shrink: 0;
    min-width: 9rem;
  }
}

.input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.625rem;
  color: #f0f2f8;
  font-size: 0.9375rem;
  padding: 0.75rem 0.9rem;
  outline: none;
  transition:
    border-color var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    background var(--duration-normal) var(--ease-out);
}

.input::placeholder {
  color: rgba(120, 128, 152, 0.85);
}

.input:focus {
  border-color: rgba(53, 158, 238, 0.5);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: 0 0 0 3px rgba(53, 158, 238, 0.12);
}

.input:disabled {
  opacity: 0.55;
}

/* ────────────────────────────────────────────────────
   Button
   ──────────────────────────────────────────────────── */
.btn {
  appearance: none;
  border: none;
  border-radius: 0.625rem;
  background: linear-gradient(135deg, #359eee 0%, #03cea4 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.9375rem;
  padding: 0.75rem 1.15rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    filter var(--duration-normal) var(--ease-out);
  box-shadow:
    0 2px 16px rgba(53, 158, 238, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 50%);
  pointer-events: none;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow:
    0 4px 28px rgba(53, 158, 238, 0.38),
    0 0 40px rgba(3, 206, 164, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

/* ────────────────────────────────────────────────────
   Loading spinner
   ──────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ────────────────────────────────────────────────────
   Feedback
   ──────────────────────────────────────────────────── */
.feedback {
  margin-top: 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.feedback.is-error {
  color: rgba(248, 154, 154, 0.95);
}

/* ────────────────────────────────────────────────────
   Privacy
   ──────────────────────────────────────────────────── */
.privacy {
  margin-top: 1rem;
  font-size: 0.725rem;
  color: rgba(100, 108, 132, 0.85);
  line-height: 1.5;
}

/* ────────────────────────────────────────────────────
   Success state
   ──────────────────────────────────────────────────── */
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem 0 0.75rem;
}

.success-icon {
  margin-bottom: 1.25rem;
}

.checkmark {
  width: 56px;
  height: 56px;
}

.checkmark-circle {
  stroke: #03cea4;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: circle-draw 0.65s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

.checkmark-check {
  stroke: #03cea4;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: check-draw 0.35s 0.45s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

@keyframes circle-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes check-draw {
  to {
    stroke-dashoffset: 0;
  }
}

.success-title {
  font-size: 1.375rem;
  font-weight: 650;
  color: #f0f2f8;
  margin-bottom: 0.5rem;
}

.success-text {
  font-size: 0.9rem;
  color: rgba(160, 168, 190, 0.9);
  line-height: 1.6;
  max-width: 28ch;
}

/* ────────────────────────────────────────────────────
   View transitions (form ↔ success)
   ──────────────────────────────────────────────────── */
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Error message slide */
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ────────────────────────────────────────────────────
   Footer
   ──────────────────────────────────────────────────── */
.footer {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem 2rem;
  font-size: 0.725rem;
  color: rgba(100, 108, 132, 0.6);
  pointer-events: none;
}

.footer-brand {
  font-weight: 500;
  color: rgba(100, 108, 132, 0.8);
}

.footer-sep {
  opacity: 0.5;
}

/* ────────────────────────────────────────────────────
   Screen-reader only
   ──────────────────────────────────────────────────── */
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
</style>
