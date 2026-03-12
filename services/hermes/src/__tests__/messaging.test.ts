import { createHermesApp } from '@/app'

describe('messaging routes', () => {
	const app = createHermesApp()

	describe('POST /msg/publish', () => {
		it('publishes a message and returns 201', async () => {
			const res = await app.request('/msg/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: 'security.alert',
					payload: { ip: '10.0.0.1', reason: 'brute force' },
					source: 'vidar',
				}),
			})

			expect(res.status).toBe(201)

			const data = (await res.json()) as {
				id: string
				topic: string
				payload: Record<string, unknown>
				source: string
				timestamp: string
			}

			expect(data.id).toMatch(/^msg_/)
			expect(data.topic).toBe('security.alert')
			expect(data.payload.ip).toBe('10.0.0.1')
			expect(data.source).toBe('vidar')
			expect(data.timestamp).toBeTruthy()
		})

		it('rejects a message with missing topic', async () => {
			const res = await app.request('/msg/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					payload: { test: true },
					source: 'test',
				}),
			})

			expect(res.status).toBe(400)
		})

		it('rejects a message with missing source', async () => {
			const res = await app.request('/msg/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: 'test.topic',
					payload: { test: true },
				}),
			})

			expect(res.status).toBe(400)
		})
	})

	describe('GET /msg/topics', () => {
		it('returns subscriber count', async () => {
			const res = await app.request('/msg/topics')

			expect(res.status).toBe(200)

			const data = (await res.json()) as { subscribers: number }

			expect(data.subscribers).toBeTypeOf('number')
		})
	})

	describe('GET /msg/health', () => {
		it('returns healthy status', async () => {
			const res = await app.request('/msg/health')

			expect(res.status).toBe(200)

			const data = (await res.json()) as {
				status: string
				version: string
				uptime: number
			}

			expect(data.status).toBe('healthy')
			expect(data.version).toBe('0.1.0')

			expect(data.uptime).toBeTypeOf('number')
		})
	})
})
