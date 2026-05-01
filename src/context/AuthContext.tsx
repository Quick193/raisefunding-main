import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Upsert profile on page load so campaigns can always be created,
        // even if the user never signed out/in after the DB was recreated.
        if (session?.user) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone_number: session.user.user_metadata?.phone_number || '',
          }, { onConflict: 'id', ignoreDuplicates: true });
        }
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Ensure a profile row exists every time the user signs in.
        // The DB trigger can fail silently; this is the reliable fallback.
        if (session?.user && event === 'SIGNED_IN') {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone_number: session.user.user_metadata?.phone_number || '',
          }, { onConflict: 'id', ignoreDuplicates: true });
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber || '',
        },
      },
    });
    if (signUpError) throw signUpError;

    // The auth trigger (SECURITY DEFINER) already creates the profile with
    // phone_number from user metadata. Only run the upsert when we have an
    // active session (email confirmation disabled); otherwise auth.uid() is
    // null and the INSERT policy would reject the upsert.
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone_number: phoneNumber || '',
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};