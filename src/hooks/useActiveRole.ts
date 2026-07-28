import { useAuth } from '../auth/useAuth';

export function useActiveRole() {
  const { user } = useAuth();
  const activeRole = (user as any)?.activeRole ? String((user as any).activeRole).toLowerCase() : 'buyer';
  return activeRole;
}
