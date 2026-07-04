export function stripHtml(value: string): string {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeImportText(value: string): string {
  return stripHtml(value);
}

export function normalizeCardText(value: string): string {
  return sanitizeImportText(value).toLowerCase();
}

export function splitBackVariants(backText: string): string[] {
  const trimmed = backText.trim();
  if (!trimmed) return [];

  if (!trimmed.includes(',')) {
    return [trimmed];
  }

  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseAnkiTagsToFolderPath(tags: string): string[] {
  if (!tags?.trim()) return [];

  return tags
    .split('::')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function buildExistingLocationLabel(folderPath: string[]): string {
  if (!folderPath.length) return 'Home';
  return folderPath.join(' › ');
}
