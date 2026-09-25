# Free Cloud Deployment Guide: Edumerge-360

This guide explains how to deploy `Edumerge-360` to the cloud for free with zero cost.

---

## Option 1: Render.com (Recommended Free Cloud Host)
Render provides a 100% free Node.js Web Service tier that natively supports persistent container runtime and SQLite databases without requiring external database provisioning.

### Step-by-Step Instructions:
1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: add render deployment blueprint"
   git push origin main
   ```
2. **Sign in to [Render.com](https://render.com/)** using your GitHub account (Free tier, no credit card required).
3. **Create New Web Service:**
   * Click **New +** > **Web Service**.
   * Select your GitHub repository (`edumerge-360`).
4. **Configure Settings:**
   * **Name:** `edumerge-360`
   * **Region:** Oregon (US West) or Singapore
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm install && npx prisma db push && npx tsx prisma/seed.ts && npm run build
     ```
   * **Start Command:**
     ```bash
     npm run start
     ```
   * **Instance Type:** `Free` (0.1 CPU, 512 MB RAM)
5. **Environment Variables:**
   Add the following under **Environment Variables**:
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: `file:./dev.db`
   * `JWT_SECRET`: `edumerge-super-secret-key-360-enterprise-campus-os-2026`
6. **Click "Deploy Web Service":**
   Render will automatically pull the repository, run Prisma migrations, seed the database with realistic institutional data, build the Next.js production bundle, and assign a permanent public HTTPS domain:
   👉 `https://edumerge-360.onrender.com`

---

## Option 2: Railway.app (Free Starter Credit)
Railway deploys the project using Docker or Nixpacks in 1 click.

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `edumerge-360` repo.
4. Add environment variables:
   * `DATABASE_URL` = `file:./dev.db`
   * `JWT_SECRET` = `edumerge-super-secret-key-360-enterprise-campus-os-2026`
   * `PORT` = `3000`
5. Click **Deploy**. Railway will build the Docker container and expose a public domain (e.g. `edumerge-360.up.railway.app`).

---

## Option 3: Vercel + Neon Free PostgreSQL
For a serverless edge architecture:

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech/) (free tier, 0.5 GB storage).
2. Copy the PostgreSQL connection string (`postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Push your repo to GitHub and import it on [Vercel](https://vercel.com/).
5. Set `DATABASE_URL` and `JWT_SECRET` in Vercel project environment variables.
6. Deploy!

---

## Option 4: Cloudflare Quick Tunnel (Instant Live Public URL from Localhost)
If you are presenting to interviewers immediately from your local machine, Cloudflare Quick Tunnel gives you a free, public HTTPS URL without needing any accounts, DNS, or server signups:

```powershell
# Run the cloudflared tunnel
cloudflared tunnel --url http://localhost:3000
```
This generates a live public HTTPS endpoint:
`https://<unique-subdomain>.trycloudflare.com`
that can be opened by anyone on the internet.
