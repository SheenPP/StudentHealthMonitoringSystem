"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function useAdminAuth() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("/api/auth/getAdminUser", {
          withCredentials: true,
        });
        setAuthChecked(true);
      } catch (err) {
        console.error("Not authenticated:", err);
        router.replace("/admin/login"); // Adjust path if needed
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { authChecked, loading };
}
