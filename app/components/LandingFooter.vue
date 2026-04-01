<script setup lang="ts">
const exploreLinks = [
  { label: 'Soul', href: '#soul' },
  { label: 'Memory', href: '#memory' },
  { label: 'Voice', href: '#voice' },
  { label: 'Tools', href: '#tools' },
]

const openSourceLinks = [
  { label: 'Kwami App', href: 'https://github.com/kwami-labs/kwami-app' },
  { label: 'Kwami LK API', href: 'https://github.com/alexcolls/kwami-lk-api' },
  { label: 'Kwami SDK', href: 'https://github.com/alexcolls/kwami-ai' },
]
</script>

<template>
  <footer class="landing-footer">
    <div class="footer-shell">
      <div class="footer-brand">
        <LandingLogo width="180px" />
        <p class="footer-tagline">
          AI companions that feel alive.
        </p>
        <p class="footer-note">
          Voice, memory, soul, and tools in one living interface.
        </p>
      </div>

      <nav class="footer-links" aria-label="Footer">
        <div class="footer-column">
          <h3 class="footer-heading">Explore</h3>
          <a v-for="link in exploreLinks" :key="link.href" class="footer-link" :href="link.href">
            {{ link.label }}
          </a>
        </div>

        <div class="footer-column">
          <h3 class="footer-heading">Open Source</h3>
          <a
            v-for="link in openSourceLinks"
            :key="link.href"
            class="footer-link"
            :href="link.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ link.label }}
          </a>
        </div>
      </nav>
    </div>

    <div class="footer-bottom">
      <span>kwami.io</span>
      <span>&copy; 2026</span>
    </div>
  </footer>
</template>

<style scoped>
.landing-footer {
  position: relative;
  z-index: 16;
  padding: 7rem clamp(1.5rem, 5vw, 4rem) 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 20% 10%, rgba(53, 158, 238, 0.08), transparent 30%),
    radial-gradient(circle at 80% 20%, rgba(3, 206, 164, 0.06), transparent 26%),
    rgba(5, 7, 12, 0.85);
  backdrop-filter: blur(10px);
}

.footer-shell {
  width: min(100%, 78rem);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(18rem, 1.2fr) minmax(18rem, 1fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: start;
}

.footer-brand {
  max-width: 30rem;
}

.footer-tagline {
  margin: 1.1rem 0 0.6rem;
  font-size: clamp(1.3rem, 2.8vw, 2.1rem);
  line-height: 1.05;
  font-weight: 800;
  color: #f7f9ff;
}

.footer-note {
  font-size: 0.98rem;
  line-height: 1.7;
  color: rgba(184, 192, 212, 0.9);
  max-width: 40ch;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(8rem, 1fr));
  gap: 2rem;
}

.footer-column {
  display: grid;
  gap: 0.7rem;
}

.footer-heading {
  margin: 0 0 0.4rem;
  font-size: 0.76rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(150, 160, 184, 0.86);
}

.footer-link {
  color: rgba(240, 244, 255, 0.92);
  text-decoration: none;
  font-size: 0.98rem;
  transition: color 0.18s ease, transform 0.18s ease;
}

.footer-link:hover {
  color: #03cea4;
  transform: translateX(2px);
}

.footer-bottom {
  width: min(100%, 78rem);
  margin: 2.8rem auto 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.84rem;
  color: rgba(132, 142, 166, 0.82);
}

@media (max-width: 780px) {
  .footer-shell {
    grid-template-columns: 1fr;
  }

  .footer-links {
    grid-template-columns: 1fr 1fr;
  }

  .footer-bottom {
    flex-direction: column;
  }
}
</style>
