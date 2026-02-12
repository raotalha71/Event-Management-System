import { Event } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || 'http://localhost:8000';

/* ─── Token helpers ─────────────────────────────────────────────────────── */

const TOKEN_KEY = 'access_token';
const USER_KEY  = 'current_user';

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setAuth(token: string, user: any) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser(): any | null {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn(): boolean {
    return !!this.getToken();
  },
};

/* ─── Typed payloads ────────────────────────────────────────────────────── */

export interface CreateEventPayload {
  name: string;
  startDate: string;
  location: string;
  capacity: number;
  description?: string;
}

export interface AiNetworkingRecommendation {
  name: string;
  reason: string;
  starter: string;
  score: number;
  match: any;
}

export interface RagChatResponse {
  answer: string;
  source?: string | null;
  score: number;
  metadata: Record<string, any>;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
  industry?: string;
  interests?: string[];
  skills?: string[];
  goals?: string[];
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: any;
}

export interface ProfileUpdate {
  name?: string;
  company?: string;
  industry?: string;
  interests?: string[];
  skills?: string[];
  goals?: string[];
  avatar?: string;
  phone?: string;
}

/* ─── DTO mapper ────────────────────────────────────────────────────────── */

const mapEventFromDto = (dto: any): Event => ({
  id: dto.id ?? dto._id,
  name: dto.name ?? dto.title ?? 'Untitled Event',
  description: dto.description ?? '',
  startDate: dto.start_date ?? dto.startDate ?? new Date().toISOString(),
  endDate: dto.end_date ?? dto.endDate ?? null,
  location: dto.location ?? 'TBD',
  organizerId: dto.organizer_id ?? dto.organizerId ?? 'u1',
  capacity: dto.capacity ?? 0,
  registeredCount: dto.registered_count ?? dto.registeredCount ?? 0,
  status: dto.status ?? 'draft',
  revenue: dto.revenue ?? 0,
});

/* ─── Fetch helpers ─────────────────────────────────────────────────────── */

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  const token = authStore.getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    authStore.clear();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try { detail = JSON.parse(text)?.detail ?? text; } catch {}
    throw new Error(detail || 'Request failed');
  }
  return response.json() as Promise<T>;
};

/* ─── API ───────────────────────────────────────────────────────────────── */

export const api = {
  /* ── Auth ─────────────────────────────────────────────────────────────── */

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(res);
    authStore.setAuth(data.access_token, data.user);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(res);
    authStore.setAuth(data.access_token, data.user);
    return data;
  },

  async getProfile(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async updateProfile(payload: ProfileUpdate): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getAttendees(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/auth/attendees`, { headers: authHeaders() });
    return handleResponse(res);
  },

  /* ── Events ──────────────────────────────────────────────────────────── */

  async getEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/api/events/`, { headers: authHeaders() });
    const data = await handleResponse<any[]>(response);
    return data.map(mapEventFromDto);
  },

  async createEvent(payload: CreateEventPayload): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/api/events/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        start_date: new Date(payload.startDate).toISOString(),
        location: payload.location,
        organizer_id: authStore.getUser()?.id ?? 'u1',
        capacity: payload.capacity,
      }),
    });
    const data = await handleResponse<any>(response);
    return mapEventFromDto(data);
  },

  /* ── AI ───────────────────────────────────────────────────────────────── */

  async getAiHealth(): Promise<{ ok: boolean; rag_backend: string }> {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`, { headers: authHeaders() });
    return handleResponse(response);
  },

  async getNetworkingRecommendations(user: any, attendees: any[], limit = 3): Promise<AiNetworkingRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/api/ai/networking/recommendations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ user, attendees, limit }),
    });
    return handleResponse(response);
  },

  async ragChat(query: string, snapshot?: any): Promise<RagChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/rag/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ query, snapshot }),
    });
    return handleResponse(response);
  },

  /* ── Connections ─────────────────────────────────────────────────────── */

  async sendConnectionRequest(targetUserId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/connections/request`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    return handleResponse(response);
  },

  async getMyConnections(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/connections/mine`, { headers: authHeaders() });
    return handleResponse(response);
  },

  async removeConnection(connectionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/connections/${connectionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};
