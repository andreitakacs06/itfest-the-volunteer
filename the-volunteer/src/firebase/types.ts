export type UserRole = 'user' | 'admin';
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskStatus = 'open' | 'accepted' | 'completed';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  rating: number;
  completedTasks: number;
  dailyStreak: number;
  lastCompletedDate?: string;
  location?: GeoLocation;
  banned?: boolean;
  fcmTokens?: string[];
  createdAt?: number;
}

export interface Task {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  credits: number;
  location: GeoLocation;
  status: TaskStatus;
  creatorId: string;
  helperId?: string;
  rating?: number;
  earnedCredits?: number;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
}
