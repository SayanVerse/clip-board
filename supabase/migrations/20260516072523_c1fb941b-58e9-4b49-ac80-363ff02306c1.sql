
-- Add creator tracking to sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS creator_device_id text;

-- Track devices connected to a session
CREATE TABLE IF NOT EXISTS public.session_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text NOT NULL DEFAULT 'Unknown',
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_session_devices_session ON public.session_devices(session_id);

ALTER TABLE public.session_devices ENABLE ROW LEVEL SECURITY;

-- Permissive policies (matches the existing anonymous session model)
CREATE POLICY "Anyone can read session devices"
  ON public.session_devices FOR SELECT USING (true);

CREATE POLICY "Anyone can insert session devices"
  ON public.session_devices FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update session devices"
  ON public.session_devices FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete session devices"
  ON public.session_devices FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_devices;
ALTER TABLE public.session_devices REPLICA IDENTITY FULL;
