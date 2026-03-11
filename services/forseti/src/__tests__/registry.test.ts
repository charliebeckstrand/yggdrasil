import {
	getOperationIndex,
	getProviders,
	lookupOperation,
	registerProvider,
	resetRegistry,
	unregisterProvider,
	updateHeartbeat,
} from '../services/registry.js'

// Mock fetch for OpenAPI spec fetching
const mockSpec = {
	openapi: '3.0.0',
	info: { title: 'Test', version: '1.0.0' },
	paths: {
		'/vidar/check-ip': {
			get: {
				operationId: 'check-ip',
				summary: 'Check if an IP is banned',
				parameters: [{ name: 'ip', in: 'query', required: true }],
			},
		},
		'/vidar/events': {
			post: {
				operationId: 'ingest-event',
				summary: 'Ingest a security event',
				requestBody: { content: { 'application/json': {} } },
			},
		},
		'/vidar/bans': {
			get: {
				operationId: 'list-bans',
				summary: 'List active bans',
			},
			post: {
				operationId: 'create-ban',
				summary: 'Create a ban',
				requestBody: { content: { 'application/json': {} } },
			},
		},
	},
}

vi.stubGlobal(
	'fetch',
	vi.fn().mockResolvedValue({
		ok: true,
		json: () => Promise.resolve(mockSpec),
	}),
)

describe('registry', () => {
	beforeEach(() => {
		resetRegistry()
	})

	describe('registerProvider', () => {
		it('should fetch the OpenAPI spec and register operations', async () => {
			const count = await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)

			expect(count).toBe(4)

			const providers = getProviders()

			expect(providers).toHaveLength(1)
			expect(providers[0].service).toBe('vidar')
			expect(providers[0].operations).toHaveLength(4)
		})

		it('should index operations as service.operationId', async () => {
			await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)

			const index = getOperationIndex()

			expect(index['vidar.check-ip']).toBeDefined()
			expect(index['vidar.check-ip'].method).toBe('GET')
			expect(index['vidar.check-ip'].path).toBe('/vidar/check-ip')

			expect(index['vidar.ingest-event']).toBeDefined()
			expect(index['vidar.ingest-event'].method).toBe('POST')
		})

		it('should re-register cleanly on duplicate registration', async () => {
			await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)
			await registerProvider(
				'vidar',
				'http://localhost:3004',
				'http://localhost:3004/vidar/openapi.json',
			)

			const providers = getProviders()

			expect(providers).toHaveLength(1)
			expect(providers[0].url).toBe('http://localhost:3004')
		})
	})

	describe('lookupOperation', () => {
		it('should find a registered operation', async () => {
			await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)

			const result = lookupOperation('vidar.check-ip')

			expect(result).not.toBeNull()
			expect(result!.provider.service).toBe('vidar')
			expect(result!.operation.operationId).toBe('check-ip')
			expect(result!.operation.method).toBe('GET')
		})

		it('should return null for unknown operations', () => {
			const result = lookupOperation('unknown.operation')

			expect(result).toBeNull()
		})
	})

	describe('unregisterProvider', () => {
		it('should remove a provider and its operations', async () => {
			await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)

			const removed = unregisterProvider('vidar')

			expect(removed).toBe(true)
			expect(getProviders()).toHaveLength(0)
			expect(lookupOperation('vidar.check-ip')).toBeNull()
		})

		it('should return false for unknown providers', () => {
			expect(unregisterProvider('unknown')).toBe(false)
		})
	})

	describe('updateHeartbeat', () => {
		it('should update lastSeen for a registered provider', async () => {
			await registerProvider(
				'vidar',
				'http://localhost:3003',
				'http://localhost:3003/vidar/openapi.json',
			)

			const before = getProviders()[0].lastSeen

			// Small delay to ensure timestamp differs
			await new Promise((r) => setTimeout(r, 10))

			const updated = updateHeartbeat('vidar')

			expect(updated).toBe(true)
			expect(getProviders()[0].lastSeen).not.toBe(before)
		})

		it('should return false for unknown providers', () => {
			expect(updateHeartbeat('unknown')).toBe(false)
		})
	})
})
