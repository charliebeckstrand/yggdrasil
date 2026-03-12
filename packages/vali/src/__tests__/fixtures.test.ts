import { createTempDir, envPresets, fixtures, resetEntityCounter } from '../fixtures/index.js'

describe('envPresets', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it('stubs database environment', () => {
		envPresets.database()

		expect(process.env.DATABASE_URL).toBe('postgres://test:test@localhost:5432/test')
	})

	it('stubs auth environment', () => {
		envPresets.auth()

		expect(process.env.SECRET_KEY).toBe('test-secret-key-that-is-at-least-32-chars')
		expect(process.env.SESSION_SECRET).toBe('test-session-secret-at-least-32-chars!!')
	})

	it('stubs full bifrost environment', () => {
		envPresets.bifrost()

		expect(process.env.DATABASE_URL).toBeDefined()
		expect(process.env.SECRET_KEY).toBeDefined()
		expect(process.env.SESSION_SECRET).toBeDefined()
	})
})

describe('createTempDir', () => {
	it('creates and cleans up a temporary directory', async () => {
		const tmp = await createTempDir('vali-test-')

		expect(tmp.path).toContain('vali-test-')

		await tmp.writeFile('test.txt', 'hello')

		const { readFile } = await import('node:fs/promises')
		const { join } = await import('node:path')

		const content = await readFile(join(tmp.path, 'test.txt'), 'utf-8')

		expect(content).toBe('hello')

		await tmp.cleanup()

		const { access } = await import('node:fs/promises')

		await expect(access(tmp.path)).rejects.toThrow()
	})
})

describe('fixtures', () => {
	beforeEach(() => {
		resetEntityCounter()
	})

	describe('user', () => {
		it('creates a user with unique id and email', () => {
			const user = fixtures.user()

			expect(user.id).toBe('user-1')
			expect(user.email).toBe('user1@example.com')
			expect(user.is_active).toBe(true)
		})

		it('increments counter across calls', () => {
			const user1 = fixtures.user()
			const user2 = fixtures.user()

			expect(user1.id).toBe('user-1')
			expect(user2.id).toBe('user-2')
		})

		it('accepts overrides', () => {
			const user = fixtures.user({ email: 'custom@test.com', is_active: false })

			expect(user.email).toBe('custom@test.com')
			expect(user.is_active).toBe(false)
		})
	})

	describe('tokenPair', () => {
		it('creates a token pair', () => {
			const tokens = fixtures.tokenPair()

			expect(tokens.access_token).toMatch(/^at_test/)
			expect(tokens.refresh_token).toMatch(/^rt_test/)
			expect(tokens.token_type).toBe('bearer')
		})
	})

	describe('threat', () => {
		it('creates a threat record', () => {
			const threat = fixtures.threat()

			expect(threat.id).toBe('threat-1')
			expect(threat.ip).toBe('10.0.0.1')
			expect(threat.resolved).toBe(false)
		})

		it('accepts overrides', () => {
			const threat = fixtures.threat({ resolved: true, reason: 'port scan' })

			expect(threat.resolved).toBe(true)
			expect(threat.reason).toBe('port scan')
		})
	})
})
