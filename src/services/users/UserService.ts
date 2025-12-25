import userRepository, {
  UserRepository,
} from '../../databases/postgre/entities/user/UserRepository';
import { CreateUserPayload, ExistUserPayload, GetProfilePayload } from './user.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import authProvider, { AuthProvider } from '../../providers/auth/AuthProvider';
import { UserRole } from './user.const';

export class UserService {
  constructor(
    public userRepository: UserRepository,
    public authProvider: AuthProvider
  ) {}

  async createUser(params: CreateUserPayload) {
    const exists = await this.userRepository.existByEmail(params.email);
    if (exists) {
      throw new Error('User with this email is already exist');
    }

    const userInfo = this.generateUserInfo();
    const passwordHash = await this.authProvider.createPasswordHash(params.pass);

    const userData = { ...userInfo, email: params.email, role: UserRole.REGISTERED };

    await this.userRepository.createUser({
      ...userData,
      passwordHash,
    });

    return { ...userData, password: params.pass };
  }

  async getProfile(params: GetProfilePayload) {
    const exists = await this.userRepository.existBySub(params.sub);
    if (!exists) {
      throw new Error("User with this sub doesn't exist");
    }

    return await this.userRepository.getProfileBySub(params.sub);
  }

  async existProfile(params: ExistUserPayload) {
    const exists = await this.userRepository.existBySub(params.sub);
    if (!exists) {
      throw new Error("User with this sub doesn't exist");
    }

    return true;
  }

  private generateUserInfo() {
    const sub = uuidv4();
    const nickname = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

    return { sub, nickname };
  }
}

export default new UserService(userRepository, authProvider);
