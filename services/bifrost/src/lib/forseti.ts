import { ForsetiClient } from 'forseti/client'
import { getIpAddress } from 'grid'
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

let _client: ForsetiClient | null = null

export function configureForseti(url?: string): void {
	if (url) {
		_client = new ForsetiClient({ url })
	}
}

/**
 * Middleware that checks if an IP is banned via Forseti → Vidar.
 * Fails open if Forseti is not configured or unreachable.
 */
export function checkBan(): MiddlewareHandler {
	return async (c, next) => {
		if (!_client) {
			await next()

			return
		}

		const ip = getIpAddress(c)

		try {
			const result = await _client.resolve<{ banned: boolean }>('vidar.check-ip', { ip })

			if (result.resolved && result.data?.banned) {
				throw new HTTPException(403, { message: 'Unauthorized' })
			}
		} catch (err) {
			if (err instanceof HTTPException) throw err

			// Forseti/Vidar unreachable — fail open
		}

		await next()
	}
}

/**
 * Report a security event via Forseti → Vidar.
 * Fire-and-forget — does not throw on failure.
 */
export function reportSecurityEvent(
	eventType: string,
	ip: string,
	details: Record<string, unknown> = {},
	service = 'bifrost',
): void {
	if (!_client) return

	_client
		.declare('vidar.ingest-event', {
			ip,
			event_type: eventType,
			details,
			service,
		})
		.catch(() => {
			// Silently ignore — Forseti being down should not affect callers
		})
}
