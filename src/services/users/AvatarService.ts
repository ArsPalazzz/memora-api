import userRepository, { UserRepository } from '../../databases/postgre/entities/user/UserRepository';
import avatarStorageService, {
  AvatarStorageService,
} from '../storage/AvatarStorageService';
import { getAvatarPublicUrl } from '../../utils/avatarUrl';
import { NotFoundError } from '../../exceptions';

export class AvatarService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly avatarStorage: AvatarStorageService
  ) {}

  async uploadAvatar(userSub: string, fileBuffer: Buffer) {
    const profile = await this.userRepository.getProfileBySub(userSub);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    const storageKey = await this.avatarStorage.upload(userSub, fileBuffer);

    if (profile.avatar_key) {
      await this.avatarStorage.delete(profile.avatar_key).catch(() => undefined);
    }

    await this.userRepository.updateAvatarKey(userSub, storageKey);

    return getAvatarPublicUrl(storageKey);
  }

  async deleteAvatar(userSub: string) {
    const profile = await this.userRepository.getProfileBySub(userSub);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    if (profile.avatar_key) {
      await this.avatarStorage.delete(profile.avatar_key).catch(() => undefined);
      await this.userRepository.updateAvatarKey(userSub, null);
    }
  }
}

export default new AvatarService(userRepository, avatarStorageService);
