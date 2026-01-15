export interface CreateStreakStatsParams {
  userId: number;
}

export interface ExistDailyStatsByUserIdParams {
  userId: number;
}

export interface CreateUserParams {
  sub: string;
  nickname: string;
  email: string;
  role: string;
  passwordHash: string;
}

export interface CreateUserPayload {
  email: string;
  pass: string;
}

export interface GetProfileBySubRes {
  sub: string;
  nickname: string;
  email: string;
  created_at: string;
}

export interface GetProfileIdBySubRes {
  id: number;
}

export type GetInfoByEmailRes = {
  id: number;
  sub: string;
  role: string;
  pass_hash: string;
};

export interface GetProfilePayload {
  sub: string;
}

export interface GetDailyPayload {
  sub: string;
}

export interface ExistUserPayload {
  sub: string;
}
