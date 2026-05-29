import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const query = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false
  });
  if (query.data) setUser(query.data);
  return { ...query, token, user: query.data || useAuthStore.getState().user };
};
