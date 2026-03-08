import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { loadEnv } from '../lib/env.js'

// --- Schema ---

const ServiceStatusSchema = z.object({
	status: z.enum(['up', 'down', 'unknown']),
	latency: z.number().optional(),
})

const HealthResponseSchema = z
	.object({
		status: z.enum(['healthy', 'degraded', 'unhealthy']),
		version: z.string(),
		uptime: z.number(),
		services: z.record(z.string(), ServiceStatusSchema),
	})
	.openapi('HealthResponse')

// --- Route ---

const healthRoute = createRoute({
	method: 'get',
	path: '/health',
	tags: ['System'],
	summary: 'Health check',
	description: 'Returns the health status of the gateway and connected services',
	responses: {
		200: {
			content: { 'application/json': { schema: HealthResponseSchema } },
			description: 'Service is healthy or degraded',
		},
		503: {
			content: { 'application/json': { schema: HealthResponseSchema } },
			description: 'Service is unhealthy',
		},
	},
})

// --- Helpers ---

type ServiceStatus = z.infer<typeof ServiceStatusSchema>

async function checkHeimdall(url: string): Promise<ServiceStatus> {
	const start = Date.now()

	try {
		const response = await fetch(`${url}/auth/health`, {
			signal: AbortSignal.timeout(3000),
		})

		const latency = Date.now() - start

		return response.ok ? { status: 'up', latency } : { status: 'down', latency }
	} catch {
		return { status: 'down', latency: Date.now() - start }
	}
}

// --- Handler ---

const startTime = Date.now()

export const health = new OpenAPIHono().openapi(healthRoute, async (c) => {
	const env = loadEnv()
	const uptimeSeconds = (Date.now() - startTime) / 1000

	const services: Record<string, ServiceStatus> = {}

	if (env.HEIMDALL_URL) {
		services.heimdall = await checkHeimdall(env.HEIMDALL_URL)
	}

	const allUp = Object.values(services).every((s) => s.status === 'up')
	const allDown = Object.values(services).every((s) => s.status === 'down')

	let status: 'healthy' | 'degraded' | 'unhealthy'

	if (Object.keys(services).length === 0 || allUp) {
		status = 'healthy'
	} else if (allDown) {
		status = 'unhealthy'
	} else {
		status = 'degraded'
	}

	const statusCode = status === 'unhealthy' ? 503 : 200

	return c.json(
		{
			status,
			version: '0.1.0',
			uptime: uptimeSeconds,
			services,
		},
		statusCode,
	)
})
