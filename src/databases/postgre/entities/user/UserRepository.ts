import { Query } from '../..';
import {
  CreateUserParams,
  GetInfoByEmailRes,
  GetProfileBySubRes,
} from '../../../../services/users/user.interfaces';
import Table from '../Table';
import { INSERT_USER } from './UserRepositoryQueries';

export class UserRepository extends Table {
  async createUser(params: CreateUserParams) {
    const { sub, nickname, email, role, passwordHash } = params;

    const query: Query = {
      name: 'createUser',
      text: INSERT_USER,
      values: [sub, nickname, email, role, passwordHash],
    };

    return this.insertItem<number>(query);
  }

  async existByEmail(email: string) {
    const query: Query = {
      name: 'existByEmail',
      text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE email = $1 LIMIT 1);`,
      values: [email],
    };

    return this.exists(query);
  }

  async existBySub(sub: string) {
    const query: Query = {
      name: 'existProfileBySub',
      text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE sub = $1 LIMIT 1);`,
      values: [sub],
    };

    return this.exists(query);
  }

  async getProfileBySub(sub: string) {
    const query: Query = {
      name: 'getProfileBySub',
      text: `SELECT sub, nickname, email, created_at FROM users.profile WHERE sub = $1 LIMIT 1;`,
      values: [sub],
    };

    return this.getItem<GetProfileBySubRes>(query);
  }

  async getInfoByEmail(email: string) {
    const query: Query = {
      name: 'getProfileByEmail',
      text: `SELECT id, sub, role, pass_hash FROM users.profile WHERE email = $1 LIMIT 1;`,
      values: [email],
    };

    return this.getItem<GetInfoByEmailRes>(query);
  }
}

export default new UserRepository();
