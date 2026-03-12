import { Hono } from 'hono'
import { errorHandler, notFoundHandler } from '../errors.js'

describe('errorHandler', () => {
	const app = new Hono()

	app.get('/status-error', () => {
		const err = new Error('Forbidden') as Error & { status: number }

		err.status = 403

		throw err
	})

	app.get('/generic-error', () => {
		throw new Error('Something broke')
	})

	app.onError(errorHandler)

	it('returns the status from an error with a status property', async () => {
		const res = await app.request('/status-error')

		expect(res.status).toBe(403)

		const body = (await res.json()) as { error: string; message: string; statusCode: number }

		expect(body.statusCode).toBe(403)
		expect(body.message).toBe('Forbidden')
	})

	it('returns 500 for generic errors without a status', async () => {
		const res = await app.request('/generic-error')

		expect(res.status).toBe(500)

		const body = (await res.json()) as { error: string; message: string; statusCode: number }

		expect(body.statusCode).toBe(500)
		expect(body.error).toBe('Internal Server Error')
		expect(body.message).toBe('An unexpected error occurred')
	})
})

describe('notFoundHandler', () => {
	const app = new Hono()

	app.notFound(notFoundHandler)

	it('returns 404 with route details', async () => {
		const res = await app.request('/does-not-exist')

		expect(res.status).toBe(404)

		const body = (await res.json()) as { error: string; message: string; statusCode: number }

		expect(body.statusCode).toBe(404)
		expect(body.error).toBe('Not Found')
		expect(body.message).toContain('GET')
		expect(body.message).toContain('/does-not-exist')
	})

	it('includes correct method in not found message', async () => {
		const res = await app.request('/missing', { method: 'POST' })

		const body = (await res.json()) as { message: string }

		expect(body.message).toContain('POST')
	})
})
