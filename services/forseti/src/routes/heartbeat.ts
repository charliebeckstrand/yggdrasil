import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { ErrorSchema, HeartbeatSchema, MessageSchema } from '../lib/schemas.js'
import { updateHeartbeat } from '../services/registry.js'

const heartbeatRoute = createRoute({
	method: 'post',
	path: '/heartbeat',
	tags: ['Registry'],
	summary: 'Send a provider heartbeat',
	description: 'Updates the last-seen timestamp for a registered service',
	request: {
		body: {
			content: { 'application/json': { schema: HeartbeatSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: MessageSchema } },
			description: 'Heartbeat accepted',
		},
		404: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Service not registered',
		},
	},
})

export const heartbeat = new OpenAPIHono().openapi(heartbeatRoute, async (c) => {
	const { service } = c.req.valid('json')

	const updated = updateHeartbeat(service)

	if (!updated) {
		return c.json({ message: `Service ${service} is not registered` }, 404)
	}

	return c.json({ message: `Heartbeat received from ${service}` }, 200)
})
