# Paperclip UI Deploy Attempt — Status

**Date:** 2026-06-07  
**Branch:** ultron/what-s-in-this-rpeo-cc6cdd  
**Base commit:** 9417435 (from master)

---

## What We Tried

1. **Cloned the repo** to `/work/paperclip`
2. **Installed dependencies** with `pnpm install` — succeeded (Scope: all 24 workspace projects)
3. **Built the UI with `pnpm build`** — succeeded in ~22s (5,380 modules)
4. **Attempted to deploy the `dist/` to WFP** — failed (Cloudflare credentials not configured on server)
5. **Attempted local preview server (`vite preview`)** — kept crashing due to `selfsigned` / crypto module issues. Band-aided with `npx -y serve` but unreliable.
6. **Attempted Vercel deploy** — failed (missing vercel.json, also WFP/Vercel deps not available on this server)

---

## What Works

- ✅ **pnpm install** works for the entire monorepo
- ✅ **pnpm build** in `ui/` produces a valid `dist/` folder (~4MB index.js bundle + CSS)
- ✅ **Static SPA built** successfully (vite + react + tailwind)

---

## What's Blocking Live Preview

1. **WFP deploy** — The server reports `Cloudflare credentials not available` (needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`).
2. **WFP not running** — Adding the required env vars isn't accessible from this sandbox.
3. **Preview server (`vite preview`)** — Keeps crashing with crypto-related errors (`selfsigned`, `getKeys`). Likely due to Node 22 / OpenSSL compatibility issues with the `@vitejs/plugin-preview` code paths.

---

## How to Preview Locally

You can rebuild and preview the UI on any machine with Node 20+ and pnpm:

```bash
git clone https://github.com/catalin-ultron/paperclip.git
cd paperclip
pnpm install                   # installs all 24 workspace packages
pnpm --filter @paperclipai/ui build  # builds only the UI package
pause - or just -
cd ui && pnpm preview          # or pnpm preview --host 0.0.0.0
```

The UI is a **React + Vite + Tailwind** static SPA that proxies `/api` to `localhost:3100`. Without the backend, the app shell renders but API calls obviously fail.

---

## What the UI Is

From the source analysis:
- **Dashboard** (React 19, Vite 6)
- **Drag-and-drop** task board (using @dnd-kit)
- **AI agent config UI** (React Query + lexical editor + markdown support)
- **Visual diagrams** (Mermaid, Cytoscape)
- **Tailwind CSS v4** styling system with shadcn/radix primitives
- **Adaptive dark/light mode**

---

## Next Step if You Want a Deployable Preview

1. Add the UI root entry point to Vite config (if needed).
2. Add `vercel.json` or `_redirects` for SPA fallback routing.
3. Deploy via `deploy_wfp` once credentials are available on this server.
4. Or manually deploy the `dist/` folder to any static host (Netlify, Cloudflare Pages, Vercel).

---
