NebulaX Supabase migration instructions

WARNING: Do NOT paste or share your Supabase service_role key in public chat. If you shared a secret by mistake, rotate/revoke it immediately.

Files:
- supabase/migrations/001_init.sql    -- initial schema (DDL)

How to run migrations (recommended options)

Option A — Run SQL directly in Supabase SQL Editor
1. Open Supabase Studio -> SQL Editor -> New query
2. Paste the contents of `supabase/migrations/001_init.sql` and run.
3. Review results and ensure no errors.

Option B — Use psql with a Postgres connection string (server-side / safe environment)
1. Get the Postgres connection string from Supabase Dashboard -> Settings -> Database -> Connection string.
2. On your machine (or CI) export the connection string to an env var (PowerShell example):

```powershell
$env:PG_CONN = "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
psql $env:PG_CONN -f supabase/migrations/001_init.sql
```

Option C — Use Supabase CLI (recommended for repeatable migrations)
1. Install Supabase CLI (https://supabase.com/docs/guides/cli)
2. Authenticate with `supabase login` (this stores a token locally)
3. Use the CLI to run SQL file (or push migrations if you're using the migrations structure expected by the CLI).

Notes on credentials and keys
- Public/anon key: used in client code; it's okay to include in front-end builds.
- service_role key: full DB privileges, MUST NOT be exposed to browsers. Store it in CI secrets or a server env var.

If you previously shared a secret in chat (e.g. service_role key), revoke it now:
- Supabase Dashboard -> Settings -> API -> Service Role Key -> Revoke / Rotate

Recommended next steps I can do for you
- Generate more granular migration files (separate DDL for trading, games, launchpad).
- Add RLS policy SQL files (I will mark each policy and explain why it is safe).
- Generate seed scripts to import your localStorage exports into the new tables (Node script + sample mapping).
- Generate example `lib/supabase.js` client and a small `migrations/run-migrations.js` script to run them via `SUPABASE_SERVICE_ROLE_KEY` in CI.

If you want me to generate any of the above files now, tell me which one and I'll add it to the repo.
