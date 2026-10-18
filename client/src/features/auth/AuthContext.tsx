import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api } from '../../lib/api';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  avatar?: string | null;
  about?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    displayName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<User, 'displayName' | 'about' | 'avatar'>>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ user: User }>('/api/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ user: User }>('/api/auth/login', {
        email,
        password,
      });
      setUser(res.data.user);
    },
    []
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const res = await api.post<{ user: User }>('/api/auth/register', {
        displayName,
        email,
        password,
      });
      setUser(res.data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<Pick<User, 'displayName' | 'about' | 'avatar'>>) => {
      const res = await api.patch<{ user: User }>('/api/users/me', data);
      setUser(res.data.user);
    },
    []
  );

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
