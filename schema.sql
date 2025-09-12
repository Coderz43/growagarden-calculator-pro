-- schema.sql
CREATE TABLE IF NOT EXISTS calc_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total NUMERIC,
  crop TEXT,
  qty INTEGER,
  weight NUMERIC,
  friend_pct NUMERIC,
  max_mutation BOOLEAN,
  base_floor NUMERIC,
  growth_bonus NUMERIC,
  temperature_bonus NUMERIC,
  env JSONB,
  ua TEXT,
  referer TEXT,
  payload JSONB
);
