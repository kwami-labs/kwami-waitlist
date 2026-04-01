<script setup lang="ts">
const props = defineProps<{
  status: 'idle' | 'loading' | 'success' | 'error';
  email: string;
  canSubmit: boolean;
  style?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:email', value: string): void;
  (e: 'submit'): void;
}>();
</script>

<template>
  <header class="floating-header" :style="style">
    <div class="header-left">
      <LandingLogo width="92px" />
      <span class="header-title">KWAMI</span>
    </div>
    <form v-if="props.status !== 'success'" class="header-form" @submit.prevent="emit('submit')">
      <label class="sr-only" for="landing-email-header">Email</label>
      <input
        id="landing-email-header"
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
        <span v-else class="btn-inner">Join</span>
      </button>
    </form>
  </header>
</template>

<style scoped>
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

  .btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
