// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4-style layout: app code lives under app/
  srcDir: 'app/',

  compatibilityDate: '2025-03-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase'],

  css: ['~/assets/css/variables.css', '~/assets/css/main.css'],

  app: {
    head: {
      title: 'Kwami — Join the waitlist',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Be first in line for kwami.io — 3D AI companions. Join the waitlist for launch updates.',
        },
        { name: 'theme-color', content: '#050608' },
        { property: 'og:title', content: 'Kwami — Join the waitlist' },
        {
          property: 'og:description',
          content: 'Be first in line for kwami.io. Join the waitlist.',
        },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/sphere.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
  },

  supabase: {
    redirect: false,
    types: false,
  },

  vite: {
    optimizeDeps: {
      include: ['three'],
    },
  },
})
