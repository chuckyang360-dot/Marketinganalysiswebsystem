const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://marketinganalysiswebsystem-production.up.railway.app';

const TOKEN_KEY = 'gp_access_token';
const USER_KEY = 'gp_user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AnalysisHistoryResponse {
  tasks: Array<{
    id: number;
    keyword: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    progress: {
      total_mentions: number;
      positive_count: number;
      negative_count: number;
      neutral_count: number;
    };
  }>;
}

class AuthError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleResponse(response: Response): Promise<AuthResponse> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new AuthError(error.message || error.detail || 'Authentication failed', response.status);
  }
  return response.json();
}

export async function loginWithEmail(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function registerWithEmail(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export function loginWithGoogle(): void {
  const googleAuthUrl = `${API_BASE_URL}/api/auth/google`;
  window.location.href = googleAuthUrl;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): Record<string, unknown> | null {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function fetchAnalysisHistory(token: string): Promise<AnalysisHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/x-analysis/history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || '请求失败');
  }

  return response.json();
}

export interface TaskDetail {
  task_id: number;
  keyword: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  analysis_summary: string;
  stats: {
    total_mentions: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
  };
  mentions: Array<{
    text: string;
    author: string;
    engagement: number;
    sentiment: string;
  }>;
  sentimentTrend: Array<{ date: string; positive: number; negative: number }>;
  influencers: Array<{ name: string; followers: number; influence: string }>;
  alerts: string[];
  competitors: string[];
  hashtags: string[];
}

export async function fetchTaskDetail(token: string, taskId: number): Promise<TaskDetail> {
  const response = await fetch(`${API_BASE_URL}/api/x-analysis/history/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = '请求失败';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status} - ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
