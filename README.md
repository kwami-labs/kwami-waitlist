# kwami-waitlist

Single fullscreen, non-scrolling landing page for kwami.io. An animated 3D blob
fills the viewport behind the wordmark and an email capture form that writes
straight to Supabase from the browser.

There is no server code — the site is fully prerendered and served from
Cloudflare's CDN.

## The blob

`app/components/Blob.vue` cycles through the library's 12 curated presets
(`avatarBlobPresets`) every 7s, morphing between them via `setTransitionSpeed`
rather than snapping. Each preset is a designed look — coordinated palette,
matched shininess/opacity/light, tuned spikes and wave timing.

Two things are deliberately overridden per preset: **scale**, because the hero
needs the blob sized to fill the viewport, and **resolution**, which is capped
at 160 on viewports ≤768px since presets go up to 280.

Cursor tracking and click pulses use the renderer's own `setCursorFollowEnabled`
and `triggerPulse`. Preset cycling is disabled under
`prefers-reduced-motion: reduce`, which settles on a single look.

Note that the presets only use 3 of the 22 available skins (`radial`, `banded`,
`striped`) — chrome, jade, hologram, iridescent, plasma and the rest never
appear.

## Stack

| Piece | What it does |
| --- | --- |
| Nuxt 3 (`srcDir: app/`) | Builds the page; prerendered by `nuxt generate` |
| `kwami` | The 3D blob renderer (three.js under the hood) |
| `@nuxtjs/supabase` | Browser-side client for the waitlist insert |
| Cloudflare Workers static assets | Hosting |

## Local development

```bash
pnpm install
cp .env.example .env      # fill in your Supabase project URL + publishable key
pnpm dev                  # http://localhost:3000
```

This project uses **pnpm**. `package.json` pins it via `packageManager`, and
`bun.lock` / `package-lock.json` / `yarn.lock` are gitignored so a stray
`bun install` or `npm install` can't shadow `pnpm-lock.yaml`.

Other scripts:

```bash
pnpm typecheck            # vue-tsc --noEmit
pnpm generate             # static build -> .output/public
pnpm cf:preview           # serve the built output through wrangler
```

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | yes | e.g. `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | yes | **Publishable** (anon) key only |

Both are read at **build** time and baked into the client bundle, so they must
be set wherever `pnpm generate` runs. That is fine for the publishable key —
it is designed to be public, and Row Level Security is what actually protects
the table. Never put the service-role key here.

## Database

`supabase/migrations/001_waitlist_signups.sql` creates `waitlist_signups` with
RLS enabled: `anon` and `authenticated` may `INSERT` but `SELECT` returns
nothing. A unique index on `lower(email)` makes duplicate signups fail with
Postgres error `23505`, which the form surfaces as "That email is already on
the waitlist."

Apply it with the Supabase CLI or by pasting it into the SQL editor.

## Deploying to Cloudflare

`wrangler.jsonc` declares an **assets-only Worker**: there is no `main`
entrypoint, so requests are served directly from the CDN and no Worker code is
invoked (no per-request billing).

### Deploy from this machine

```bash
pnpm exec wrangler login   # once
pnpm cf:deploy             # pnpm generate && wrangler deploy
```

Use `pnpm cf:deploy:dry` to validate without uploading.

### Deploy on git push (Cloudflare Workers Builds)

Connect the repo in the Cloudflare dashboard with:

- **Build command:** `pnpm generate`
- **Deploy command:** `npx wrangler deploy`
- **Build output directory:** `.output/public`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_KEY`

This app depends on the published `kwami@^2.1.0` package from npm (not a
local `file:` path), so Workers Builds can install dependencies normally.

If a build still fails looking for `/opt/buildhome/kwami`, it is almost
certainly a **retry of an old commit** that still used `file:../kwami`, or a
stale dependency cache. Trigger a new build from latest `main` (or clear the
Workers Builds dependency cache under **Settings → Builds**), do not retry the
old failed job.

## Restoring the long-form landing page

This page previously scrolled through feature sections, a 3D phone, and a
memory graph. That version was removed, not deleted — it is commit `7e28d67`,
the parent of the strip:

```bash
git show 7e28d67:app/pages/index.vue
```

The components it drove still live in `app/components/` (`FeatureSection`,
`SoulSection`, `PhoneFeatureSection`, `Phone`, `MemoryGraph3D`, `Footer`,
`HeroSection`) along with `app/composables/useScrollAnimations.ts`. Unused
components are tree-shaken, so they cost nothing in the current bundle.

Their binary assets **were** deleted to get the deploy from 15 MB down to
1.7 MB — `public/phone*.glb`, `public/voices/`, `app/assets/song.mp3`. Recover
them the same way if you bring the sections back:

```bash
git checkout 7e28d67 -- public/phone.glb public/voices
```
