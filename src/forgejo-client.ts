/**
 * Forgejo API client – thin wrapper around fetch for Forgejo REST API v1.
 * Docs: https://forgejo.org/api/swagger
 */

export interface ForgejoConfig {
  baseUrl: string;
  token: string;
}

export class ForgejoError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ForgejoError";
  }
}

export class ForgejoClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: ForgejoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "") + "/api/v1";
    this.headers = {
      Authorization: `token ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      }
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ForgejoError(
        `Forgejo API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    if (response.status === 204 || response.status === 205) {
      const text = await response.text();
      if (!text) return {} as T;
      return JSON.parse(text) as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, params);
  }

  async getRaw(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<string> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      }
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...this.headers,
        Accept: "text/plain",
      },
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = undefined;
      }
      throw new ForgejoError(
        `Forgejo API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    return response.text();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, undefined, body);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("PATCH", path, params, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async put<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("PUT", path, params, body);
  }
}
