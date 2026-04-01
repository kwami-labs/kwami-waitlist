<script setup lang="ts">
const props = defineProps<{
  eyebrow: string;
  heading: string;
  desc: string;
}>();
</script>

<template>
  <section class="phone-feature-section">
    <div class="phone-feature-content">
      <p class="pf-eyebrow">{{ props.eyebrow }}</p>
      <h2 class="pf-heading">{{ props.heading }}</h2>
      <p class="pf-desc">{{ props.desc }}</p>
    </div>
  </section>
</template>

<style scoped>
.phone-feature-section {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 15;
}

.phone-feature-content {
  width: 50%;
  padding-left: clamp(2rem, 8vw, 6rem);
  padding-right: 2rem;
  max-width: 34rem;
}

.pf-eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #03cea4;
  margin-bottom: 0.65rem;
}

.pf-heading {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #f6f8ff;
  margin-bottom: 0.85rem;
  text-shadow: 0 0 28px rgba(53, 158, 238, 0.18);
  white-space: pre-line;
}

.pf-desc {
  font-size: clamp(0.9rem, 1.5vw, 1.05rem);
  line-height: 1.68;
  color: rgba(174, 184, 206, 0.92);
  max-width: 36ch;
}

@media (max-width: 780px) {
  .phone-feature-content {
    width: 100%;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
  }
}
</style>
