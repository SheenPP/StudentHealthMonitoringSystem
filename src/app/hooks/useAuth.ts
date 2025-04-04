// hooks/useAuth.ts

import { useEffect, useState } from 'react';
import axios from 'axios';

type User = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  role: string;
  position: string;
  profilePicture?: string | null;
};

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/getUser', {
          withCredentials: true,
        });
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true); // ✅ mark that auth check is done
      }
    };

    checkAuth();
  }, []);

  return { user, authChecked, loading };
}
