<script setup lang="ts">
const props = defineProps<{
  infoFade: number;
  introCopyStyle: Record<string, string>;
}>();
</script>

<template>
  <section class="hero-section">
    <div class="hero-inner">
      <!-- <div class="intro-copy" :style="props.introCopyStyle">
        <p class="lede">
          3D companions that hear you, speak with you, and evolve with your style.
        </p>
        <div class="features-pills">
          <span class="pill">3D Avatars</span>
          <span class="pill">Voice AI</span>
          <span class="pill">Real-time</span>
        </div>
      </div> -->
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

.intro-copy {
  margin-top: 1.2rem;
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
</style>
