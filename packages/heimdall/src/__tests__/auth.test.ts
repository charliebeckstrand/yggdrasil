import { hash } from '@node-rs/argon2'
import { AuthError, authenticateUser, refreshTokenPair, registerUser } from '../auth.js'
import { configure } from '../config.js'
import { verifyToken } from '../jwt.js'
import type { CredentialsRow, UserRepository, UserRow } from '../types.js'

const secretKey = 'test-secret-key-that-is-at-least-32-characters-long'

const mockUser: UserRow = {
	id: 'user-123',
	email: 'alice@example.com',
	is_active: true,
	is_verified: false,
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-01T00:00:00Z',
}

let mockRepo: {
	insertUser: ReturnType<typeof vi.fn>
	getCredentialsByEmail: ReturnType<typeof vi.fn>
	getUserById: ReturnType<typeof vi.fn>
}

let onSecurityEvent: ReturnType<typeof vi.fn>

beforeEach(async () => {
	const hashedPassword = await hash('correct-password', { algorithm: 2 })

	mockRepo = {
		insertUser: vi.fn().mockResolvedValue(mockUser),
		getCredentialsByEmail: vi.fn().mockResolvedValue({
			id: 'user-123',
			hashed_password: hashedPassword,
			is_active: true,
		} satisfies CredentialsRow),
		getUserById: vi.fn().mockResolvedValue(mockUser),
	}

	onSecurityEvent = vi.fn()

	configure({
		userRepository: mockRepo as UserRepository,
		secretKey,
		onSecurityEvent,
	})
})

describe('authenticateUser', () => {
	it('returns a token pair for valid credentials', async () => {
		const result = await authenticateUser('alice@example.com', 'correct-password')

		expect(result.token_type).toBe('bearer')
		expect(result.access_token).toBeTypeOf('string')
		expect(result.refresh_token).toBeTypeOf('string')
	})

	it('normalizes email to lowercase and trimmed', async () => {
		await authenticateUser('  Alice@Example.COM  ', 'correct-password')

		expect(mockRepo.getCredentialsByEmail).toHaveBeenCalledWith('alice@example.com')
	})

	it('throws invalid_credentials for wrong password', async () => {
		await expect(authenticateUser('alice@example.com', 'wrong-password')).rejects.toThrow(AuthError)

		try {
			await authenticateUser('alice@example.com', 'wrong-password')
		} catch (err) {
			expect((err as AuthError).code).toBe('invalid_credentials')
		}
	})

	it('throws invalid_credentials for non-existent user', async () => {
		mockRepo.getCredentialsByEmail.mockResolvedValue(null)

		await expect(authenticateUser('nobody@example.com', 'any-password')).rejects.toThrow(AuthError)

		try {
			await authenticateUser('nobody@example.com', 'any-password')
		} catch (err) {
			expect((err as AuthError).code).toBe('invalid_credentials')
		}
	})

	it('throws account_inactive for inactive accounts', async () => {
		const hashedPassword = await hash('correct-password', { algorithm: 2 })

		mockRepo.getCredentialsByEmail.mockResolvedValue({
			id: 'user-123',
			hashed_password: hashedPassword,
			is_active: false,
		})

		try {
			await authenticateUser('alice@example.com', 'correct-password')

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('account_inactive')
		}
	})

	it('fires security event on failed login with IP', async () => {
		mockRepo.getCredentialsByEmail.mockResolvedValue(null)

		await authenticateUser('alice@example.com', 'wrong', '192.168.1.1').catch(() => {})

		expect(onSecurityEvent).toHaveBeenCalledWith({
			type: 'login_failed',
			ip: '192.168.1.1',
			details: { email: 'alice@example.com' },
		})
	})

	it('does not fire security event when no IP provided', async () => {
		mockRepo.getCredentialsByEmail.mockResolvedValue(null)

		await authenticateUser('alice@example.com', 'wrong').catch(() => {})

		expect(onSecurityEvent).not.toHaveBeenCalled()
	})

	it('signs access and refresh tokens with correct claims', async () => {
		const result = await authenticateUser('alice@example.com', 'correct-password')

		const accessPayload = await verifyToken(result.access_token)
		const refreshPayload = await verifyToken(result.refresh_token)

		expect(accessPayload.sub).toBe('user-123')
		expect(accessPayload.type).toBe('access')

		expect(refreshPayload.sub).toBe('user-123')
		expect(refreshPayload.type).toBe('refresh')
	})
})

describe('registerUser', () => {
	it('creates a user and returns the UserRow', async () => {
		const result = await registerUser('bob@example.com', 'password123')

		expect(result).toEqual(mockUser)
		expect(mockRepo.insertUser).toHaveBeenCalledOnce()
	})

	it('normalizes email before inserting', async () => {
		await registerUser('  Bob@EXAMPLE.COM  ', 'password123')

		expect(mockRepo.insertUser).toHaveBeenCalledWith(
			expect.any(String),
			'bob@example.com',
			expect.any(String),
		)
	})

	it('hashes the password with Argon2id', async () => {
		await registerUser('bob@example.com', 'password123')

		const hashedPassword = mockRepo.insertUser.mock.calls[0][2] as string

		expect(hashedPassword).toContain('$argon2')
	})

	it('fires security event on successful registration with IP', async () => {
		await registerUser('bob@example.com', 'password123', '10.0.0.1')

		expect(onSecurityEvent).toHaveBeenCalledWith({
			type: 'registration',
			ip: '10.0.0.1',
			details: { email: 'bob@example.com' },
		})
	})

	it('throws email_exists on duplicate email (PG 23505)', async () => {
		const pgError = new Error('duplicate key value') as Error & { code: string }

		pgError.code = '23505'

		mockRepo.insertUser.mockRejectedValue(pgError)

		try {
			await registerUser('alice@example.com', 'password123')

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('email_exists')
		}
	})

	it('re-throws non-duplicate errors', async () => {
		mockRepo.insertUser.mockRejectedValue(new Error('connection refused'))

		await expect(registerUser('bob@example.com', 'password123')).rejects.toThrow(
			'connection refused',
		)
	})
})

describe('refreshTokenPair', () => {
	it('returns new token pair for valid refresh token', async () => {
		const { signToken } = await import('../jwt.js')

		const refreshToken = await signToken('user-123', 'refresh')

		const result = await refreshTokenPair(refreshToken)

		expect(result.token_type).toBe('bearer')
		expect(result.access_token).toBeTypeOf('string')
		expect(result.refresh_token).toBeTypeOf('string')
	})

	it('throws invalid_token for an access token', async () => {
		const { signToken } = await import('../jwt.js')

		const accessToken = await signToken('user-123', 'access')

		try {
			await refreshTokenPair(accessToken)

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('invalid_token')
		}
	})

	it('throws invalid_token for garbage token', async () => {
		try {
			await refreshTokenPair('not.a.valid.token')

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('invalid_token')
		}
	})

	it('throws invalid_token when user not found', async () => {
		const { signToken } = await import('../jwt.js')

		const refreshToken = await signToken('deleted-user', 'refresh')

		mockRepo.getUserById.mockResolvedValue(null)

		try {
			await refreshTokenPair(refreshToken)

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('invalid_token')
		}
	})

	it('throws invalid_token when user is inactive', async () => {
		const { signToken } = await import('../jwt.js')

		const refreshToken = await signToken('user-123', 'refresh')

		mockRepo.getUserById.mockResolvedValue({ ...mockUser, is_active: false })

		try {
			await refreshTokenPair(refreshToken)

			expect.unreachable('Should have thrown')
		} catch (err) {
			expect(err).toBeInstanceOf(AuthError)
			expect((err as AuthError).code).toBe('invalid_token')
		}
	})
})
