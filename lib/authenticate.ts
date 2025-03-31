// lib/authenticate.ts
import jwt from 'jsonwebtoken';

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    return decoded as { userId: string; role: string }; // Adjust shape as needed
  } catch {
    throw new Error('Invalid token');
  }
}
