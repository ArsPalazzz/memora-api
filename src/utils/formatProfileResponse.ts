import { GetProfileBySubRes } from '../services/users/user.interfaces';
import { mapAvatarUrl } from './avatarUrl';

export type PublicProfileResponse = {
  sub: string;
  nickname: string;
  email: string;
  created_at: string;
  stats_public: boolean;
  league_notifications: boolean;
  avatar_url: string | null;
};

export function formatProfileResponse(profile: GetProfileBySubRes): PublicProfileResponse {
  return mapAvatarUrl(profile);
}
