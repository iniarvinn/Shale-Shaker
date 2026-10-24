import { API_BASE_URL } from './config';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    // For non-JSON responses, try to parse as text and return
    const text = await response.text();
    return text as unknown as T;
  }

  let errorMessage = response.statusText;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      } else if (data?.message) {
        errorMessage = data.message;
      }
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }
  } catch {
    // ignore parse errors
  }

  const error = new Error(errorMessage) as Error & { status?: number; raw?: Response };
  error.status = response.status;
  error.raw = response;
  throw error;
}

export const http = {
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'GET',
      ...options,
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: BodyInit | null, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers || {});
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (body instanceof FormData) {
      headers.delete('Content-Type');
    }

    const response = await fetch(buildUrl(path), {
      method: 'POST',
      body: body ?? undefined,
      ...options,
      headers,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'DELETE',
      ...options,
    });
    return handleResponse<T>(response);
  },

  buildUrl,
};
