import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { ErrorSchema, ResolveRequestSchema, ResolveResponseSchema } from '../lib/schemas.js'
import { resolve } from '../services/resolver.js'

const resolveRoute = createRoute({
	method: 'post',
	path: '/resolve',
	tags: ['Intents'],
	summary: 'Resolve an intent synchronously',
	description:
		'Routes the intent to the appropriate provider and returns the result. Blocks until resolution completes.',
	request: {
		body: {
			content: { 'application/json': { schema: ResolveRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: ResolveResponseSchema } },
			description: 'Intent resolved (check `resolved` field for success/failure)',
		},
		400: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Invalid request body',
		},
	},
})

export const resolveIntent = new OpenAPIHono().openapi(resolveRoute, async (c) => {
	const { intent, payload } = c.req.valid('json')

	const result = await resolve(intent, payload)

	return c.json(
		{
			intent,
			...result,
		},
		200,
	)
})
