let _intentUrl: string | undefined

/**
 * Configure the intent resolution endpoint.
 * Set once on startup. If not set, intents are silently dropped.
 */
export function configureIntents(intentUrl?: string): void {
	_intentUrl = intentUrl?.replace(/\/$/, '')
}

export interface IntentResult<T = unknown> {
	resolved: boolean
	intent: string
	provider?: string
	data?: T
	error?: string
	duration: number
}

/**
 * Resolve an intent synchronously.
 * Sends the intent to whatever is listening at INTENT_URL.
 * Returns null if no intent URL is configured or if the endpoint is unreachable.
 */
export async function resolveIntent<T = unknown>(
	intent: string,
	payload: Record<string, unknown> = {},
): Promise<IntentResult<T> | null> {
	if (!_intentUrl) return null

	try {
		const res = await fetch(`${_intentUrl}/forseti/resolve`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ intent, payload }),
			signal: AbortSignal.timeout(5000),
		})

		if (!res.ok) return null

		return (await res.json()) as IntentResult<T>
	} catch {
		return null
	}
}

/**
 * Declare an intent for async resolution.
 * Fire-and-forget — does not throw, does not block.
 */
export function declareIntent(
	intent: string,
	payload: Record<string, unknown> = {},
	callback?: string,
): void {
	if (!_intentUrl) return

	fetch(`${_intentUrl}/forseti/declare`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ intent, payload, callback }),
		signal: AbortSignal.timeout(5000),
	}).catch(() => {
		// Silently ignore — intent resolution is best-effort
	})
}
