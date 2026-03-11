// --- Types ---

export interface ForsetiClientConfig {
	url: string
	apiKey?: string
	timeout?: number
}

export interface ProviderRegistration {
	service: string
	url: string
	spec: string
}

export interface ResolveResponse<T = unknown> {
	resolved: boolean
	intent: string
	provider?: string
	data?: T
	error?: string
	duration: number
}

export interface DeclareResponse {
	accepted: boolean
	intent: string
	id: string
}

// --- Client ---

export class ForsetiClient {
	private url: string
	private apiKey?: string
	private timeout: number

	constructor(config: ForsetiClientConfig) {
		this.url = config.url.replace(/\/$/, '')
		this.apiKey = config.apiKey
		this.timeout = config.timeout ?? 5000
	}

	/**
	 * Resolve an intent synchronously.
	 * Forseti routes to the appropriate provider based on its OpenAPI spec.
	 */
	async resolve<T = unknown>(
		intent: string,
		payload: Record<string, unknown> = {},
	): Promise<ResolveResponse<T>> {
		return this.post<ResolveResponse<T>>('/forseti/resolve', { intent, payload })
	}

	/**
	 * Declare an intent for async resolution.
	 * Forseti accepts it immediately and resolves in the background.
	 */
	async declare(
		intent: string,
		payload: Record<string, unknown> = {},
		callback?: string,
	): Promise<DeclareResponse> {
		return this.post<DeclareResponse>('/forseti/declare', { intent, payload, callback })
	}

	/**
	 * Register this service with Forseti.
	 * Passes the OpenAPI spec URL so Forseti can discover all available operations.
	 */
	async register(registration: ProviderRegistration): Promise<void> {
		await this.post('/forseti/register', registration)
	}

	/**
	 * Send a heartbeat to keep registration alive.
	 */
	async heartbeat(service: string): Promise<void> {
		await this.post('/forseti/heartbeat', { service })
	}

	private async post<T>(path: string, body: unknown): Promise<T> {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' }

		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`
		}

		const res = await fetch(`${this.url}${path}`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(this.timeout),
		})

		if (!res.ok) {
			const text = await res.text().catch(() => 'Unknown error')

			throw new Error(`Forseti ${path} failed (${res.status}): ${text}`)
		}

		return res.json() as Promise<T>
	}
}

// --- Convenience registration helper ---

export interface RegisterOptions {
	forsetiUrl?: string
	service: string
	url: string
	spec: string
}

/**
 * One-liner to register a service with Forseti on startup.
 * Silently skips if FORSETI_URL is not set.
 */
export function registerWithForseti(options: RegisterOptions): void {
	if (!options.forsetiUrl) return

	const client = new ForsetiClient({ url: options.forsetiUrl })

	client
		.register({
			service: options.service,
			url: options.url,
			spec: options.spec,
		})
		.then(() => console.log(`[${options.service}] Registered with Forseti`))
		.catch((err) =>
			console.warn(`[${options.service}] Failed to register with Forseti:`, err.message),
		)
}
