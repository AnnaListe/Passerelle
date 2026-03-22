import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'professional' ou 'parent'
  const [loading, setLoading] = useState(true);

useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        detectUserType(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        detectUserType(session.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setUserType(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const detectUserType = async (userId) => {
    try {
      const { data: parentData } = await supabase
        .from('parents')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('detectUserType called with userId:', userId, 'at', new Date().toISOString());

      if (parentData) {
        setUserType('parent');
      } else {
        setUserType('professional');
      }
    } catch (error) {
      console.error('Error detecting user type:', error);
      setUserType('professional');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    detectUserType(data.user.id);
    return data;
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, userType, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
