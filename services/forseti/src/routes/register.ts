import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { ErrorSchema, MessageSchema, RegisterSchema } from '../lib/schemas.js'
import { registerProvider } from '../services/registry.js'

const registerRoute = createRoute({
	method: 'post',
	path: '/register',
	tags: ['Registry'],
	summary: 'Register a service with its OpenAPI spec',
	description:
		'Services call this on startup. Forseti fetches the OpenAPI spec to discover all available operations.',
	request: {
		body: {
			content: { 'application/json': { schema: RegisterSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: MessageSchema } },
			description: 'Registration successful',
		},
		400: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Invalid request body',
		},
	},
})

export const register = new OpenAPIHono().openapi(registerRoute, async (c) => {
	const { service, url, spec } = c.req.valid('json')

	try {
		const operationCount = await registerProvider(service, url, spec)

		console.log(`[forseti] Registered ${service} (${operationCount} operations from ${spec})`)

		return c.json({ message: `Registered ${service} with ${operationCount} operations` }, 200)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Registration failed'

		console.error(`[forseti] Failed to register ${service}:`, message)

		return c.json({ message }, 400)
	}
})
