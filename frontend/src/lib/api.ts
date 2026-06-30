import type { AdminStats, BannedEmail, Pawn, PawnFilters, PawnImage, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_KEY = 'pawnnexus.token';

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export const api = {
  async register(username: string, email: string, password: string) {
    return request<{ token: string; user: User }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },
  async login(identifier: string, password: string) {
    return request<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
  async me() {
    return request<{ user: User }>('/me', { auth: true });
  },
  async pawns(filters: PawnFilters = {}) {
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });

    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request<{ pawns: Pawn[] }>(`/pawns${suffix}`);
  },
  async pawn(id: string) {
    return request<{ pawn: Pawn }>(`/pawns/${id}`, { auth: true });
  },
  async myPawns() {
    return request<{ pawns: Pawn[] }>('/me/pawns', { auth: true });
  },
  async createPawn(payload: Partial<Pawn>) {
    return request<{ pawn: Pawn }>('/pawns', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true,
    });
  },
  async updatePawn(id: string, payload: Partial<Pawn>) {
    return request<{ pawn: Pawn }>(`/pawns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      auth: true,
    });
  },
  async refreshPawn(id: string) {
    return request<{ pawn: Pawn }>(`/pawns/${id}/refresh`, {
      method: 'POST',
      auth: true,
    });
  },
  async deletePawn(id: string) {
    return request<{ ok: true }>(`/pawns/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
  async upload(images: Array<{ original: File; image: File; thumb: File }>) {
    const data = new FormData();
    data.set('count', String(images.length));
    images.forEach((item, index) => {
      data.set(`original_${index}`, item.original);
      data.set(`image_${index}`, item.image);
      data.set(`thumb_${index}`, item.thumb);
    });

    return request<{ images: PawnImage[]; imageUrl: string; thumbnailUrl: string }>('/upload', {
      method: 'POST',
      body: data,
      auth: true,
    });
  },
  async adminStats() {
    return request<{ stats: AdminStats }>('/admin/stats', { auth: true });
  },
  async adminUsers() {
    return request<{ users: User[] }>('/admin/users', { auth: true });
  },
  async deleteUser(id: string) {
    return request<{ ok: true }>(`/admin/users/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
  async bannedEmails() {
    return request<{ bannedEmails: BannedEmail[] }>('/admin/banned-emails', { auth: true });
  },
  async banEmail(email: string, reason: string) {
    return request<{ ok: true }>('/admin/ban-email', {
      method: 'POST',
      body: JSON.stringify({ email, reason }),
      auth: true,
    });
  },
  async unbanEmail(email: string) {
    return request<{ ok: true }>('/admin/unban-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: true,
    });
  },
  async pendingPawns() {
    return request<{ pawns: Pawn[] }>('/admin/pending', { auth: true });
  },
  async approvePawn(id: string) {
    return request<{ pawn: Pawn }>(`/admin/approve/${id}`, {
      method: 'POST',
      auth: true,
    });
  },
  async rejectPawn(id: string) {
    return request<{ pawn: Pawn }>(`/admin/reject/${id}`, {
      method: 'POST',
      auth: true,
    });
  },
};
