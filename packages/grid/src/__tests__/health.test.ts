import { createHealthRoute } from '../health.js'

describe('createHealthRoute', () => {
	it('returns healthy status with version and uptime', async () => {
		const app = createHealthRoute()

		const res = await app.request('/health')

		expect(res.status).toBe(200)

		const body = (await res.json()) as {
			status: string
			version: string
			uptime: number
		}

		expect(body.status).toBe('healthy')
		expect(body.version).toBe('0.1.0')
		expect(body.uptime).toBeTypeOf('number')
		expect(body.uptime).toBeGreaterThanOrEqual(0)
	})

	it('accepts a custom description', async () => {
		const app = createHealthRoute({ description: 'Custom health check' })

		const res = await app.request('/health')

		expect(res.status).toBe(200)
	})

	it('merges custom check data into the response', async () => {
		const app = createHealthRoute({
			check: async () => ({ database: 'connected', subscribers: 42 }),
		})

		const res = await app.request('/health')

		expect(res.status).toBe(200)

		const body = (await res.json()) as {
			status: string
			database: string
			subscribers: number
		}

		expect(body.database).toBe('connected')
		expect(body.subscribers).toBe(42)
	})
})
