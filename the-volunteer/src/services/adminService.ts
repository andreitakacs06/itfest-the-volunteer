import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { Task, UserProfile } from '../firebase/types';

export const subscribeAllUsers = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<UserProfile, 'id'>) }))
    );
  });
};

export const subscribeAllTasks = (callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) })));
  });
};

export const deleteTaskById = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const setUserBanStatus = async (uid: string, banned: boolean) => {
  await updateDoc(doc(db, 'users', uid), { banned });
};

export const addUserCredits = async (uid: string, amount: number) => {
  const callable = httpsCallable(functions, 'addCreditsToUser');
  await callable({ uid, amount });
};
