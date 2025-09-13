-- schema.sql
CREATE TABLE IF NOT EXISTS calc_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Core summary
  total NUMERIC,          -- Calculated Minimum Value
  crop TEXT,              -- Selected crop name
  qty INTEGER,            -- Quantity
  weight NUMERIC,         -- Input weight

  -- Existing factors
  friend_pct NUMERIC,
  max_mutation BOOLEAN,
  base_floor NUMERIC,
  growth_bonus NUMERIC,
  temperature_bonus NUMERIC,
  env JSONB,
  ua TEXT,
  referer TEXT,
  payload JSONB,

  -- New explicit tracking
  growth_choice TEXT,     -- Growth Mutations: which one selected
  temp_choice TEXT,       -- Temperature Mutations: which one selected
  env_count INTEGER       -- Environmental Mutations: how many selected
);
