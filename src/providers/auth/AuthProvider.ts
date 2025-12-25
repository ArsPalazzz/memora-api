import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { jwtConfig } from '../../config';

const { secret, expiresIn } = jwtConfig;

export interface UserTokenPayload {
  sub: string;
  role: string;
}

export class AuthProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  async validateToken(token: string): Promise<UserTokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, payload) => {
        if (err) {
          reject(err);
        }
        resolve(payload as UserTokenPayload);
      });
    });
  }

  async createAccessToken(payload: UserTokenPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secret, { expiresIn: '15m' } as SignOptions, (err, token) =>
        err || !token ? reject(err) : resolve(token)
      );
    });
  }

  async createRefreshToken(payload: UserTokenPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secret, { expiresIn: '30d' } as SignOptions, (err, token) =>
        err || !token ? reject(err) : resolve(token)
      );
    });
  }

  async createPasswordHash(password: string): Promise<string> {
    const SALT_ROUNDS = 10;

    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async validatePassword(loginPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(loginPassword, hashedPassword);
  }
}

export default new AuthProvider(secret, expiresIn);
