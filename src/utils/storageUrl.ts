export function getStoragePublicUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) {
    return null;
  }

  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    return null;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storageKey)}?alt=media`;
}
