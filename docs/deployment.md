# Deployment Guide

CollabFlow is a monorepo with three moving parts: a static React frontend,
a persistent Node/Express backend, and a Python analytics engine the
backend spawns as a subprocess. **Netlify only hosts static sites and
short-lived serverless functions** — it cannot run the persistent backend
or spawn Python. So the deployment splits across two platforms:

| Part | Platform | Why |
|---|---|---|
| Frontend (React build) | **Netlify** | Purpose-built for static SPAs |
| Backend (Express + Python) | **Render** (or Railway/Fly.io) | Needs a long-running container that can `apt-get install python3` |

They're connected by a redirect rule: Netlify proxies any `/api/*` request
to your Render backend URL, so the frontend code never needs to know it's
talking to a different host.

## Step 1 — Push to GitHub

Run these from the project root, on your own machine (not something I can
do for you — it needs your GitHub credentials):

```bash
cd collabflow
git init
git add .
git commit -m "Initial commit: CollabFlow analytics platform"
```

Create a new empty repository on GitHub (github.com → New repository —
don't initialise it with a README, since your local repo already has one),
then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/collabflow.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.env`, and uploaded
datasets, so none of that gets committed.

## Step 2 — Deploy the backend to Render

1. Go to **[render.com](https://render.com)** and sign up/log in (GitHub login is easiest).
2. **New → Blueprint** → connect your `collabflow` GitHub repo. Render will
   detect `render.yaml` at the repo root and configure the service
   automatically (Docker build from `backend/Dockerfile`, health check on
   `/api/health`).
   - If you'd rather configure manually instead of using the blueprint:
     **New → Web Service** → connect the repo → **Runtime: Docker** →
     **Dockerfile path:** `backend/Dockerfile` → **Docker build context:** `.` (repo root, not `backend/`  — this matters, since the Dockerfile copies `analytics/` and `data/` as siblings of `backend/`).
3. Click **Deploy**. The first build takes a few minutes (installs Python,
   pip packages, npm packages).
4. Once live, copy your backend's URL — it'll look like:
   `https://collabflow-backend.onrender.com`
5. Verify it works before moving on:
   ```
   https://collabflow-backend.onrender.com/api/health
   ```
   should return `{"status":"ok",...}`.

**Free tier note:** Render's free web services spin down after 15 minutes
of inactivity and take ~30-50 seconds to wake back up on the next request.
That's normal — the first dashboard load after idle time will be slow, not
broken.

## Step 3 — Point the frontend at your backend

Edit `frontend/public/_redirects` and replace the placeholder with your
actual Render URL from Step 2:

```
/api/*  https://collabflow-backend.onrender.com/api/:splat  200
/*      /index.html   200
```

Commit and push this change:
```bash
git add frontend/public/_redirects
git commit -m "Point frontend at deployed backend"
git push
```

## Step 4 — Deploy the frontend to Netlify

1. Go to **[netlify.com](https://netlify.com)** and sign up/log in.
2. **Add new site → Import an existing project** → connect the same
   `collabflow` GitHub repo.
3. Netlify will detect `netlify.toml` at the repo root and pre-fill:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist` (shown as `dist` relative to base)
4. Click **Deploy**. A few minutes later you'll get a live URL like
   `https://collabflow-yourname.netlify.app`.
5. Open it — the dashboard should load with real data, proxied through to
   your Render backend.

Optional: in Netlify's site settings you can set a custom subdomain
(**Site configuration → Change site name**).

## Updating after changes

Both platforms auto-deploy on every push to `main` by default. To ship a
change:
```bash
git add .
git commit -m "your change"
git push
```
Render rebuilds the backend Docker image; Netlify rebuilds the frontend.

## Known limitations of this deployment shape

- **Uploaded datasets don't persist across backend restarts.** Render's
  free tier containers have an ephemeral filesystem, and the free tier
  restarts on idle. Someone's uploaded file (and the in-memory session
  tracking it) is lost when that happens. The bundled dissertation
  dataset always survives, since it's baked into the Docker image.
- **The collaboration workspace (tasks/projects/etc.) is in-memory only**
  (see `docs/architecture.md`) — the same restart caveat applies there.
- **PostgreSQL is not deployed in this guide.** Nothing in the current
  feature set requires it yet (see architecture doc); add a Render
  Postgres instance and set `DATABASE_URL` when you wire up the
  collaboration module or auth for real.
- **CORS** is currently wide open (`cors()` with no options) in
  `backend/src/server.js`, which is fine for this deployment shape but
  worth tightening (`origin: "https://your-netlify-url.netlify.app"`)
  if you want to lock the API down to only your frontend.

## Alternative to Render

Any platform that can build from a Dockerfile and run a persistent
container works the same way — **Railway** and **Fly.io** are both solid
free-tier alternatives with a nearly identical "connect repo → point at
Dockerfile → deploy" flow. The `netlify.toml` / `_redirects` setup on the
frontend side doesn't change; you'd just swap the backend URL.
