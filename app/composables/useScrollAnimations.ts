import { ref, computed, onMounted, onUnmounted } from 'vue';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useScrollAnimations() {
  const scrollY = ref(0);
  const viewportH = ref(1);
  const viewportW = ref(1);

  // Phase 1: Hero collapse (0 → 1vh)
  const heroProgress = computed(() => clamp(scrollY.value / (viewportH.value * 0.95), 0, 1));
  const collapseProgress = computed(() => clamp((heroProgress.value - 0.1) / 0.8, 0, 1));
  const infoFade = computed(() => 1 - clamp((heroProgress.value - 0.35) / 0.45, 0, 1));

  // Phase 2: Features (1vh → 5vh) — blob stays left during this phase
  const featuresScrollStart = computed(() => viewportH.value * 1.0);
  const featuresScrollEnd = computed(() => viewportH.value * 5.0);

  // Phase 3-4: Phone enters + blob shrinks into phone (5vh → 7.5vh)
  const phoneProgress = computed(() => {
    const start = viewportH.value * 4.1;
    const end = viewportH.value * 5.8;
    return clamp((scrollY.value - start) / (end - start), 0, 1);
  });

  const blobPhoneProgress = computed(() => {
    const start = viewportH.value * 4.35;
    const end = viewportH.value * 6.0;
    return clamp((scrollY.value - start) / (end - start), 0, 1);
  });

  // MEMORY graph takeover: enters from bottom, crosses, then exits to top.
  const memoryGraphProgress = computed(() => {
    const start = viewportH.value * 1.55;
    const end = viewportH.value * 3.75;
    return clamp((scrollY.value - start) / (end - start), 0, 1);
  });

  // Fade the blob out during the MEMORY section, then bring it back.
  const memoryBlobOpacity = computed(() => {
    const start = viewportH.value * 1.75;
    const end = viewportH.value * 3.25;
    const p = clamp((scrollY.value - start) / (end - start), 0, 1);
    return 1 - Math.sin(p * Math.PI);
  });

  const memoryGraphStyle = computed(() => {
    const p = memoryGraphProgress.value;
    let translateY = 55;
    let opacity = 0;

    if (p <= 0.5) {
      const t = p / 0.5;
      translateY = (1 - t) * 55;
      opacity = t;
    } else {
      const t = (p - 0.5) / 0.5;
      translateY = -t * 55;
      opacity = 1 - t * 0.15;
    }

    return {
      transform: `translate3d(0, ${translateY}vh, 0)`,
      opacity: String(opacity),
    };
  });

  // Blob positioning: left during hero/features, then right into phone
  const blobStyle = computed(() => {
    const p = blobPhoneProgress.value;
    const heroShift = -22 * collapseProgress.value;
    const phoneShift = 25 * p;
    const shiftX = heroShift * (1 - p) + phoneShift;
    const shiftY = -12 * p;
    return {
      transform: `translate3d(${shiftX}vw, ${shiftY}vh, 0)`,
      opacity: String(memoryBlobOpacity.value),
    };
  });

  // ---------------------------------------------------------------------------
  // Hero → Header: title travels from center to top-left, form to top-right.
  // Both are fixed-position elements; we interpolate their position/scale.
  // ---------------------------------------------------------------------------

  // Eased progress for smoother motion
  const easeProgress = computed(() => {
    const t = collapseProgress.value;
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
  });

  // Title: starts centered at ~50vw, 50vh → ends at top-left ~1.2rem, 0.9rem
  // Scale: hero size → header size (roughly 0.3x of original)
  const titleStyle = computed(() => {
    const p = easeProgress.value;
    const vw = viewportW.value;
    const vh = viewportH.value;

    // Start position: center of viewport (the hero centers it via grid)
    // We position the title using left/top on a fixed element.
    // Start: centered horizontally (50%), vertically at ~45%
    // End: left at 1.2rem, top at 0.7rem
    const startLeft = vw / 2;
    const startTop = vh * 0.45;
    const endLeft = 80; // ~5rem from left edge
    const endTop = 18;

    const left = lerp(startLeft, endLeft, p);
    const top = lerp(startTop, endTop, p);
    const scale = lerp(1, 0.14, p);

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: 'center center',
      opacity: String(1 - 0.05 * p),
      zIndex: '31',
      pointerEvents: 'none' as const,
      willChange: 'transform, left, top',
    };
  });

  // Form: starts centered below title → ends at top-right
  const introFormStyle = computed(() => {
    const p = easeProgress.value;
    const vw = viewportW.value;
    const vh = viewportH.value;

    // Start: centered, below midpoint (~58% of vh)
    // End: right side of header bar
    const startLeft = vw / 2;
    const startTop = vh * 0.62;
    const endLeft = vw - 180; // ~180px from right edge
    const endTop = 24;

    const left = lerp(startLeft, endLeft, p);
    const top = lerp(startTop, endTop, p);
    const scale = lerp(1, 0.82, p);

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: 'center center',
      zIndex: '31',
      pointerEvents: (p > 0.85 ? 'auto' : 'auto') as 'auto' | 'none',
      willChange: 'transform, left, top',
    };
  });

  // Header background: fades in once elements reach header position
  const headerBgOpacity = computed(() => clamp((collapseProgress.value - 0.6) / 0.4, 0, 1));

  // Intro copy (lede + pills) style
  const introCopyStyle = computed(() => ({
    opacity: String(infoFade.value),
    transition: 'opacity 180ms ease',
  }));

  function updateScrollMetrics() {
    scrollY.value = window.scrollY || 0;
    viewportH.value = window.innerHeight || 1;
    viewportW.value = window.innerWidth || 1;
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

  return {
    scrollY,
    viewportH,
    viewportW,
    heroProgress,
    collapseProgress,
    infoFade,
    featuresScrollStart,
    featuresScrollEnd,
    phoneProgress,
    blobPhoneProgress,
    memoryGraphProgress,
    memoryBlobOpacity,
    memoryGraphStyle,
    blobStyle,
    titleStyle,
    introFormStyle,
    headerBgOpacity,
    introCopyStyle,
  };
}
