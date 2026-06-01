/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  TEAM_LEADER = 'TEAM_LEADER',
  EMPLOYEE = 'EMPLOYEE'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  companyId: string;
  phone?: string;
  isSuspended?: boolean;
  createdAt: string;
  // Excluded in client-side responses, present in database
  passwordHash?: string;
}

export interface Team {
  id: string;
  name: string;
  companyId: string;
  leaderId: string; // User ID
  department: string;
  employeeIds: string[]; // User IDs mapped to the team
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  commenterId: string;
  commenterName: string;
  commenterRole: UserRole;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
}

export interface TaskActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assignedTo: string; // User ID
  createdBy: string; // User ID
  deadline: string; // ISO date string
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 to 100
  recurringType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isFutureScheduled?: boolean;
  scheduledDate?: string; // ISO date string for future release
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activityLogs: TaskActivityLog[];
  createdAt: string;
}

export interface PerformanceScore {
  id: string;
  userId: string;
  companyId: string;
  monthYear: string; // e.g., "05/2026"
  taskCompletionRate: number; // Percentage
  deadlineAdherence: number; // Percentage
  productivityScore: number; // Scale of 1 to 100
  responseTime: number; // Hours on average
  attendanceConsistency: number; // Percentage
  updatedAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  industry: string;
  notes?: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  clientName: string;
  companyId: string;
  loggedById: string;
  loggedByName: string;
  mode: 'CALL' | 'EMAIL' | 'MEETING';
  notes: string;
  createdAt: string; // ISO string
}

export interface Notification {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'TASK_ASSIGNED' | 'DEADLINE_REMINDER' | 'TASK_OVERDUE' | 'SYSTEM' | 'WELCOME';
  createdAt: string;
}

export interface AuthSession {
  user: Omit<User, 'passwordHash'>;
  company: Company;
  token: string;
}
