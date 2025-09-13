-- filename: schema.sql

-- =========================
-- Table
-- =========================
CREATE TABLE IF NOT EXISTS public.calc_events (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  referer       TEXT,
  user_agent    TEXT,
  payload       JSONB NOT NULL,      -- full event snapshot from api/log-calc.js
  growth_choice TEXT,                -- e.g. "Golden", "Rainbow", "Default"
  temp_choice   TEXT,                -- e.g. "Frozen", "Chilled", "Default"
  env_count     INTEGER              -- number of env mutations selected (incl. Frozen fold-in if you choose)
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS calc_events_created_at_idx ON public.calc_events (created_at DESC);
CREATE INDEX IF NOT EXISTS calc_events_growth_choice_idx ON public.calc_events (growth_choice);
CREATE INDEX IF NOT EXISTS calc_events_temp_choice_idx   ON public.calc_events (temp_choice);
CREATE INDEX IF NOT EXISTS calc_events_env_count_idx     ON public.calc_events (env_count);
CREATE INDEX IF NOT EXISTS calc_events_payload_gin       ON public.calc_events USING GIN (payload);

-- =========================
-- Derivation trigger (fallback)
-- Fills columns from JSON if API didn’t provide them.
-- Supports both shapes:
--   payload.inputs.growth / payload.inputs.temp / payload.inputs.env[]
--   growthChoice/tempChoice/envCount at the top level, too.
-- =========================
CREATE OR REPLACE FUNCTION public.calc_events_fill_derived()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.growth_choice IS NULL THEN
    NEW.growth_choice := COALESCE(
      NEW.payload #>> '{inputs,growth}',
      NEW.payload #>> '{payload,inputs,growth}',
      NEW.payload ->> 'growthChoice',
      NEW.payload ->> 'growth'
    );
  END IF;

  IF NEW.temp_choice IS NULL THEN
    NEW.temp_choice := COALESCE(
      NEW.payload #>> '{inputs,temp}',
      NEW.payload #>> '{payload,inputs,temp}',
      NEW.payload ->> 'tempChoice',
      NEW.payload ->> 'temperature',
      NEW.payload ->> 'temp'
    );
  END IF;

  IF NEW.env_count IS NULL THEN
    NEW.env_count := COALESCE(
      CASE WHEN jsonb_typeof(NEW.payload #> '{inputs,env}') = 'array'
           THEN jsonb_array_length(NEW.payload #> '{inputs,env}') END,
      CASE WHEN jsonb_typeof(NEW.payload #> '{payload,inputs,env}') = 'array'
           THEN jsonb_array_length(NEW.payload #> '{payload,inputs,env}') END,
      (NEW.payload ->> 'envCount')::int,
      (NEW.payload ->> 'env_count')::int
    );
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_calc_events_fill_derived ON public.calc_events;
CREATE TRIGGER trg_calc_events_fill_derived
BEFORE INSERT OR UPDATE ON public.calc_events
FOR EACH ROW
EXECUTE FUNCTION public.calc_events_fill_derived();

-- =========================
-- One-time backfill for old rows
-- Run this once in Neon SQL Editor if you already have NULLs.
-- =========================
UPDATE public.calc_events
SET growth_choice = COALESCE(
      payload #>> '{inputs,growth}',
      payload #>> '{payload,inputs,growth}',
      payload ->> 'growthChoice',
      payload ->> 'growth'
    )
WHERE growth_choice IS NULL;

UPDATE public.calc_events
SET temp_choice = COALESCE(
      payload #>> '{inputs,temp}',
      payload #>> '{payload,inputs,temp}',
      payload ->> 'tempChoice',
      payload ->> 'temperature',
      payload ->> 'temp'
    )
WHERE temp_choice IS NULL;

UPDATE public.calc_events
SET env_count = COALESCE(
      CASE WHEN jsonb_typeof(payload #> '{inputs,env}') = 'array'
           THEN jsonb_array_length(payload #> '{inputs,env}') END,
      CASE WHEN jsonb_typeof(payload #> '{payload,inputs,env}') = 'array'
           THEN jsonb_array_length(payload #> '{payload,inputs,env}') END,
      (payload ->> 'envCount')::int,
      (payload ->> 'env_count')::int
    )
WHERE env_count IS NULL;
