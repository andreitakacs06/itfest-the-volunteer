import { TaskCategory } from '../utils/theme';

export type UserRole      = 'user' | 'admin';
export type TaskStatus    = 'open' | 'accepted' | 'completed';
export type RequesterType = 'juridic' | 'physical';

export { TaskCategory };

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
  /** Total accumulated volunteer hours */
  credits: number;
  rating: number;
  completedTasks: number;
  dailyStreak: number;
  lastCompletedDate?: string;
  location?: GeoLocation;
  banned?: boolean;
  fcmTokens?: string[];
  createdAt?: number;
  requesterType?: RequesterType;
}

export interface JuridicTaskDetails {
  organizationName: string;
  representativeName: string;
  organizationAddress: string;
}

export interface PhysicalTaskDetails {
  contactPhone: string;
  preferredTime: string;
  accessDetails: string;
}

export interface Task {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  /** @deprecated use estimatedHours. Kept for Firestore backwards compat. */
  credits: number;
  /** Canonical hours field */
  estimatedHours?: number;
  category?: TaskCategory;
  creatorType?: RequesterType;
  requesterDetails?: JuridicTaskDetails | PhysicalTaskDetails;
  location: GeoLocation;
  status: TaskStatus;
  creatorId: string;
  creatorName?: string;
  helperId?: string;
  rating?: number;
  earnedCredits?: number;
  earnedHours?: number;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
}

/** Returns the canonical hours value regardless of which field is populated. */
export const getTaskHours = (task: Pick<Task, 'estimatedHours' | 'credits'>): number =>
  task.estimatedHours ?? task.credits ?? 0;
