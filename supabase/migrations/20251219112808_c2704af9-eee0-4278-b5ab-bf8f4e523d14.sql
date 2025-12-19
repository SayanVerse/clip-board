-- Add user_id column to clipboard_items for logged-in users
ALTER TABLE public.clipboard_items 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make session_id nullable (for logged-in users who don't need sessions)
ALTER TABLE public.clipboard_items 
ALTER COLUMN session_id DROP NOT NULL;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update clipboard_items RLS to support both session-based and user-based access
DROP POLICY IF EXISTS "Allow read access to clipboard items by session" ON public.clipboard_items;
DROP POLICY IF EXISTS "Allow insert access to clipboard items by session" ON public.clipboard_items;
DROP POLICY IF EXISTS "Allow delete access to clipboard items by session" ON public.clipboard_items;

-- Allow access via session_id OR user_id
CREATE POLICY "Read clipboard items" 
ON public.clipboard_items FOR SELECT 
USING (
  session_id IS NOT NULL 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "Insert clipboard items" 
ON public.clipboard_items FOR INSERT 
WITH CHECK (
  session_id IS NOT NULL 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "Delete clipboard items" 
ON public.clipboard_items FOR DELETE 
USING (
  session_id IS NOT NULL 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for faster user-based queries
CREATE INDEX idx_clipboard_items_user_id ON public.clipboard_items(user_id);