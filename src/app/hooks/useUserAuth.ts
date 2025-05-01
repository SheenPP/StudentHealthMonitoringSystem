// hooks/useUserAuth.ts
import { useEffect, useState } from 'react';
import axios from 'axios';

type User = {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  photo_path: string | null;
  role: 'student' | 'teacher';  // Role can be either student or teacher
};

export default function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/getUsersUser', {
          withCredentials: true, // Ensures cookies are included in the request
        });
        setUser(res.data); // Assuming response returns the user object
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true); // ✅ Mark that the auth check is done
      }
    };

    checkAuth();
  }, []);

  return { user, authChecked, loading };
}
