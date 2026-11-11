import { apiRequest, ApiResponse } from './api';
import { Startup, StartupDocument, TeamMember } from './founder.api';

export interface InvestorProfile {
  interests: string[];
  ticketMin?: number;
  ticketMax?: number;
  pastInvestments: string[];
}

export interface InvestorUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  investorProfile: InvestorProfile;
}

export interface BrowseFilterParams {
  search?: string;
  industry?: string;
  stage?: string;
  minFunding?: number | string;
  maxFunding?: number | string;
  sort?: 'recent' | 'views' | 'funding_asc' | 'funding_desc' | string;
  page?: number;
  limit?: number;
}

export interface BrowseStartupsResponse {
  startups: Startup[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface DocumentAccessResponse {
  document: StartupDocument;
  signedUrl: string;
  expiresIn: number;
}

export interface InvestorAccessRequest {
  _id: string;
  documentId: {
    _id: string;
    title: string;
    type: string;
    accessLevel: string;
  };
  startupId: {
    _id: string;
    name: string;
    tagline: string;
    stage: string;
    industry: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface InvestorConnection {
  _id: string;
  founderId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    headline?: string;
  };
  startupId: {
    _id: string;
    name: string;
    tagline: string;
    stage: string;
    industry: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
}

export interface InvestorRequestsResponse {
  accessRequests: InvestorAccessRequest[];
  connections: InvestorConnection[];
}

// 1. Browse & search startups
export async function browseStartups(params: BrowseFilterParams = {}): Promise<ApiResponse<BrowseStartupsResponse>> {
  const queryParams = new URLSearchParams();
  queryParams.set('browse', 'true');

  if (params.search) queryParams.set('search', params.search);
  if (params.industry && params.industry !== 'all') queryParams.set('industry', params.industry);
  if (params.stage && params.stage !== 'all') queryParams.set('stage', params.stage);
  if (params.minFunding !== undefined && params.minFunding !== '') queryParams.set('minFunding', String(params.minFunding));
  if (params.maxFunding !== undefined && params.maxFunding !== '') queryParams.set('maxFunding', String(params.maxFunding));
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));

  return apiRequest<BrowseStartupsResponse>(`/startups?${queryParams.toString()}`);
}

// 2. Startup details with documents
export async function getStartupDetails(id: string): Promise<ApiResponse<{ startup: Startup; documents: StartupDocument[] }>> {
  return apiRequest<{ startup: Startup; documents: StartupDocument[] }>(`/startups/${id}`);
}

// 3. Document access & signed URL
export async function getDocumentAccess(documentId: string): Promise<ApiResponse<DocumentAccessResponse>> {
  return apiRequest<DocumentAccessResponse>(`/documents/${documentId}/access`);
}

// 4. Request document access
export async function requestDocumentAccess(documentId: string): Promise<ApiResponse<{ accessRequest: any }>> {
  return apiRequest<{ accessRequest: any }>('/access-requests', {
    method: 'POST',
    body: JSON.stringify({ documentId }),
  });
}

// 5. Connect with founder
export async function sendConnectionRequest(startupId: string, message?: string): Promise<ApiResponse<{ connection: any }>> {
  return apiRequest<{ connection: any }>('/connections', {
    method: 'POST',
    body: JSON.stringify({ startupId, message }),
  });
}

// 6. Watchlist save / unsave
export async function saveStartup(startupId: string): Promise<ApiResponse<{ savedStartups: string[] }>> {
  return apiRequest<{ savedStartups: string[] }>(`/startups/${startupId}/save`, {
    method: 'POST',
  });
}

export async function unsaveStartup(startupId: string): Promise<ApiResponse<{ savedStartups: string[] }>> {
  return apiRequest<{ savedStartups: string[] }>(`/startups/${startupId}/save`, {
    method: 'DELETE',
  });
}

export async function getSavedStartups(): Promise<ApiResponse<{ savedStartups: Startup[] }>> {
  return apiRequest<{ savedStartups: Startup[] }>('/investor/saved');
}

// 7. My requests (access requests + connections)
export async function getMyInvestorRequests(): Promise<ApiResponse<InvestorRequestsResponse>> {
  return apiRequest<InvestorRequestsResponse>('/investor/requests');
}

// 8. Investor profile
export async function getInvestorProfile(): Promise<ApiResponse<{ user: InvestorUser }>> {
  return apiRequest<{ user: InvestorUser }>('/investor/profile');
}

export async function updateInvestorProfile(data: Partial<InvestorUser> & Partial<InvestorProfile>): Promise<ApiResponse<{ user: InvestorUser }>> {
  return apiRequest<{ user: InvestorUser }>('/investor/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

