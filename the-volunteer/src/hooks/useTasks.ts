import { useEffect, useMemo, useState } from 'react';
import { Task } from '../firebase/types';
import { subscribeToHelperTasks, subscribeToOpenTasks, subscribeToUserTasks } from '../services/taskService';

export const useOpenTasks = (uid?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToOpenTasks(
      (next) => {
        setTasks(next);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to open tasks', error);
        setTasks([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return useMemo(() => ({ tasks, loading }), [tasks, loading]);
};

export const useCreatorTasks = (uid?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!uid) {
      setTasks([]);
      return;
    }

    const unsubscribe = subscribeToUserTasks(uid, setTasks);
    return unsubscribe;
  }, [uid]);

  return tasks;
};

export const useHelperTasks = (uid?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!uid) {
      setTasks([]);
      return;
    }

    const unsubscribe = subscribeToHelperTasks(uid, setTasks);
    return unsubscribe;
  }, [uid]);

  return tasks;
};
