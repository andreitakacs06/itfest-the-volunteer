export type UserRole = 'user' | 'admin';
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskStatus = 'open' | 'accepted' | 'completed';
export type RequesterType = 'juridic' | 'physical';

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
  difficulty: TaskDifficulty;
  credits: number;
  estimatedHours?: number;
  creatorType?: RequesterType;
  requesterDetails?: JuridicTaskDetails | PhysicalTaskDetails;
  location: GeoLocation;
  status: TaskStatus;
  creatorId: string;
  helperId?: string;
  rating?: number;
  earnedCredits?: number;
  earnedHours?: number;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
}
