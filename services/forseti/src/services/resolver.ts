import { lookupOperation } from './registry.js'

export interface ResolutionLog {
	id: string
	intent: string
	provider: string | null
	method?: string
	path?: string
	resolved: boolean
	duration: number
	error?: string
	timestamp: string
}

const log: ResolutionLog[] = []
const MAX_LOG_SIZE = 1000

let idCounter = 0

function nextId(): string {
	return `res_${Date.now()}_${++idCounter}`
}

export async function resolve(
	intent: string,
	payload: Record<string, unknown>,
): Promise<{
	resolved: boolean
	provider?: string
	data?: unknown
	error?: string
	duration: number
}> {
	const start = performance.now()
	const match = lookupOperation(intent)

	if (!match) {
		const duration = Math.round(performance.now() - start)

		logResolution({
			id: nextId(),
			intent,
			provider: null,
			resolved: false,
			duration,
			error: 'No operation registered',
			timestamp: new Date().toISOString(),
		})

		return { resolved: false, error: `No operation registered for intent: ${intent}`, duration }
	}

	const { provider, operation } = match

	try {
		let url = `${provider.url}${operation.path}`
		const fetchOptions: RequestInit = {
			signal: AbortSignal.timeout(10_000),
			headers: {} as Record<string, string>,
		}

		if (operation.method === 'GET') {
			// Map payload keys to query parameters
			const params = new URLSearchParams()

			for (const [key, value] of Object.entries(payload)) {
				if (value !== undefined && value !== null) {
					params.set(key, String(value))
				}
			}

			const qs = params.toString()

			if (qs) {
				url += `?${qs}`
			}

			fetchOptions.method = 'GET'
		} else {
			// POST/PUT/PATCH/DELETE — send payload as JSON body
			fetchOptions.method = operation.method
			;(fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
			fetchOptions.body = JSON.stringify(payload)
		}

		const res = await fetch(url, fetchOptions)
		const duration = Math.round(performance.now() - start)

		if (!res.ok) {
			const text = await res.text().catch(() => 'Unknown error')

			logResolution({
				id: nextId(),
				intent,
				provider: provider.service,
				method: operation.method,
				path: operation.path,
				resolved: false,
				duration,
				error: `Provider returned ${res.status}: ${text}`,
				timestamp: new Date().toISOString(),
			})

			return {
				resolved: false,
				provider: provider.service,
				error: `Provider returned ${res.status}`,
				duration,
			}
		}

		const contentType = res.headers.get('content-type') ?? ''
		const data = contentType.includes('application/json') ? await res.json() : await res.text()

		logResolution({
			id: nextId(),
			intent,
			provider: provider.service,
			method: operation.method,
			path: operation.path,
			resolved: true,
			duration,
			timestamp: new Date().toISOString(),
		})

		return {
			resolved: true,
			provider: provider.service,
			data,
			duration,
		}
	} catch (err) {
		const duration = Math.round(performance.now() - start)
		const message = err instanceof Error ? err.message : 'Unknown error'

		logResolution({
			id: nextId(),
			intent,
			provider: provider.service,
			method: operation.method,
			path: operation.path,
			resolved: false,
			duration,
			error: message,
			timestamp: new Date().toISOString(),
		})

		return {
			resolved: false,
			provider: provider.service,
			error: message,
			duration,
		}
	}
}

function logResolution(entry: ResolutionLog): void {
	log.push(entry)

	if (log.length > MAX_LOG_SIZE) {
		log.splice(0, log.length - MAX_LOG_SIZE)
	}
}

export function getLog(limit = 50): ResolutionLog[] {
	return log.slice(-limit).reverse()
}

export function resetLog(): void {
	log.length = 0
}
