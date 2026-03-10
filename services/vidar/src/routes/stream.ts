import { OpenAPIHono } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import type { VidarEvent } from '../lib/emitter.js'
import { eventEmitter } from '../lib/emitter.js'
import { apiKeyAuth } from '../middleware/api-key.js'

const app = new OpenAPIHono()

app.use('/stream', apiKeyAuth())

app.get('/stream', (c) => {
	const eventTypeFilter = c.req.query('event_type')

	return streamSSE(c, async (stream) => {
		const handler = (event: VidarEvent) => {
			if (eventTypeFilter && event.event_type !== eventTypeFilter) return

			stream.writeSSE({
				data: JSON.stringify(event),
				event: event.event_type,
				id: event.id,
			})
		}

		eventEmitter.on('event', handler)

		stream.onAbort(() => {
			eventEmitter.off('event', handler)
		})

		// Keep connection alive
		while (true) {
			await stream.sleep(30_000)
		}
	})
})

export const securityStream = app
