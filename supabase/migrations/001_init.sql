-- 001_init.sql
-- Initial schema for NebulaX Supabase migration
-- Add additional migrations after this file as needed

-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles (one-to-one with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  email_verified boolean DEFAULT false,
  is_creator boolean DEFAULT false,
  verified_creator boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Wallets (multiple wallets per profile)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS wallets_provider_address_idx ON wallets(provider, address);

-- Tokens
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text,
  mint_address text UNIQUE,
  logo_url text,
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON tokens(symbol);

-- Markets / Pairs
CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_token_id uuid REFERENCES tokens(id),
  quote_token_id uuid REFERENCES tokens(id),
  market_name text,
  status text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  name text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid REFERENCES watchlists(id) ON DELETE CASCADE,
  token_id uuid REFERENCES tokens(id),
  order_key int DEFAULT 0,
  added_at timestamptz DEFAULT now()
);

-- Alerts & Notifications
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  token_id uuid REFERENCES tokens(id),
  kind text NOT NULL,
  params jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  title text,
  body text,
  payload jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Trading: trades, orders, positions, pnl
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  market_id uuid REFERENCES markets(id),
  side text,
  price numeric(30,10),
  size numeric(30,10),
  fee numeric(30,10),
  fee_token_id uuid REFERENCES tokens(id),
  executed_at timestamptz DEFAULT now(),
  order_ref text,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  market_id uuid REFERENCES markets(id),
  side text,
  type text,
  price numeric(30,10),
  size numeric(30,10),
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  market_id uuid REFERENCES markets(id),
  quantity numeric(30,10) DEFAULT 0,
  avg_price numeric(30,10) DEFAULT 0,
  realized_pnl numeric(30,10) DEFAULT 0,
  unrealized_pnl numeric(30,10) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pnl_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  position_id uuid REFERENCES positions(id),
  event_at timestamptz DEFAULT now(),
  realized numeric(30,10),
  unrealized numeric(30,10),
  metadata jsonb
);

-- Games & leaderboards
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text,
  description text,
  iframe_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id),
  profile_id uuid REFERENCES profiles(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  score numeric,
  duration_secs int,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id),
  profile_id uuid REFERENCES profiles(id),
  game_id uuid REFERENCES games(id),
  event_type text,
  event_at timestamptz DEFAULT now(),
  payload jsonb
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id),
  profile_id uuid REFERENCES profiles(id),
  score numeric,
  rank int,
  created_at timestamptz DEFAULT now()
);

-- Store & purchases
CREATE TABLE IF NOT EXISTS store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text,
  price_usd numeric(18,6),
  price_token numeric(30,10) DEFAULT 0,
  token_id uuid REFERENCES tokens(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  item_id uuid REFERENCES store_items(id),
  amount numeric(30,10),
  currency text,
  currency_amount numeric(18,6),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  payment_ref text,
  metadata jsonb
);

-- Launchpad & token projects
CREATE TABLE IF NOT EXISTS launch_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  token_symbol text,
  token_name text,
  mint_address text,
  initial_supply numeric(40,0),
  lp_amount_sol numeric(30,10),
  lock_days int,
  lock_unlock_at timestamptz,
  fee_distribution jsonb,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS lp_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES launch_projects(id),
  lock_amount numeric(30,10),
  lock_token_id uuid REFERENCES tokens(id),
  locked_at timestamptz DEFAULT now(),
  unlock_at timestamptz,
  unlocked boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS vesting_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES launch_projects(id),
  beneficiary text,
  total_amount numeric,
  cliff_duration int,
  duration int,
  start_at timestamptz,
  metadata jsonb
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text,
  record_id text,
  operation text,
  performed_by uuid REFERENCES profiles(id),
  performed_at timestamptz DEFAULT now(),
  old jsonb,
  new jsonb,
  metadata jsonb
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  event_name text,
  event_at timestamptz DEFAULT now(),
  payload jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS trades_executed_at_idx ON trades(executed_at);
CREATE INDEX IF NOT EXISTS game_sessions_started_at_idx ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS purchases_created_at_idx ON purchases(created_at);

-- RLS policy placeholders (enable and apply policies after review)
-- Example: to enable RLS on purchases run:
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY purchases_owner ON purchases USING (profile_id = auth.uid());

-- End of migration
