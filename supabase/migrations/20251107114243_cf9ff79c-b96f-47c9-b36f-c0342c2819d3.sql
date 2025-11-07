-- Storage policies for clipboard-files bucket
CREATE POLICY "Anyone can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clipboard-files');

CREATE POLICY "Anyone can read files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clipboard-files');

CREATE POLICY "Anyone can delete files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'clipboard-files');