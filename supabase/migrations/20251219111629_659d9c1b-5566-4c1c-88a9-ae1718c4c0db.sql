-- Update the generate_session_code function to generate 4-digit codes instead of 6
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 4-digit code
    new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if code already exists in active sessions
    SELECT EXISTS(
      SELECT 1 FROM public.sessions 
      WHERE session_code = new_code 
      AND expires_at > NOW()
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update sessions table default expires_at to 2 hours
ALTER TABLE public.sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '2 hours');