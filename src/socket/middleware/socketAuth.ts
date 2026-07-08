import authProvider from '../../providers/auth/AuthProvider';
import { SocketWithUser } from '../socket.types';

export async function socketAuthMiddleware(
  socket: SocketWithUser,
  next: (error?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }

    const payload = await authProvider.validateToken(token);
    socket.data.userSub = payload.sub;
    socket.data.userRole = payload.role;

    next();
  } catch {
    next(new Error('Authentication required'));
  }
}
