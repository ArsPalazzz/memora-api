import { getStoragePublicUrl } from './storageUrl';

export function mapCardImageUrl<T extends { image_key?: string | null; imageKey?: string | null }>(
  row: T
): Omit<T, 'image_key' | 'imageKey'> & { image_url: string | null } {
  const { image_key, imageKey, ...rest } = row;

  return {
    ...rest,
    image_url: getStoragePublicUrl(image_key ?? imageKey ?? null),
  };
}
