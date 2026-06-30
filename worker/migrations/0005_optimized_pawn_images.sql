ALTER TABLE pawns ADD COLUMN image_urls TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pawns ADD COLUMN thumbnail_url TEXT;

UPDATE pawns
SET image_urls = CASE
  WHEN image_url IS NOT NULL AND trim(image_url) != '' THEN '[{"imageUrl":"' || replace(image_url, '"', '\"') || '","thumbUrl":"' || replace(image_url, '"', '\"') || '","sortOrder":0}]'
  ELSE '[]'
END,
thumbnail_url = CASE
  WHEN image_url IS NOT NULL AND trim(image_url) != '' THEN image_url
  ELSE NULL
END;
