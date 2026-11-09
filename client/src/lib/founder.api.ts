import { apiRequest, ApiResponse } from './api';

export interface FounderStats {
  profileViews: number;
  startupViews: number;
  accessRequests: {
    total: number;
    pending: number;
  };
  connectionRequests: {
    total: number;
    pending: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'connection' | 'access_request' | 'startup' | string;
    title: string;
    date: string;
    status?: string;
  }>;
}

export interface TeamMember {
  name: string;
  role: string;
  avatarUrl?: string;
  linkedinUrl?: string;
}

export interface Startup {
  _id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: 'idea' | 'mvp' | 'early_traction' | 'growth' | 'scaling';
  problem: string;
  solution: string;
  marketSize?: string;
  team: TeamMember[];
  fundingAsk?: number;
  equityOffered?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  viewsCount?: number;
  documentsCount?: number;
  founderId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StartupDocument {
  _id: string;
  startupId: string;
  title: string;
  type: 'pitch_deck' | 'financial' | 'legal' | 'technical' | 'other';
  fileUrl: string;
  fileType: string;
  fileSize: number;
  accessLevel: 'public' | 'locked' | 'approved_only';
  createdAt: string;
  updatedAt?: string;
}

export interface AccessRequestItem {
  _id: string;
  investorId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  documentId: {
    _id: string;
    title: string;
    type: string;
  };
  startupId: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ConnectionItem {
  _id: string;
  investorId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  startupId: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
}

// API functions
export async function getFounderStats(): Promise<ApiResponse<FounderStats>> {
  return apiRequest<FounderStats>('/founder/stats');
}

export async function getStartups(): Promise<ApiResponse<Startup[]>> {
  return apiRequest<Startup[]>('/startups');
}

export async function getStartupById(id: string): Promise<ApiResponse<Startup>> {
  return apiRequest<Startup>(`/startups/${id}`);
}

export async function createStartup(data: Partial<Startup>): Promise<ApiResponse<Startup>> {
  return apiRequest<Startup>('/startups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStartup(id: string, data: Partial<Startup>): Promise<ApiResponse<Startup>> {
  return apiRequest<Startup>(`/startups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStartup(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/startups/${id}`, {
    method: 'DELETE',
  });
}

export async function getStartupDocuments(startupId: string): Promise<ApiResponse<StartupDocument[]>> {
  return apiRequest<StartupDocument[]>(`/startups/${startupId}/documents`);
}

export async function uploadStartupDocument(
  startupId: string,
  formData: FormData
): Promise<ApiResponse<StartupDocument>> {
  return apiRequest<StartupDocument>(`/startups/${startupId}/documents`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateDocumentAccessLevel(
  documentId: string,
  accessLevel: 'public' | 'locked' | 'approved_only'
): Promise<ApiResponse<StartupDocument>> {
  return apiRequest<StartupDocument>(`/documents/${documentId}/access-level`, {
    method: 'PUT',
    body: JSON.stringify({ accessLevel }),
  });
}

export async function deleteDocument(documentId: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export async function getAccessRequests(): Promise<ApiResponse<AccessRequestItem[]>> {
  return apiRequest<AccessRequestItem[]>('/founder/access-requests');
}

export async function updateAccessRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<ApiResponse<AccessRequestItem>> {
  return apiRequest<AccessRequestItem>(`/founder/access-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getConnectionRequests(): Promise<ApiResponse<ConnectionItem[]>> {
  return apiRequest<ConnectionItem[]>('/founder/connections');
}

export async function updateConnectionRequest(
  connectionId: string,
  status: 'accepted' | 'declined'
): Promise<ApiResponse<ConnectionItem>> {
  return apiRequest<ConnectionItem>(`/founder/connections/${connectionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function uploadAvatar(formData: FormData): Promise<ApiResponse<{ avatarUrl: string }>> {
  return apiRequest<{ avatarUrl: string }>('/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function updateMe(data: { name?: string; bio?: string }): Promise<ApiResponse<{ name: string; bio?: string }>> {
  return apiRequest<{ name: string; bio?: string }>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

