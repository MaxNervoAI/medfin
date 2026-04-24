# Local Development Setup Guide

## Prerequisites

- Docker Desktop (running)
- Node.js 18+
- Supabase CLI (`npm install -g supabase`)

## Step-by-Step Setup

### 1. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 2. Start Local Supabase Stack

```bash
npm run supabase:start
```

This will:
- Start Postgres, GoTrue, PostgREST, Storage, and Studio in Docker
- Apply existing migrations from `/supabase/migrations/`
- Seed demo data from `/supabase/seed.sql`

**First startup may take 2-3 minutes** while Docker images download.

### 3. Configure Local Environment

After `supabase start` completes, copy the local credentials:

```bash
cp .env.local.example .env.local
```

The `.env.local.example` file already contains the default local Supabase credentials.

### 4. Start the Next.js App

```bash
npm run dev
```

App runs at **http://localhost:3000**

### 5. Access Local Services

| Service | URL |
|---------|-----|
| Next.js App | http://localhost:3000 |
| Supabase Studio (DB UI) | http://localhost:54323 |
| Email Testing (Inbucket) | http://localhost:54324 |
| Supabase API | http://localhost:54321 |

### 6. Stop Local Stack

```bash
npm run supabase:stop
```

### 7. Reset Database (wipe + re-seed)

```bash
npm run supabase:reset
```

## Local vs Cloud Supabase

This local setup is **completely isolated** from your cloud Supabase project. Key differences:

- **No billing** - free local Docker containers
- **No internet required** after initial Docker pull
- **Destructive testing** safe - reset anytime with `npm run supabase:reset`
- **Email testing** - emails are captured in Inbucket, not actually sent

## Troubleshooting

### Port conflicts
If ports 54321-54324 are in use, edit `supabase/config.toml` to change them.

### Docker not running
```bash
colima start  # or open Docker Desktop
```

### Migration issues
```bash
supabase db reset  # Full reset with re-seed
```

### Auth in local dev
Google OAuth won't work locally without setting up a local OAuth app. For testing, you can use Supabase Studio to manually create a test user, or use email/password auth.
