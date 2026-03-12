import { Hono } from 'hono'
import { createBearerAuth, timingSafeCompare } from '../api-key.js'

describe('timingSafeCompare', () => {
	it('returns true for identical strings', () => {
		expect(timingSafeCompare('hello', 'hello')).toBe(true)
	})

	it('returns false for different strings', () => {
		expect(timingSafeCompare('hello', 'world')).toBe(false)
	})

	it('returns false for different lengths', () => {
		expect(timingSafeCompare('short', 'much-longer-string')).toBe(false)
	})

	it('returns true for empty strings', () => {
		expect(timingSafeCompare('', '')).toBe(true)
	})
})

describe('createBearerAuth', () => {
	it('allows requests with the correct token', async () => {
		const app = new Hono()

		app.use(
			'*',
			createBearerAuth(() => 'secret-token'),
		)

		app.get('/', (c) => c.json({ ok: true }))

		const res = await app.request('/', {
			headers: { Authorization: 'Bearer secret-token' },
		})

		expect(res.status).toBe(200)
	})

	it('rejects requests with wrong token', async () => {
		const app = new Hono()

		app.use(
			'*',
			createBearerAuth(() => 'secret-token'),
		)

		app.get('/', (c) => c.json({ ok: true }))

		const res = await app.request('/', {
			headers: { Authorization: 'Bearer wrong-token' },
		})

		expect(res.status).toBe(401)
	})

	it('rejects requests with no Authorization header', async () => {
		const app = new Hono()

		app.use(
			'*',
			createBearerAuth(() => 'secret-token'),
		)

		app.get('/', (c) => c.json({ ok: true }))

		const res = await app.request('/')

		expect(res.status).toBe(401)
	})

	it('rejects when token provider returns undefined', async () => {
		const app = new Hono()

		app.use(
			'*',
			createBearerAuth(() => undefined),
		)

		app.get('/', (c) => c.json({ ok: true }))

		const res = await app.request('/', {
			headers: { Authorization: 'Bearer any-token' },
		})

		expect(res.status).toBe(401)
	})
})
