import { OpenAPIHono } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import type { HuginnEvent } from '../lib/emitter.js'
import { eventEmitter } from '../lib/emitter.js'
import { apiKeyAuth } from '../middleware/auth.js'

const app = new OpenAPIHono()

app.use('/stream', apiKeyAuth())

app.get('/stream', (c) => {
	const topicFilter = c.req.query('topic')

	return streamSSE(c, async (stream) => {
		const handler = (event: HuginnEvent) => {
			if (topicFilter && event.topic !== topicFilter) return

			stream.writeSSE({
				data: JSON.stringify(event),
				event: event.topic,
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

export const eventStream = app
