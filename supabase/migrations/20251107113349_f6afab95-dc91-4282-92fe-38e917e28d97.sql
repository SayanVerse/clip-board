-- Create sessions table for device pairing
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create clipboard items table
CREATE TABLE public.clipboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'file')),
  content TEXT,
  file_name TEXT,
  file_url TEXT,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_clipboard_items_session_id ON public.clipboard_items(session_id);
CREATE INDEX idx_clipboard_items_created_at ON public.clipboard_items(created_at DESC);
CREATE INDEX idx_sessions_code ON public.sessions(session_code);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipboard_items ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this utility app)
CREATE POLICY "Anyone can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON public.sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update sessions"
  ON public.sessions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can create clipboard items"
  ON public.clipboard_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read clipboard items"
  ON public.clipboard_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can delete old clipboard items"
  ON public.clipboard_items FOR DELETE
  USING (true);

-- Function to generate unique 6-digit codes
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.sessions WHERE session_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < now();
END;
$$;

-- Enable realtime for clipboard items
ALTER PUBLICATION supabase_realtime ADD TABLE public.clipboard_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- Storage bucket for file transfers
INSERT INTO storage.buckets (id, name, public)
VALUES ('clipboard-files', 'clipboard-files', true)
ON CONFLICT (id) DO NOTHING;