# JSON Database Guide for Local Development

This guide explains how to use the lightweight JSON file-based database for local development without Docker.

## Overview

The JSON DB system allows you to run the Medfin app locally without Supabase Docker containers. Data is stored in `.data/` directory as JSON files.

## Quick Start

### 1. Run with JSON DB (no Docker needed)

```bash
npm run dev:jsondb
```

This command sets `NEXT_PUBLIC_USE_JSON_DB=true` and starts the dev server.

### 2. Access pages in debug mode

All pages now support `?debug=true` parameter for easy testing:

- `http://localhost:3000/dashboard?debug=true`
- `http://localhost:3000/prestaciones?debug=true`
- `http://localhost:3000/instituciones?debug=true`
- `http://localhost:3000/presupuesto?debug=true`
- `http://localhost:3000/prestaciones/nueva?debug=true`

Debug mode only works in development (`NODE_ENV=development`).

## How It Works

### Server-Side (API Routes & Server Components)

When `NEXT_PUBLIC_USE_JSON_DB=true`:
- `lib/supabase/server.ts` uses `createJsonDbClient()` from `lib/db/json-db.ts`
- Data is read/written to `.data/*.json` files
- Mock auth returns a fixed user (id: `local-user-id`)

### Client-Side (Browser)

When `NEXT_PUBLIC_USE_JSON_DB=true`:
- `lib/supabase/client.ts` uses `createJsonDbClient()` from `lib/db/json-db-client.ts`
- Client makes fetch requests to `/api/json-db/[[...path]]`
- API route handles file operations

### Data Storage

JSON files stored in `.data/`:
- `prestaciones.json`
- `instituciones.json`
- `reglas_plazo.json`
- `profiles.json`
- `tax_settings.json`

These files are gitignored and persist between runs.

## Switching Back to Supabase

To use the real Supabase (requires Docker):

```bash
# Start Supabase
npm run supabase:start

# Run dev server (without JSON DB)
npm run dev
```

## Supported Query Methods

The JSON DB supports these Supabase-like query chains:

```typescript
// Equality filter + order + single result
.eq('user_id', 'xxx').order('fecha', { ascending: false }).single()

// Multiple filters + order + limit
.eq('user_id', 'xxx').gte('fecha', '2024-01-01').order('fecha').limit(100)

// Not null filter
.not('email', 'is', null).order('nombre')

// OR queries (simplified)
.or('estado.neq.pagada').order('fecha').limit(100)
```

## Limitations

1. **No real-time subscriptions** - JSON DB doesn't support Supabase realtime
2. **Single user only** - Mock auth always returns the same user
3. **No advanced queries** - Complex OR conditions, joins not fully supported
4. **File-based** - Not suitable for production or multi-user scenarios

## File Structure

```
lib/
  db/
    json-db.ts          # Server-side file operations
    json-db-client.ts   # Client-side API adapter
    mock-auth.ts        # Mock user/session
  supabase/
    server.ts           # Toggles between Supabase and JSON DB
    client.ts           # Toggles between Supabase and JSON DB

app/
  api/
    json-db/
      [[...path]]/
        route.ts        # API route for CRUD operations
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_USE_JSON_DB=false  # Set to 'true' for JSON DB mode
```

## Troubleshooting

### Build errors with JSON DB

The JSON DB uses `any` types internally. Build with `--no-lint`:

```bash
NEXT_PUBLIC_USE_JSON_DB=true npm run build -- --no-lint
```

### Data not persisting

Check that `.data/` directory exists and is writable:

```bash
ls -la .data/
```

### TypeScript errors in IDE

The QueryResult class implements a Thenable interface. Some IDE errors about `Property 'data' does not exist` are expected due to type unions with Supabase types. The build will still succeed.
