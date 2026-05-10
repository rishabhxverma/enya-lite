# Deploy — Vercel

This project deploys to Vercel. Next.js is Vercel's home framework, so the
SSR API routes, server actions, and per-request rendering all just work
without extra config.

## One-time setup (do this on the machine where you'll deploy)

```bash
# 1. Authenticate (opens browser; pick the email tied to your Vercel account)
npx vercel login

# 2. Link this repo to a Vercel project
npx vercel link
#   - Set up "Enya Lite"? → yes
#   - Which scope? → your personal account (or team)
#   - Link to existing project? → no (first time) / yes (later)
#   - Project name → enya-lite
#   - In which directory? → ./
#   This writes .vercel/project.json (gitignored).

# 3. Set the production environment variables
#    Run for each secret. CLI prompts for the value and which environments
#    to apply it to (Production / Preview / Development — pick all three).
npx vercel env add BACKBOARD_API_KEY
npx vercel env add BACKBOARD_ASSISTANT_ID
npx vercel env add OPENAI_API_KEY
npx vercel env add ELEVENLABS_API_KEY
npx vercel env add ELEVENLABS_AGENT_ID
npx vercel env add YOUTUBE_API_KEY

# Public flags (default to empty / "false" / "live" / "auto" in apphosting.yaml;
# Vercel reads these the same way Next does):
npx vercel env add NEXT_PUBLIC_USE_SEED_FALLBACK   # → false
npx vercel env add NEXT_PUBLIC_VOICE_MODE          # → live
npx vercel env add NEXT_PUBLIC_IMAGE_MODE          # → auto
npx vercel env add BACKBOARD_API_URL               # → https://api.backboard.io

# 4. First production deploy
npx vercel --prod
```

Output: `https://enya-lite.vercel.app` (or whichever URL Vercel assigns).

## Daily dev loop

Two equivalent options:

```bash
npm run dev          # plain Next.js dev server (http://localhost:3000)
                     # Use this when you don't need cloud env vars locally.

npm run vercel:dev   # Same Next.js HMR, but env vars resolve from Vercel.
                     # Use this when developing API integrations that need
                     # production keys (Backboard, ElevenLabs, etc).
```

Both have full Hot Module Reload — edit a file, save, the browser updates.
The difference is where env vars come from:

| Mode | Env source |
|---|---|
| `npm run dev` | `.env.local` only |
| `npm run vercel:dev` | Vercel cloud (Development env), then `.env.local` overrides |

Pull a snapshot of cloud env into `.env.local`:

```bash
npm run vercel:env:pull   # writes .env.local from Vercel "development" env
```

## Auto-deploy on push

Vercel auto-creates two kinds of deployments:

- **Production** — every push to `master` → live URL updates.
- **Preview** — every push to any other branch → unique
  `enya-lite-git-<branch>-<scope>.vercel.app` URL with the latest build.
  Comment-bot will paste the URL on PRs if you connect Vercel to GitHub.

This is the "hot refresh" workflow: push a branch, get a fresh deployment
URL in ~60s, share it for review. Pushing again to the same branch updates
that same URL in place.

To wire GitHub → Vercel auto-deploy (recommended for the team workflow):

1. Open the project in Vercel dashboard
2. Settings → Git → Connect Git Repository → pick `rishabhxverma/enya-lite`
3. Choose `master` as the production branch (already configured in
   `vercel.json`)

Once connected, you can stop running `vercel --prod` manually — every
`git push origin master` triggers production rollout.

## Manual deploys (if you need them)

```bash
npm run vercel:preview   # deploy to a fresh preview URL
npm run vercel:deploy    # deploy to production (master URL)
```

## Inspect a running deployment

```bash
npx vercel ls                   # list recent deployments
npx vercel logs <url>           # tail logs of a specific deployment
npx vercel inspect <url>        # build details, function regions, etc.
```

## Demo escape hatch (still works on Vercel)

In the deployed app's browser console:

```js
localStorage.USE_SEED_FALLBACK = 'true'; location.reload();
```

All student-data reads short-circuit to `/seed/*.json` (served as static
assets by Vercel). Useful if a live integration is misbehaving on stage.

## Known constraints

- **Docling sidecar** (`docling-sidecar/main.py`) is a separate Python
  FastAPI service. Vercel's serverless functions don't natively run Python
  long-running processes — deploy it separately to Render / Fly.io / Cloud
  Run, then set `DOCLING_SIDECAR_URL` to that public URL. Until then PDF
  uploads fall back to the keyword-dispatch stub (which is fine for the
  demo).
- **Voice MP3 fallback** at `/seed/voice-fallback-{studentId}.mp3` is a
  static file. If you want real audio in simulated mode, drop the MP3
  files in `public/seed/` before deploying.
