import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types';
import { mockAuthApi } from '@/lib/mockApi';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Check if user is already authenticated on app load
    const isAuth = mockAuthApi.isAuthenticated();
    const user = mockAuthApi.getCurrentUser();
    
    setAuthState({
      isAuthenticated: isAuth,
      user,
      loading: false
    });
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { user } = await mockAuthApi.login(email, password);
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { user } = await mockAuthApi.register(email, password, name);
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    await mockAuthApi.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};