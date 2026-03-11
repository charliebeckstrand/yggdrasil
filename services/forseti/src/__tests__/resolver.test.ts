import { registerProvider, resetRegistry } from '../services/registry.js'
import { getLog, resetLog, resolve } from '../services/resolver.js'

const mockSpec = {
	openapi: '3.0.0',
	info: { title: 'Test', version: '1.0.0' },
	paths: {
		'/vidar/check-ip': {
			get: {
				operationId: 'check-ip',
				summary: 'Check IP',
				parameters: [{ name: 'ip', in: 'query', required: true }],
			},
		},
		'/vidar/events': {
			post: {
				operationId: 'ingest-event',
				summary: 'Ingest event',
				requestBody: { content: { 'application/json': {} } },
			},
		},
	},
}

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

describe('resolver', () => {
	beforeEach(async () => {
		resetRegistry()
		resetLog()

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockSpec),
		})

		await registerProvider(
			'vidar',
			'http://localhost:3003',
			'http://localhost:3003/vidar/openapi.json',
		)
	})

	it('should resolve a GET operation with query parameters', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: () => Promise.resolve({ banned: false }),
		})

		const result = await resolve('vidar.check-ip', { ip: '192.168.1.1' })

		expect(result.resolved).toBe(true)
		expect(result.provider).toBe('vidar')
		expect(result.data).toEqual({ banned: false })
		expect(result.duration).toBeTypeOf('number')

		// Verify fetch was called with correct URL
		const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]

		expect(lastCall[0]).toBe('http://localhost:3003/vidar/check-ip?ip=192.168.1.1')
		expect(lastCall[1].method).toBe('GET')
	})

	it('should resolve a POST operation with JSON body', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: () => Promise.resolve({ id: 'evt_123' }),
		})

		const result = await resolve('vidar.ingest-event', {
			ip: '10.0.0.1',
			event_type: 'login_failed',
		})

		expect(result.resolved).toBe(true)

		const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]

		expect(lastCall[0]).toBe('http://localhost:3003/vidar/events')
		expect(lastCall[1].method).toBe('POST')
		expect(JSON.parse(lastCall[1].body)).toEqual({ ip: '10.0.0.1', event_type: 'login_failed' })
	})

	it('should return error for unknown operations', async () => {
		const result = await resolve('unknown.operation', {})

		expect(result.resolved).toBe(false)
		expect(result.error).toContain('No operation registered')
	})

	it('should handle provider errors gracefully', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: () => Promise.resolve('Internal Server Error'),
		})

		const result = await resolve('vidar.check-ip', { ip: '1.2.3.4' })

		expect(result.resolved).toBe(false)
		expect(result.provider).toBe('vidar')
		expect(result.error).toContain('500')
	})

	it('should handle network failures gracefully', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

		const result = await resolve('vidar.check-ip', { ip: '1.2.3.4' })

		expect(result.resolved).toBe(false)
		expect(result.error).toContain('Connection refused')
	})

	it('should log all resolutions', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: () => Promise.resolve({ banned: false }),
		})

		await resolve('vidar.check-ip', { ip: '1.2.3.4' })
		await resolve('unknown.op', {})

		const log = getLog()

		expect(log).toHaveLength(2)
		expect(log[0].resolved).toBe(false) // most recent first
		expect(log[1].resolved).toBe(true)
	})
})
