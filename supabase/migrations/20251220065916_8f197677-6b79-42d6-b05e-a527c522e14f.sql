-- Add is_pinned column to clipboard_items table
ALTER TABLE public.clipboard_items ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Create index for faster pinned item queries
CREATE INDEX idx_clipboard_items_pinned ON public.clipboard_items(is_pinned DESC, created_at DESC);

-- Allow users to update their own clipboard items (for pinning)
CREATE POLICY "Update clipboard items" 
ON public.clipboard_items 
FOR UPDATE 
USING ((session_id IS NOT NULL) OR ((user_id IS NOT NULL) AND (user_id = auth.uid())));
