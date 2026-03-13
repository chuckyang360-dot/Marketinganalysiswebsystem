import type { FullAnalysisResponse } from '../types/analysis';

const API_BASE_URL = 'http://localhost:8000';

export async function runFullAnalysis(query: string): Promise<FullAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/full-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit: 20 }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
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
