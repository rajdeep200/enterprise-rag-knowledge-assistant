Production deployment guide (Vercel + Neon + Upstash + S3 + Render)

Overview
- Web app: Vercel (Next.js)
- PostgreSQL: Neon (pgvector enabled)
- Redis: Upstash
- Object storage: AWS S3 / DigitalOcean Spaces (S3-compatible)
- Worker: Render (Background Worker)

Prerequisites
- GitHub repo pushed (done)
- Vercel account
- Neon or Supabase account
- Upstash account
- AWS or DO Spaces credentials (S3-compatible)
- Render account for the worker

1) Create production DB (Neon)
- Create a Neon project and copy the connection string.
- Ensure `pgvector` and `pgcrypto` are available (Neon provides pgvector image).

2) Create Redis (Upstash)
- Create a Redis instance (Free plan OK) and copy `REDIS_URL`.

3) Create S3 bucket
- Create a bucket in AWS S3 or DigitalOcean Spaces.
- Note `S3_BUCKET`, access key, secret, region, and endpoint (Spaces provide endpoint).

4) Add secrets to GitHub
- Go to your GitHub repo → Settings → Secrets → Actions
- Add the following secrets:
  - `DATABASE_URL` (Neon connection string)
  - `REDIS_URL` (Upstash connection string)
  - `OPENAI_API_KEY`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET`
  - `S3_REGION` (if applicable)
  - Optional: `RUN_SEED=true` if you want the seed step to run in the workflow

5) Configure Vercel (web)
- Import the GitHub repo.
- Build command: `npm run build`
- Environment Variables (Vercel dashboard → Project → Settings → Environment Variables)
  - `DATABASE_URL` (set to secret value)
  - `REDIS_URL` (set to secret value)
  - `OPENAI_API_KEY`
  - `JWT_SECRET` (generate a long random string)
  - `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.vercel.app`)
  - `STORAGE_ADAPTER` = `s3`
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, and `S3_ENDPOINT` (if needed)
- Deploy; Vercel will build on push to `main`.

6) Run database migrations
- Either run the GitHub Actions workflow (Actions → Prisma migrate → Run workflow)
- Or run locally (with `DATABASE_URL` pointing at prod) and execute:
  ```bash
  npm ci
  npx prisma generate
  npx prisma migrate deploy
  ```

7) Deploy the worker (Render)
- Create a new service on Render (Background Worker)
- Connect to the same GitHub repo
- Build command: `npm ci && npm run prisma:generate && npm run build` (optional generate)
- Start command: `npm run worker:prod`
- Set the same env variables on Render (DATABASE_URL, REDIS_URL, OPENAI_API_KEY, JWT_SECRET, STORAGE_ADAPTER and S3 creds)

8) Post-deploy checks
- Login (use seeded admin or register)
- Upload a PDF (admin) and verify the worker picks it up and processes it to `PROCESSED`.
- Check Vercel and Render logs for errors.

Notes
- Vercel's filesystem is ephemeral — use S3 for persistent storage.
- Make sure both web and worker share the same S3 bucket and credentials.
- Monitor costs for OpenAI usage.

If you want, I can:
- Create the GitHub Secrets for you (I cannot access your account, but I can provide the exact keys to set).
- Walk you through Vercel/Neon/Upstash/Render UI steps interactively.
- Trigger the GitHub Actions workflow once you set `DATABASE_URL` in Secrets.
