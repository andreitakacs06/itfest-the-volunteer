import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, subscribeToUserProfile } from '../services/authService';
import { UserProfile } from '../firebase/types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    const loaded = await getUserProfile(auth.currentUser.uid);
    setProfile(loaded);
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (user) {
        unsubscribeProfile = subscribeToUserProfile(user.uid, (nextProfile) => {
          setProfile(nextProfile);
          setInitializing(false);
        });
      } else {
        setProfile(null);
        setInitializing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, initializing, refreshProfile }),
    [firebaseUser, profile, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
