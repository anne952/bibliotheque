export const stripSyncIdentifierSuffix = (value: unknown) => {
  const text = String(value || '').trim();
  if (!text) return '';

  return text
    .replace(/\s*[\[(]\s*(?:id\s*)?sync(?:hronisation|hronization)?\s*[:#-]\s*[^\])]+[\])]\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:id\s*)?sync(?:hronisation|hronization)?\s*[:#-]\s*[a-z0-9_-]{6,}\s*$/i, '')
    .replace(/\s*\(\s*[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*\)\s*$/i, '')
    .replace(/[\s.:;,-]+[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*[.]?\s*$/i, '')
    .replace(/[\s.:;,-]+[A-Za-z0-9_-]{20,}\s*[.]?\s*$/i, '')
    .trim();
};
