export function getAvatarPublicUrl(avatarKey: string | null | undefined): string | null {
  if (!avatarKey) {
    return null;
  }

  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    return null;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(avatarKey)}?alt=media`;
}

export function mapAvatarUrl<T extends { avatar_key?: string | null }>(
  row: T
): Omit<T, 'avatar_key'> & { avatar_url: string | null } {
  const { avatar_key, ...rest } = row;

  return {
    ...rest,
    avatar_url: getAvatarPublicUrl(avatar_key ?? null),
  };
}
