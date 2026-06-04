/**
 * Thin client-side fetch wrapper that understands our { success, data | error }
 * envelope and throws a friendly Error on failure (so React Query surfaces it).
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response
  }

  const body = payload as { success?: boolean; data?: T; error?: string } | null;

  if (!res.ok || !body?.success) {
    throw new ApiClientError(body?.error ?? "Request failed.", res.status);
  }
  return body.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
