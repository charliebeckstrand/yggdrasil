import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { DeclareRequestSchema, DeclareResponseSchema, ErrorSchema } from '../lib/schemas.js'
import { resolve } from '../services/resolver.js'

let declareCounter = 0

const declareRoute = createRoute({
	method: 'post',
	path: '/declare',
	tags: ['Intents'],
	summary: 'Declare an intent for async resolution',
	description:
		'Accepts the intent immediately and resolves it in the background. Optionally calls back with the result.',
	request: {
		body: {
			content: { 'application/json': { schema: DeclareRequestSchema } },
			required: true,
		},
	},
	responses: {
		202: {
			content: { 'application/json': { schema: DeclareResponseSchema } },
			description: 'Intent accepted for async resolution',
		},
		400: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Invalid request body',
		},
	},
})

export const declareIntent = new OpenAPIHono().openapi(declareRoute, async (c) => {
	const { intent, payload, callback } = c.req.valid('json')

	const id = `decl_${Date.now()}_${++declareCounter}`

	resolveAsync(id, intent, payload, callback)

	return c.json(
		{
			accepted: true,
			intent,
			id,
		},
		202,
	)
})

function resolveAsync(
	id: string,
	intent: string,
	payload: Record<string, unknown>,
	callback?: string,
): void {
	resolve(intent, payload)
		.then(async (result) => {
			if (callback) {
				try {
					await fetch(callback, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id, intent, ...result }),
						signal: AbortSignal.timeout(10_000),
					})
				} catch (err) {
					console.error(`[forseti] Callback delivery failed for ${id}:`, err)
				}
			}
		})
		.catch((err) => {
			console.error(`[forseti] Async resolution failed for ${id}:`, err)
		})
}
