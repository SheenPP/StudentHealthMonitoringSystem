import useAuth from './useAuth';
import useAdminAuth from './useAdminAuth';

interface UseActiveUserOptions {
  skipUser?: boolean;
  skipAdmin?: boolean;
  skipRedirect?: boolean;
}

const useActiveUser = ({ skipUser = false, skipAdmin = false, skipRedirect = true }: UseActiveUserOptions = {}) => {
  // Both hooks must always be called in same order
  const auth = useAuth({ skip: skipUser, skipRedirect });
  const adminAuth = useAdminAuth({ skip: skipAdmin, skipRedirect });

  const user = adminAuth.user || auth.user;
  const loading = adminAuth.loading || auth.loading;
  const authChecked = adminAuth.authChecked || auth.authChecked;

  return { user, loading, authChecked };
};

export default useActiveUser;
