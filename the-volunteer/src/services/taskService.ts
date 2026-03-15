import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase/config';
import { JuridicTaskDetails, PhysicalTaskDetails, RequesterType, Task, TaskCategory, TaskLocationDetails } from '../firebase/types';

interface CreateTaskInput {
  title: string;
  description: string;
  estimatedHours: number;
  category: TaskCategory;
  creatorId: string;
  creatorName: string;
  creatorType: RequesterType;
  requesterDetails: JuridicTaskDetails | PhysicalTaskDetails;
  location: {
    latitude: number;
    longitude: number;
  };
  locationDetails?: TaskLocationDetails;
}

export const createTask = async ({
  title,
  description,
  estimatedHours,
  category,
  creatorId,
  creatorName,
  creatorType,
  requesterDetails,
  location,
  locationDetails,
}: CreateTaskInput) => {
  const taskRef = doc(collection(db, 'tasks'));

  await setDoc(taskRef, {
    taskId: taskRef.id,
    title: title.trim(),
    description: description.trim(),
    estimatedHours,
    category,
    creatorId,
    creatorName,
    creatorType,
    requesterDetails,
    // Kept for backwards compatibility with older reads.
    credits: estimatedHours,
    location,
    locationDetails: locationDetails ?? null,
    status: 'open',
    helperId: null,
    helperName: null,
    rating: null,
    createdAt: Date.now(),
  });

  return taskRef;
};

export const subscribeToOpenTasks = (
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, 'tasks'), where('status', '==', 'open'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) }))
        .sort((left, right) => right.createdAt - left.createdAt);
      callback(tasks);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const subscribeToUserTasks = (uid: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('creatorId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) }))
      .sort((left, right) => right.createdAt - left.createdAt);
    callback(tasks);
  });
};

export const subscribeToHelperTasks = (uid: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('helperId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) }))
      .sort((left, right) => right.createdAt - left.createdAt);
    callback(tasks);
  });
};

export const acceptTask = async (taskId: string, helperId: string) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to accept tasks.');
  }

  const idToken = await auth.currentUser.getIdToken(true);
  const callable = httpsCallable(functions, 'acceptTask');
  await callable({ taskId, helperId, idToken });
};

export const deleteCreatedTask = async (taskId: string) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to delete tasks.');
  }

  await deleteDoc(doc(db, 'tasks', taskId));
};

export const submitTaskRating = async (taskId: string, rating: number) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to complete tasks.');
  }

  const idToken = await auth.currentUser.getIdToken(true);
  const callable = httpsCallable(functions, 'submitTaskRating');
  try {
    await callable({ taskId, rating, idToken });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error('Unable to complete task right now.');
  }
};
