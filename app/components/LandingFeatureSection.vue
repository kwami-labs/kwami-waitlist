<script setup lang="ts">
const props = defineProps<{
  letter: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <section class="feature-section">
    <div class="feature-content">
      <div class="feature-letter">{{ props.letter }}</div>
      <h2 class="feature-title">{{ props.title }}</h2>
      <p class="feature-description">{{ props.description }}</p>
    </div>
  </section>
</template>

<style scoped>
.feature-section {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 48vw) minmax(18rem, 32rem);
  align-items: center;
  justify-content: center;
  column-gap: clamp(1rem, 3vw, 2rem);
  padding: 4rem clamp(2rem, 8vw, 6rem);
  position: relative;
  z-index: 12;
}

.feature-content {
  grid-column: 2;
  max-width: 32rem;
  text-align: left;
  justify-self: start;
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

@media (max-width: 780px) {
  .feature-section {
    grid-template-columns: 1fr;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
  }
}
</style>
