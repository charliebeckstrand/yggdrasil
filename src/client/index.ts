/**
 * Bifrost API Client
 *
 * Type-safe client for consuming Bifrost API endpoints.
 * Use `pnpm generate:client` to regenerate types from the OpenAPI spec.
 *
 * Usage in Yggdrasil or other consuming apps:
 *
 * ```ts
 * import { createBifrostClient } from "bifrost/client";
 *
 * const api = createBifrostClient({
 *   baseUrl: "http://localhost:3000",
 *   token: "your-ironclad-token",
 * });
 *
 * const health = await api.get("/health");
 * const users = await api.get("/users", { query: { page: 1, limit: 10 } });
 * ```
 */

export type ClientOptions = {
	baseUrl: string;
	token?: string;
	headers?: Record<string, string>;
};

export function createBifrostClient(options: ClientOptions) {
	const { baseUrl, token, headers: customHeaders = {} } = options;

	const defaultHeaders: Record<string, string> = {
		"Content-Type": "application/json",
		...customHeaders,
	};

	if (token) {
		defaultHeaders.Authorization = `Bearer ${token}`;
	}

	async function request<T>(
		method: string,
		path: string,
		opts?: { query?: Record<string, string | number>; body?: unknown },
	): Promise<T> {
		const url = new URL(path, baseUrl);
		if (opts?.query) {
			for (const [key, value] of Object.entries(opts.query)) {
				url.searchParams.set(key, String(value));
			}
		}

		const res = await fetch(url, {
			method,
			headers: defaultHeaders,
			body: opts?.body ? JSON.stringify(opts.body) : undefined,
		});

		if (!res.ok) {
			const error = await res.json().catch(() => ({ message: res.statusText }));
			throw new BifrostError(res.status, error as { message: string });
		}

		return res.json() as Promise<T>;
	}

	return {
		get: <T>(path: string, opts?: { query?: Record<string, string | number> }) =>
			request<T>("GET", path, opts),
		post: <T>(path: string, opts?: { body?: unknown; query?: Record<string, string | number> }) =>
			request<T>("POST", path, opts),
		put: <T>(path: string, opts?: { body?: unknown; query?: Record<string, string | number> }) =>
			request<T>("PUT", path, opts),
		patch: <T>(path: string, opts?: { body?: unknown; query?: Record<string, string | number> }) =>
			request<T>("PATCH", path, opts),
		delete: <T>(path: string, opts?: { query?: Record<string, string | number> }) =>
			request<T>("DELETE", path, opts),
	};
}

export class BifrostError extends Error {
	constructor(
		public status: number,
		public body: { message: string },
	) {
		super(body.message);
		this.name = "BifrostError";
	}
}
