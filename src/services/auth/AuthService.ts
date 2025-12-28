import userRepository, {
  UserRepository,
} from '../../databases/postgre/entities/user/UserRepository';
import authProvider, { AuthProvider } from '../../providers/auth/AuthProvider';
import type { Credentials } from './auth.types';

export class AuthService {
  constructor(
    public authProvider: AuthProvider,
    public userRepository: UserRepository
  ) {}

  async login(credentials: Credentials): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.getInfoByEmail(credentials.email);

    if (!user || !user.sub || !user.role || !user.pass_hash) {
      throw new Error(`AuthService: User with email ${credentials.email} doesn't exist`);
    }

    const hashString = Buffer.isBuffer(user.pass_hash)
      ? user.pass_hash.toString('utf-8')
      : (user.pass_hash as string);

    const isValid = await this.authProvider.validatePassword(credentials.password, hashString);

    if (!isValid) throw new Error(`AuthService: User password is invalid`);

    const accessToken = await this.authProvider.createAccessToken({
      sub: user.sub,
      role: user.role,
    });
    const refreshToken = await this.authProvider.createRefreshToken({
      sub: user.sub,
      role: user.role,
    });

    return { accessToken, refreshToken };
  }

  async isAuthenticated(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Not authenticated');
    }

    const { exp, iat, ...cleanPayload } = await this.authProvider.validateToken(refreshToken);

    return {
      sub: cleanPayload.sub,
      authenticated: true,
    };
  }

  async refreshSession(refreshToken: string) {
    const { exp, iat, ...cleanPayload } = await this.authProvider.validateToken(refreshToken);

    const newAccess = await this.authProvider.createAccessToken(cleanPayload);
    const newRefresh = await this.authProvider.createRefreshToken(cleanPayload);

    return { accessToken: newAccess, refreshToken: newRefresh };
  }
}

export default new AuthService(authProvider, userRepository);
