import jwt from 'jsonwebtoken';

export const authenticateUser = (req: NextApiRequest, res: NextApiResponse) => {
  // Check if the Authorization header is present
  console.log('Request Headers:', req.headers);

  const token = req.headers.authorization?.split(' ')[1]; // Get the token part (after 'Bearer')
  
  if (!token) {
    console.error('Authorization token is required');
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!); // Verify the token
    console.log('Decoded Token:', decoded); // This will show the decoded payload

    // You can now set the decoded user info for further use (for example, in the request object)
    req.user = decoded; // Or whatever your app structure is
  } catch (error) {
    console.error('Token Validation Error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
