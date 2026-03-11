import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { RegistrySchema } from '../lib/schemas.js'
import { getOperationIndex, getProviders } from '../services/registry.js'

const registryRoute = createRoute({
	method: 'get',
	path: '/registry',
	tags: ['Registry'],
	summary: 'View the operation registry',
	description:
		'Returns all registered providers and their operations discovered from OpenAPI specs',
	responses: {
		200: {
			content: { 'application/json': { schema: RegistrySchema } },
			description: 'Current registry state',
		},
	},
})

export const registry = new OpenAPIHono().openapi(registryRoute, async (c) => {
	return c.json(
		{
			providers: getProviders(),
			operations: getOperationIndex(),
		},
		200,
	)
})
