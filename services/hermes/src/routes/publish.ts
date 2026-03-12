import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { createMessageId, getEmitter, type HermesMessage } from '../lib/emitter.js'

const PublishSchema = z
	.object({
		topic: z
			.string()
			.min(1)
			.max(255)
			.openapi({ description: 'Topic to publish to', example: 'security.alert' }),
		payload: z.record(z.string(), z.unknown()).openapi({ description: 'Message payload' }),
		source: z
			.string()
			.min(1)
			.max(100)
			.openapi({ description: 'Service publishing the message', example: 'vidar' }),
	})
	.openapi('PublishMessage')

const PublishedMessageSchema = z
	.object({
		id: z.string(),
		topic: z.string(),
		payload: z.record(z.string(), z.unknown()),
		source: z.string(),
		timestamp: z.string(),
	})
	.openapi('PublishedMessage')

const publishRoute = createRoute({
	method: 'post',
	path: '/publish',
	tags: ['Messaging'],
	summary: 'Publish a message to a topic',
	description: 'Publishes a message that will be delivered to all subscribers of the given topic.',
	request: {
		body: {
			content: { 'application/json': { schema: PublishSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: PublishedMessageSchema } },
			description: 'Message published',
		},
	},
})

export const publish = new OpenAPIHono().openapi(publishRoute, async (c) => {
	const { topic, payload, source } = c.req.valid('json')

	const message: HermesMessage = {
		id: createMessageId(),
		topic,
		payload,
		source,
		timestamp: new Date().toISOString(),
	}

	getEmitter().emit('message', message)

	return c.json(message, 201)
})
