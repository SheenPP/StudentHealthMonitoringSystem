import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export const authenticateUser = (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Request Headers:', req.headers);

  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) {
    console.error('Authorization token is required');
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!); // Ensure JWT_SECRET is defined
    console.log('Decoded Token:', decoded);

    // Set user info on the request object if needed (requires extending NextApiRequest type)
    (req as any).user = decoded;
  } catch (error) {
    console.error('Token Validation Error:', (error as Error).message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
