import type { FullAnalysisResponse, WorkspaceAnalysisResult } from '../types/analysis';
import { API_BASE_URL } from '../config/api';

/** CEO 统一入口扩展字段（如电商主图优化） */
export type FullAnalysisExtras = {
  action?: string;
  user_prompt?: string;
  selected_reference_images?: string[];
};

export async function runFullAnalysis(
  query: string,
  extras?: FullAnalysisExtras
): Promise<WorkspaceAnalysisResult> {
  console.log("API_FULL_ANALYSIS_REQUEST", { query, limit: 20, extras });

  const body: Record<string, unknown> = { query, limit: 20 };
  if (extras?.action != null) body.action = extras.action;
  if (extras?.user_prompt != null) body.user_prompt = extras.user_prompt;
  if (extras?.selected_reference_images != null) {
    body.selected_reference_images = extras.selected_reference_images;
  }

  const response = await fetch(`${API_BASE_URL}/api/full-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log("API_FULL_ANALYSIS_RESPONSE_STATUS", response.status, response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API_FULL_ANALYSIS_ERROR", response.status, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const text = await response.text();
  console.log("API_FULL_ANALYSIS_RESPONSE_TEXT", text.substring(0, 500));

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    console.error("API_FULL_ANALYSIS_PARSE_ERROR", parseError);
    throw new Error('Failed to parse API response as JSON');
  }

  console.log("API_FULL_ANALYSIS_RESPONSE", data);

  // 基础校验（兼容关键词分析 + 电商 URL 分析）
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: data is null or not an object');
  }

  // 电商解析结果（后端会返回 type=ecom_product_analysis）
  if (data.type === 'ecom_product_analysis') {
    return data as WorkspaceAnalysisResult;
  }

  // 兼容原 full-analysis 结构（可能包裹了 status）
  const maybeFull = (data.query ? data : data) as FullAnalysisResponse;
  if (!maybeFull.query || !maybeFull.reddit_analysis || !maybeFull.seo_analysis) {
    throw new Error('Invalid response: missing required fields (query, reddit_analysis, seo_analysis)');
  }

  return maybeFull as WorkspaceAnalysisResult;
}

// Auth API functions
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    google_id: string | null;
    picture: string | null;
    is_active: boolean;
    created_at: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: LoginResponse['user'];
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  // Logout is handled client-side by removing stored data
  return Promise.resolve();
}

// Token storage utilities
export const TOKEN_KEY = 'gp_access_token';
export const USER_KEY = 'gp_user';

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function setUser(user: LoginResponse['user']): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): LoginResponse['user'] | null {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): LoginResponse['user'] | null {
  return getUser();
}
