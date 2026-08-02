import { createContext } from 'react';
import { User } from '../types';
import { EnterpriseIdentity, Permission } from '../services/identity/identityTypes';

export interface AuthContextType {
  user: User | null;
  profile: User | null;
  identity?: EnterpriseIdentity | null;
  permissions?: Permission[];
  loading: boolean;
  error: string | null;
  login: () => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
