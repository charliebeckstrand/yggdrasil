import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'

import { getEmitter, type HermesMessage } from '../lib/emitter.js'

const subscribeRoute = createRoute({
	method: 'get',
	path: '/subscribe',
	tags: ['Messaging'],
	summary: 'Subscribe to messages via SSE',
	description:
		'Opens a Server-Sent Events stream. Optionally filter by topic using a query parameter. Supports comma-separated topics.',
	request: {
		query: z.object({
			topic: z.string().optional().openapi({
				description: 'Topic filter (comma-separated for multiple)',
				example: 'security.alert,security.ban',
			}),
		}),
	},
	responses: {
		200: {
			description: 'SSE stream of messages',
		},
	},
})

export const subscribe = new OpenAPIHono().openapi(subscribeRoute, async (c) => {
	const topicParam = c.req.valid('query').topic

	const topics = topicParam ? topicParam.split(',').map((t) => t.trim()) : null

	const emitter = getEmitter()

	return streamSSE(c, async (stream) => {
		const handler = (message: HermesMessage) => {
			if (topics && !topics.includes(message.topic)) return

			stream.writeSSE({
				data: JSON.stringify(message),
				event: message.topic,
				id: message.id,
			})
		}

		emitter.on('message', handler)

		stream.onAbort(() => {
			emitter.off('message', handler)
		})

		while (true) {
			await stream.sleep(30_000)
		}
	})
})
