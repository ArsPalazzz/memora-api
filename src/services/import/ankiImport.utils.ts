export function normalizeCardText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
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
