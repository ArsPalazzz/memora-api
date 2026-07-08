import { getStoragePublicUrl } from './storageUrl';

export function getAvatarPublicUrl(avatarKey: string | null | undefined): string | null {
  return getStoragePublicUrl(avatarKey);
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
