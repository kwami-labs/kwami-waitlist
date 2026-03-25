<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
  }>(),
  { width: '110px' },
);

const gradientId = `wl-logo-${Math.random().toString(36).slice(2, 8)}`;

const wordmarkPath =
  'M 224.8 70 L 224.8 67.1 L 264.2 67.1 L 264.2 7.2 L 241.7 55.4 L 219.2 7.1 L 219.2 70.1 L 216.2 70 L 216.2 0 L 219.2 0 L 241.7 48.3 L 264.2 0.1 L 267.2 0 L 267.2 70.1 L 224.8 70 Z M 133.7 3.1 L 71.1 3.1 L 71.1 0.1 L 138 0.1 L 112.5 70.2 L 99.5 34.6 L 86.6 70.2 L 61.1 0.1 L 64.3 0.1 L 86.6 61.4 L 99.5 25.8 L 112.5 61.4 L 133.7 3.1 Z M 157.4 70.1 L 157.4 67.1 L 194.2 67.1 L 173 8.8 L 150.7 70.1 L 147.5 70.1 L 173 0 L 198.5 70.1 L 157.4 70.1 Z M 45.8 0.1 L 50.1 0.1 L 16.5 33.5 L 53.3 70.1 L 49 70.1 L 12.2 33.5 L 45.8 0.1 Z M 0 0.1 L 3 0.1 L 3 70.1 L 0 70.1 L 0 0.1 Z M 296 0.1 L 296 70.1 L 293 70.1 L 293 0.1 L 296 0.1 Z';
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 296 70.2"
    preserveAspectRatio="xMidYMid meet"
    class="waitlist-logo"
    :style="{ width }"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EF476F" />
        <stop offset="25%" stop-color="#359EEE" />
        <stop offset="50%" stop-color="#03CEA4" />
        <stop offset="75%" stop-color="#FFC43D" />
        <stop offset="100%" stop-color="#EF476F" />
      </linearGradient>
    </defs>
    <path
      :d="wordmarkPath"
      :stroke="`url(#${gradientId})`"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="3.5"
      fill="none"
      opacity="0.95"
    />
  </svg>
</template>

<style scoped>
.waitlist-logo {
  display: block;
  height: auto;
}
</style>
