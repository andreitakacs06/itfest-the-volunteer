import { onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const db = getFirestore();
const ADMIN_SECRET_PASSWORD = process.env.ADMIN_SECRET_PASSWORD;

const RATING_MULTIPLIER: Record<number, number> = {
  1: 0.5,
  2: 0.63,
  3: 0.75,
  4: 0.88,
  5: 1,
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getNextStreak = (lastCompletedDate: string | undefined): number => {
  const now = new Date();
  const todayKey = toDateKey(now);

  if (!lastCompletedDate) {
    return 1;
  }

  if (lastCompletedDate === todayKey) {
    return 0;
  }

  const last = new Date(`${lastCompletedDate}T00:00:00.000Z`);
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);

  return toDateKey(last) === toDateKey(yesterday) ? 2 : 1;
};

const sendPush = async (tokens: string[] | undefined, title: string, body: string, data: Record<string, string> = {}) => {
  if (!tokens || tokens.length === 0) {
    return;
  }

  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
};

export const completeTaskWithRating = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required.');
  }

  const { taskId, rating } = request.data as { taskId: string; rating: number };
  if (!taskId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('Invalid payload.');
  }

  const taskRef = db.collection('tasks').doc(taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    throw new Error('Task not found.');
  }

  const task = taskSnap.data() as {
    creatorId: string;
    helperId?: string;
    credits: number;
    status: string;
    title: string;
  };

  if (task.creatorId !== request.auth.uid) {
    throw new Error('Only the creator can complete this task.');
  }

  if (task.status !== 'accepted' || !task.helperId) {
    throw new Error('Task is not in accepted state.');
  }

  const multiplier = RATING_MULTIPLIER[Math.round(rating)] ?? 0.5;
  const earnedCredits = Math.round(task.credits * multiplier);

  const helperRef = db.collection('users').doc(task.helperId);
  const helperSnap = await helperRef.get();
  if (!helperSnap.exists) {
    throw new Error('Helper profile not found.');
  }

  const helper = helperSnap.data() as {
    credits?: number;
    rating?: number;
    completedTasks?: number;
    dailyStreak?: number;
    lastCompletedDate?: string;
    fcmTokens?: string[];
  };

  const currentCompleted = helper.completedTasks ?? 0;
  const currentRating = helper.rating ?? 0;
  const updatedCompleted = currentCompleted + 1;
  const updatedRating = Number(((currentRating * currentCompleted + rating) / updatedCompleted).toFixed(2));

  const todayKey = toDateKey(new Date());
  const streakDelta = getNextStreak(helper.lastCompletedDate);
  const updatedStreak =
    helper.lastCompletedDate === todayKey
      ? helper.dailyStreak ?? 0
      : helper.lastCompletedDate
      ? streakDelta === 2
        ? (helper.dailyStreak ?? 0) + 1
        : 1
      : 1;

  await db.runTransaction(async (transaction) => {
    transaction.update(taskRef, {
      status: 'completed',
      rating,
      completedAt: Date.now(),
      earnedCredits,
    });

    transaction.update(helperRef, {
      credits: (helper.credits ?? 0) + earnedCredits,
      rating: updatedRating,
      completedTasks: updatedCompleted,
      dailyStreak: updatedStreak,
      lastCompletedDate: todayKey,
    });
  });

  await sendPush(helper.fcmTokens, 'Credits awarded', `You earned ${earnedCredits} credits for: ${task.title}`, {
    type: 'credits_awarded',
    taskId,
    credits: String(earnedCredits),
  });

  return { success: true, earnedCredits };
});

export const acceptTask = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required.');
  }

  const { taskId } = request.data as { taskId: string };
  if (!taskId) {
    throw new Error('taskId required');
  }

  const taskRef = db.collection('tasks').doc(taskId);

  await db.runTransaction(async (transaction) => {
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists) {
      throw new Error('Task not found.');
    }

    const task = taskSnap.data() as {
      creatorId: string;
      helperId?: string | null;
      status: string;
    };

    if (task.creatorId === request.auth?.uid) {
      throw new Error('Creator cannot accept own task.');
    }

    if (task.status !== 'open' || task.helperId) {
      throw new Error('Task is no longer available.');
    }

    transaction.update(taskRef, {
      helperId: request.auth?.uid,
      status: 'accepted',
      acceptedAt: Date.now(),
    });
  });

  return { success: true };
});

export const deleteCreatedTask = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required.');
  }

  const { taskId } = request.data as { taskId: string };
  if (!taskId) {
    throw new Error('taskId required');
  }

  const taskRef = db.collection('tasks').doc(taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    throw new Error('Task not found.');
  }

  const task = taskSnap.data() as { creatorId: string; status: string };
  if (task.creatorId !== request.auth.uid) {
    throw new Error('Only the creator can delete this task.');
  }

  if (task.status !== 'open') {
    throw new Error('Only open tasks can be deleted.');
  }

  await taskRef.delete();
  return { success: true };
});

export const requestAdminRole = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required');
  }

  const { uid, adminSecret } = request.data as { uid: string; adminSecret: string };
  if (!uid || uid !== request.auth.uid) {
    throw new Error('Invalid uid');
  }

  if (!ADMIN_SECRET_PASSWORD) {
    throw new Error('Admin signup is not configured');
  }

  if (adminSecret !== ADMIN_SECRET_PASSWORD) {
    throw new Error('Invalid admin secret password.');
  }

  await db.collection('users').doc(uid).update({ role: 'admin' });
  return { success: true };
});

export const notifyNewTaskNearby = onDocumentCreated('tasks/{taskId}', async (event) => {
  const task = event.data?.data() as
    | {
        title: string;
        location?: { latitude: number; longitude: number };
        creatorId: string;
      }
    | undefined;

  if (!task?.location) {
    return;
  }

  const taskLocation = task.location;

  const users = await db.collection('users').get();
  const tokens: string[] = [];

  users.forEach((doc) => {
    const user = doc.data() as { location?: { latitude: number; longitude: number }; fcmTokens?: string[] };
    if (!user.location || !user.fcmTokens?.length || doc.id === task.creatorId) {
      return;
    }

    const latKm = Math.abs(taskLocation.latitude - user.location.latitude) * 111;
    const lonKm = Math.abs(taskLocation.longitude - user.location.longitude) * 87.8;
    const roughDistance = Math.sqrt(latKm * latKm + lonKm * lonKm);
    if (roughDistance <= 1.6) {
      tokens.push(...user.fcmTokens);
    }
  });

  await sendPush(tokens, 'New nearby task', task.title, {
    type: 'new_task',
    taskId: event.params.taskId,
  });
});

export const notifyTaskStatusChange = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const before = event.data?.before.data() as { status?: string; creatorId?: string; helperId?: string; title?: string };
  const after = event.data?.after.data() as { status?: string; creatorId?: string; helperId?: string; title?: string };

  if (!before || !after || before.status === after.status) {
    return;
  }

  if (after.status === 'accepted' && after.creatorId) {
    const creator = await db.collection('users').doc(after.creatorId).get();
    const tokens = (creator.data() as { fcmTokens?: string[] } | undefined)?.fcmTokens;
    await sendPush(tokens, 'Task accepted', `${after.title ?? 'Your task'} was accepted`, {
      type: 'task_accepted',
      taskId: event.params.taskId,
    });
  }

  if (after.status === 'completed' && after.helperId) {
    const helper = await db.collection('users').doc(after.helperId).get();
    const tokens = (helper.data() as { fcmTokens?: string[] } | undefined)?.fcmTokens;
    await sendPush(tokens, 'Task completed', `${after.title ?? 'Task'} has been completed`, {
      type: 'task_completed',
      taskId: event.params.taskId,
    });
  }
});

export const banUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required');
  }

  const currentUser = await db.collection('users').doc(request.auth.uid).get();
  const role = (currentUser.data() as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    throw new Error('Admin only action');
  }

  const { uid, banned } = request.data as { uid: string; banned: boolean };
  if (!uid) {
    throw new Error('uid required');
  }

  await db.collection('users').doc(uid).update({ banned: !!banned });
  if (banned) {
    await getAuth().revokeRefreshTokens(uid);
  }

  return { success: true };
});

export const addCreditsToUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new Error('Authentication required');
  }

  const currentUser = await db.collection('users').doc(request.auth.uid).get();
  const role = (currentUser.data() as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    throw new Error('Admin only action');
  }

  const { uid, amount } = request.data as { uid: string; amount: number };
  if (!uid) {
    throw new Error('uid required');
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 50) {
    throw new Error('amount must be > 0 and <= 50');
  }

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new Error('User not found');
    }

    const userData = userSnap.data() as { credits?: number };
    transaction.update(userRef, {
      credits: (userData.credits ?? 0) + amount,
    });
  });

  return { success: true };
});

export const health = onRequest((_, response) => {
  response.status(200).send('The Volunteer functions are healthy.');
});
