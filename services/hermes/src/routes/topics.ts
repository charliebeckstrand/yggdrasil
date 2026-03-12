import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { getEmitter } from '../lib/emitter.js'

const TopicsResponseSchema = z
	.object({
		subscribers: z.number().openapi({ description: 'Total active SSE subscribers' }),
	})
	.openapi('TopicsInfo')

const topicsRoute = createRoute({
	method: 'get',
	path: '/topics',
	tags: ['Messaging'],
	summary: 'Get messaging info',
	description: 'Returns the current number of active subscribers.',
	responses: {
		200: {
			content: { 'application/json': { schema: TopicsResponseSchema } },
			description: 'Messaging info',
		},
	},
})

export const topics = new OpenAPIHono().openapi(topicsRoute, async (c) => {
	const emitter = getEmitter()

	return c.json(
		{
			subscribers: emitter.listenerCount('message'),
		},
		200,
	)
})
