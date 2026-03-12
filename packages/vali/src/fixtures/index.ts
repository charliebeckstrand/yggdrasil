import { vi } from 'vitest'

/**
 * Common environment variable presets for tests.
 * Call these in `beforeEach` or at the top of test files.
 */
export const envPresets = {
	/** Minimal database environment */
	database: () => {
		vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
	},

	/** Auth-related environment variables */
	auth: () => {
		vi.stubEnv('SECRET_KEY', 'test-secret-key-that-is-at-least-32-chars')
		vi.stubEnv('SESSION_SECRET', 'test-session-secret-at-least-32-chars!!')
	},

	/** Full bifrost service environment */
	bifrost: () => {
		envPresets.database()
		envPresets.auth()
	},
}

/**
 * Creates a temporary directory for test files and returns helpers.
 * Automatically cleans up after each test when used with `afterEach`.
 *
 * @example
 * ```ts
 * const tmp = await createTempDir('my-test-')
 *
 * await tmp.writeFile('migration.sql', 'CREATE TABLE t (id INT)')
 *
 * // ... run tests ...
 *
 * afterEach(async () => {
 *   await tmp.cleanup()
 * })
 * ```
 */
export async function createTempDir(prefix = 'vali-') {
	const { mkdtemp, rm, writeFile } = await import('node:fs/promises')
	const { tmpdir } = await import('node:os')
	const { join } = await import('node:path')

	const dir = await mkdtemp(join(tmpdir(), prefix))

	return {
		/** The absolute path to the temporary directory */
		path: dir,

		/** Write a file relative to the temp directory */
		writeFile: (name: string, content: string) => writeFile(join(dir, name), content),

		/** Remove the temporary directory and all its contents */
		cleanup: () => rm(dir, { recursive: true }),
	}
}

/**
 * Test data factory for creating realistic mock entities.
 * Each call generates unique IDs via an incrementing counter.
 */
let entityCounter = 0

export function resetEntityCounter() {
	entityCounter = 0
}

export const fixtures = {
	/** Create a mock user record */
	user: (overrides: Record<string, unknown> = {}) => {
		entityCounter++

		return {
			id: `user-${entityCounter}`,
			email: `user${entityCounter}@example.com`,
			is_active: true,
			is_verified: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...overrides,
		}
	},

	/** Create a mock auth token pair */
	tokenPair: (overrides: Record<string, unknown> = {}) => ({
		access_token: `at_test${++entityCounter}`,
		refresh_token: `rt_test${entityCounter}`,
		token_type: 'bearer' as const,
		...overrides,
	}),

	/** Create a mock security threat record */
	threat: (overrides: Record<string, unknown> = {}) => {
		entityCounter++

		return {
			id: `threat-${entityCounter}`,
			ip: `10.0.0.${entityCounter}`,
			reason: 'brute force',
			resolved: false,
			created_at: new Date().toISOString(),
			...overrides,
		}
	},
}
