import { Hono } from 'hono'
import { timing } from '@/middleware/timing'

describe('timing middleware', () => {
	it('adds X-Response-Time header', async () => {
		const app = new Hono()

		app.use('*', timing())

		app.get('/', (c) => c.json({ ok: true }))

		const res = await app.request('/')

		expect(res.status).toBe(200)

		const header = res.headers.get('X-Response-Time')

		expect(header).toMatch(/^\d+ms$/)
	})

	it('measures response time in milliseconds', async () => {
		const app = new Hono()

		app.use('*', timing())

		app.get('/slow', async (c) => {
			await new Promise((r) => setTimeout(r, 10))

			return c.json({ ok: true })
		})

		const res = await app.request('/slow')

		const header = res.headers.get('X-Response-Time')

		const ms = Number.parseInt(header?.replace('ms', '') ?? '0', 10)

		expect(ms).toBeGreaterThanOrEqual(5)
	})

	it('logs a warning for slow requests exceeding 1000ms', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		const app = new Hono()

		app.use('*', timing())

		app.get('/very-slow', async (c) => {
			await new Promise((r) => setTimeout(r, 1050))

			return c.json({ ok: true })
		})

		await app.request('/very-slow')

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Slow request'))

		warnSpy.mockRestore()
	})
})
