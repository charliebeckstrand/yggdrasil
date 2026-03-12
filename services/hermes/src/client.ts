import { hc } from 'hono/client'

import type { HermesApp } from './app.js'

export type { HermesApp }

export function createHermesClient(baseUrl = 'http://localhost:3001') {
	return hc<HermesApp>(baseUrl)
}

export interface PublishOptions {
	topic: string
	payload: Record<string, unknown>
	source: string
}

/**
 * Publish a message to Hermes.
 * Fire-and-forget — does not throw on failure.
 */
export function publishMessage(
	client: ReturnType<typeof createHermesClient>,
	options: PublishOptions,
): void {
	client.msg.publish
		.$post({ json: options }, { init: { signal: AbortSignal.timeout(5000) } })
		.catch(() => {
			// Silently ignore — Hermes being down should not affect callers
		})
}
