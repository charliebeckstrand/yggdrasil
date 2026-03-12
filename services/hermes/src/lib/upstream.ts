import { hc } from 'hono/client'
import type { VidarApp } from 'vidar'
import type { ZodType } from 'zod'

import { type CircuitBreaker, createCircuitBreaker } from './circuit-breaker.js'
import { environment } from './env.js'

let vidarClient: ReturnType<typeof hc<VidarApp>> | null = null

export const vidarBreaker: CircuitBreaker = createCircuitBreaker('vidar')

export function getVidarClient(): ReturnType<typeof hc<VidarApp>> {
	if (!vidarClient) {
		const env = environment()

		vidarClient = hc<VidarApp>(env.VIDAR_URL, {
			headers: env.VIDAR_API_KEY ? { Authorization: `Bearer ${env.VIDAR_API_KEY}` } : undefined,
		})
	}

	return vidarClient
}

export function resetClients(): void {
	vidarClient = null

	vidarBreaker.reset()
}

export async function forwardToService<T>(
	breaker: CircuitBreaker,
	serviceName: string,
	schema: ZodType<T>,
	fn: () => Promise<Response>,
): Promise<T> {
	const res = await breaker.execute(() =>
		fn().then((r) => {
			if (!r.ok && r.status >= 500) throw new Error(`${serviceName} returned ${r.status}`)

			return r
		}),
	)

	return schema.parse(await res.json())
}

export function gatewayError(serviceName: string, error: unknown) {
	return {
		error: 'Bad Gateway',
		message: error instanceof Error ? error.message : `${serviceName} is unavailable`,
		statusCode: 502,
	} as const
}
