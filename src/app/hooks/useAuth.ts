import { useEffect, useState } from 'react';
import axios from 'axios';

type User = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string; 
  role: string;
  position: string;
  profilePicture?: string | null;
};

interface UseAuthOptions {
  skipRedirect?: boolean;
  skip?: boolean;
}

export default function useAuth({ skipRedirect = false, skip = false }: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (skip) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/getUser', {
          withCredentials: true,
        });
        setUser(res.data.user);
      } catch {
        console.error('User not authenticated.');
        if (!skipRedirect) {
          window.location.href = '/';
        }
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [skip, skipRedirect]);

  return { user, loading, authChecked };
}
