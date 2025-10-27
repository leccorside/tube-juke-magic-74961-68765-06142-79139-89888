import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "leccorside@gmail.com";

export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.email === ADMIN_EMAIL;
};