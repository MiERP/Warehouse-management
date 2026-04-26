export type ApiList<T> = { items?: T[]; data?: T[]; total?: number } | T[];

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) {
    const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();
    const message = typeof payload === 'string' ? payload : payload?.message ?? payload?.detail ?? 'Yêu cầu không thành công';
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return contentType.includes('application/json') ? response.json() : response.blob();
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  return parseResponse(response) as Promise<T>;
}

export function toItems<T>(payload: ApiList<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

export function toTotal<T>(payload: ApiList<T>, fallback: number): number {
  return Array.isArray(payload) ? payload.length : payload.total ?? fallback;
}

export async function download(path: string, fileName: string) {
  const blob = await api<Blob>(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
