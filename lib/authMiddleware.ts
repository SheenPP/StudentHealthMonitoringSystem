import type { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';

// ✅ Extend NextApiRequest locally
interface AuthenticatedRequest extends NextApiRequest {
  user?: string | JwtPayload;
}

export const authenticateUser = (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.error('Authorization token is required');
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    console.log('Decoded Token:', decoded);

    // ✅ Cast `req` to the extended type temporarily
    (req as AuthenticatedRequest).user = decoded;
  } catch (error) {
    console.error('Token Validation Error:', (error as Error).message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
