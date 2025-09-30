import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { authApi } from '@/lib/database';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authApi.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!
          };
          
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      }
    );

    // Check for existing session
    authApi.getSession().then((session) => {
      setSession(session);
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!
        };
        
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      // Auth state will be updated by the listener
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await authApi.register(email, password, name);
      // Auth state will be updated by the listener
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      // Auth state will be updated by the listener
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        ...authState,
        login,
        register,
        logout,
        session
      }}
    >
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