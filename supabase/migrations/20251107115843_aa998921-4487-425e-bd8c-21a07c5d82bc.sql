-- Add language field to clipboard_items for code snippets
ALTER TABLE public.clipboard_items 
ADD COLUMN language TEXT DEFAULT 'plaintext';

-- Update the content_type check constraint to include 'code'
ALTER TABLE public.clipboard_items 
DROP CONSTRAINT IF EXISTS clipboard_items_content_type_check;

ALTER TABLE public.clipboard_items 
ADD CONSTRAINT clipboard_items_content_type_check 
CHECK (content_type IN ('text', 'file', 'code'));