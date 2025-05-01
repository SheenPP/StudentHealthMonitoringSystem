'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  profile_picture: string;
}

interface UseAdminAuthOptions {
  skipRedirect?: boolean;
  skip?: boolean;
}

export default function useAdminAuth({ skipRedirect = false, skip = false }: UseAdminAuthOptions = {}) {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (skip) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/getAdminUser', {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (err) {
        console.error('Admin not authenticated:', err);
        if (!skipRedirect) {
          router.replace('/admin/login');
        }
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, skip, skipRedirect]);

  return { user, loading, authChecked };
}
