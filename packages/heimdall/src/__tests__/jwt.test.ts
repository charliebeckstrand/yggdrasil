import { configure } from '../config.js'
import { signToken, verifyToken } from '../jwt.js'
import type { UserRepository } from '../types.js'

const mockRepo: UserRepository = {
	insertUser: vi.fn(),
	getCredentialsByEmail: vi.fn(),
	getUserById: vi.fn(),
}

const secretKey = 'test-secret-key-that-is-at-least-32-characters-long'

beforeAll(() => {
	configure({ userRepository: mockRepo, secretKey })
})

describe('signToken', () => {
	it('produces a valid JWT string for access tokens', async () => {
		const token = await signToken('user-123', 'access')

		expect(token).toBeTypeOf('string')
		expect(token.split('.')).toHaveLength(3)
	})

	it('produces a valid JWT string for refresh tokens', async () => {
		const token = await signToken('user-123', 'refresh')

		expect(token).toBeTypeOf('string')
		expect(token.split('.')).toHaveLength(3)
	})

	it('includes correct claims in the payload', async () => {
		const token = await signToken('user-456', 'access')

		const payload = await verifyToken(token)

		expect(payload.sub).toBe('user-456')
		expect(payload.type).toBe('access')
		expect(payload.iss).toBe('heimdall')
		expect(payload.iat).toBeTypeOf('number')
		expect(payload.exp).toBeTypeOf('number')
		expect(payload.jti).toBeTypeOf('string')
	})

	it('sets access token expiry to 30 minutes', async () => {
		const token = await signToken('user-123', 'access')

		const payload = await verifyToken(token)

		const thirtyMinutes = 30 * 60

		const expiry = (payload.exp ?? 0) - (payload.iat ?? 0)

		expect(expiry).toBe(thirtyMinutes)
	})

	it('sets refresh token expiry to 7 days', async () => {
		const token = await signToken('user-123', 'refresh')

		const payload = await verifyToken(token)

		const sevenDays = 7 * 24 * 60 * 60

		const expiry = (payload.exp ?? 0) - (payload.iat ?? 0)

		expect(expiry).toBe(sevenDays)
	})

	it('generates unique jti for each token', async () => {
		const token1 = await signToken('user-123', 'access')
		const token2 = await signToken('user-123', 'access')

		const payload1 = await verifyToken(token1)
		const payload2 = await verifyToken(token2)

		expect(payload1.jti).not.toBe(payload2.jti)
	})
})

describe('verifyToken', () => {
	it('verifies a valid token', async () => {
		const token = await signToken('user-789', 'refresh')

		const payload = await verifyToken(token)

		expect(payload.sub).toBe('user-789')
		expect(payload.type).toBe('refresh')
	})

	it('rejects a tampered token', async () => {
		const token = await signToken('user-123', 'access')

		const tampered = `${token}x`

		await expect(verifyToken(tampered)).rejects.toThrow()
	})

	it('rejects a token signed with a different key', async () => {
		const { sign } = await import('hono/jwt')

		const badToken = await sign(
			{ sub: 'user-123', iss: 'heimdall', type: 'access' },
			'wrong-key-that-is-at-least-32-characters-long',
			'HS256',
		)

		await expect(verifyToken(badToken)).rejects.toThrow()
	})

	it('rejects a token with wrong issuer', async () => {
		const { sign } = await import('hono/jwt')

		const badToken = await sign(
			{ sub: 'user-123', iss: 'not-heimdall', type: 'access' },
			secretKey,
			'HS256',
		)

		await expect(verifyToken(badToken)).rejects.toThrow('Invalid token issuer')
	})
})
