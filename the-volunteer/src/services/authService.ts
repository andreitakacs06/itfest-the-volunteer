import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import * as Location from 'expo-location';
import { auth, db, functions } from '../firebase/config';
import { RequesterType, UserProfile, UserRole } from '../firebase/types';

interface SignUpParams {
  name: string;
  email: string;
  password: string;
  roleSelection: UserRole;
  adminSecret?: string;
}

const getUserLocation = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return undefined;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};

export const signUp = async ({
  name,
  email,
  password,
  roleSelection,
  adminSecret,
}: SignUpParams) => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

  await updateProfile(credential.user, { displayName: name.trim() });

  const location = await getUserLocation();

  await setDoc(doc(db, 'users', credential.user.uid), {
    userId: credential.user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'user' as UserRole,
    credits: 0,
    rating: 0,
    completedTasks: 0,
    dailyStreak: 0,
    location: location ?? null,
    banned: false,
    fcmTokens: [],
    createdAt: serverTimestamp(),
  });

  if (roleSelection === 'admin') {
    try {
      const requestAdminRole = httpsCallable(functions, 'requestAdminRole');
      await requestAdminRole({ uid: credential.user.uid, adminSecret: adminSecret ?? '' });
    } catch (error) {
      await deleteDoc(doc(db, 'users', credential.user.uid)).catch(() => undefined);
      await deleteUser(credential.user).catch(() => undefined);
      throw new Error(error instanceof Error ? error.message : 'Invalid admin secret password.');
    }
  }

  return credential.user;
};

export const login = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

  const userProfile = await getUserProfile(credential.user.uid);
  if (userProfile?.banned) {
    await signOut(auth);
    throw new Error('This account has been banned by an administrator.');
  }

  return credential.user;
};

export const logout = async () => signOut(auth);

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<UserProfile, 'id'>),
  };
};

export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
) => {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...(snapshot.data() as Omit<UserProfile, 'id'>),
    });
  });
};

export const updateUserLocation = async (user: User) => {
  const location = await getUserLocation();
  if (!location) {
    return;
  }

  await updateDoc(doc(db, 'users', user.uid), { location });
};

export const updateRequesterType = async (uid: string, requesterType: RequesterType) => {
  await updateDoc(doc(db, 'users', uid), { requesterType });
};

export const updateUserProfile = async (uid: string, updates: Record<string, unknown>) => {
  await updateDoc(doc(db, 'users', uid), updates);
};
