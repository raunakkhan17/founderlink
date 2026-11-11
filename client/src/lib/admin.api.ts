import { apiRequest, ApiResponse } from './api';
import { Startup } from './founder.api';

export interface AdminStats {
  users: {
    total: number;
    founders: number;
    investors: number;
    admins: number;
    pending: number;
  };
  startups: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  connections: {
    total: number;
  };
  meetings: {
    active: number;
  };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'founder' | 'investor' | 'admin';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isSuspended: boolean;
  avatarUrl?: string;
  headline?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  ip?: string;
  createdAt: string;
}

// 1. Stats
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  return apiRequest<AdminStats>('/admin/stats');
}

// 2. Pending queue
export async function getPendingUsers(): Promise<ApiResponse<{ users: AdminUser[] }>> {
  return apiRequest<{ users: AdminUser[] }>('/admin/pending/users');
}

export async function reviewUser(id: string, status: 'approved' | 'rejected', reason?: string): Promise<ApiResponse<{ user: AdminUser }>> {
  return apiRequest<{ user: AdminUser }>(`/admin/pending/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function getPendingStartups(): Promise<ApiResponse<{ startups: Startup[] }>> {
  return apiRequest<{ startups: Startup[] }>('/admin/pending/startups');
}

export async function reviewStartup(id: string, status: 'approved' | 'rejected', reason?: string): Promise<ApiResponse<{ startup: Startup }>> {
  return apiRequest<{ startup: Startup }>(`/admin/pending/startups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

// 3. User management
export async function getAdminUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ users: AdminUser[]; total: number; page: number; totalPages: number }>> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return apiRequest<{ users: AdminUser[]; total: number; page: number; totalPages: number }>(`/admin/users?${query.toString()}`);
}

export async function toggleSuspendUser(id: string, isSuspended: boolean): Promise<ApiResponse<{ user: AdminUser }>> {
  return apiRequest<{ user: AdminUser }>(`/admin/users/${id}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ isSuspended }),
  });
}

// 4. Content moderation
export async function deleteReportedContent(type: 'startup' | 'document', id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/content/${type}/${id}`, {
    method: 'DELETE',
  });
}

// 5. Audit logs
export async function getAdminAuditLogs(params: {
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ auditLogs: AdminAuditLog[]; total: number; page: number; totalPages: number }>> {
  const query = new URLSearchParams();
  if (params.action && params.action !== 'all') query.set('action', params.action);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return apiRequest<{ auditLogs: AdminAuditLog[]; total: number; page: number; totalPages: number }>(`/admin/audit-logs?${query.toString()}`);
}

