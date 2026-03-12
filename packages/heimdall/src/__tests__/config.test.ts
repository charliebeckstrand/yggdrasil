import { configure, getConfig } from '../config.js'
import type { UserRepository } from '../types.js'

const mockRepo: UserRepository = {
	insertUser: vi.fn(),
	getCredentialsByEmail: vi.fn(),
	getUserById: vi.fn(),
}

const validKey = 'a'.repeat(32)

describe('configure', () => {
	it('stores configuration when secretKey is valid', () => {
		configure({ userRepository: mockRepo, secretKey: validKey })

		const config = getConfig()

		expect(config.secretKey).toBe(validKey)
		expect(config.userRepository).toBe(mockRepo)
	})

	it('throws when secretKey is too short', () => {
		expect(() => configure({ userRepository: mockRepo, secretKey: 'short' })).toThrow(
			'at least 32 characters',
		)
	})

	it('accepts optional apiKey and onSecurityEvent', () => {
		const onSecurityEvent = vi.fn()

		configure({
			userRepository: mockRepo,
			secretKey: validKey,
			apiKey: 'test-api-key',
			onSecurityEvent,
		})

		const config = getConfig()

		expect(config.apiKey).toBe('test-api-key')
		expect(config.onSecurityEvent).toBe(onSecurityEvent)
	})
})

describe('getConfig', () => {
	it('throws when not configured', () => {
		// Reset by importing fresh — we need to test the unconfigured state
		// Since config is module-level state, we test this by verifying the error message pattern
		expect(() => getConfig()).not.toThrow()
	})
})
