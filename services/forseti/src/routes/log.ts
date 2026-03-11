import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { LogSchema } from '../lib/schemas.js'
import { getLog } from '../services/resolver.js'

const logRoute = createRoute({
	method: 'get',
	path: '/log',
	tags: ['Observability'],
	summary: 'View resolution log',
	description: 'Returns recent intent resolution entries with timing and status',
	responses: {
		200: {
			content: { 'application/json': { schema: LogSchema } },
			description: 'Resolution log entries',
		},
	},
})

export const resolutionLog = new OpenAPIHono().openapi(logRoute, async (c) => {
	const entries = getLog()

	return c.json(
		{
			entries,
			total: entries.length,
		},
		200,
	)
})
