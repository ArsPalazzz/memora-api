import sharp from 'sharp';
import { admin } from '../../lib/firebase-admin';
import { BadRequestError } from '../../exceptions';

const AVATAR_SIZE = 256;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class AvatarStorageService {
  private get bucket() {
    return admin.storage().bucket();
  }

  async upload(userSub: string, fileBuffer: Buffer): Promise<string> {
    if (fileBuffer.length === 0) {
      throw new BadRequestError('Empty image file');
    }

    if (fileBuffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestError('Image is too large (max 10 MB)');
    }

    let processed: Buffer;

    try {
      processed = await sharp(fileBuffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestError('Unsupported or invalid image file');
    }

    const storageKey = `avatars/${userSub}/${Date.now()}.webp`;
    const file = this.bucket.file(storageKey);

    await file.save(processed, {
      contentType: 'image/webp',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return storageKey;
  }

  async delete(storageKey: string): Promise<void> {
    await this.bucket.file(storageKey).delete({ ignoreNotFound: true });
  }
}

export default new AvatarStorageService();
