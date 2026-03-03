import { useState, useEffect, useCallback } from 'react';
import { authService } from '../service/authService';

export interface User {
  id: string;
  email: string;
  companyName?: string;
  profilePicture?: string | null;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const parseStoredUser = () => {
  const stored = localStorage.getItem('authUser');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem('authUser');
    return null;
  }
};

const getResolvedUser = (data: unknown) => {
  if (data && typeof data === 'object' && 'user' in data) {
    const maybeUser = (data as { user?: User | null }).user;
    if (maybeUser) {
      return maybeUser;
    }
  }

  return parseStoredUser();
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('refreshToken');
        const user = parseStoredUser();

        if (token && user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur d\'authentification',
        });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login({ email, password });
      const resolvedUser = getResolvedUser(data);

      setState({
        user: resolvedUser as User | null,
        isAuthenticated: Boolean(resolvedUser),
        isLoading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de connexion';
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMsg,
      });
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, companyName?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.register({ email, password, companyName });
      const resolvedUser = getResolvedUser(data);

      setState({
        user: resolvedUser as User | null,
        isAuthenticated: Boolean(resolvedUser),
        isLoading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur d\'enregistrement';
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMsg,
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore les erreurs de logout API
    } finally {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
  };
};
