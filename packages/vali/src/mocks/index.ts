import type { Mock } from 'vitest'
import { vi } from 'vitest'

type MockPool = {
	query: Mock
	connect: Mock
}

type MockClient = {
	query: Mock
	release: Mock
}

/**
 * Query result shape returned by PostgreSQL pool/client.
 */
export type QueryResult<T = unknown> = {
	rows: T[]
	rowCount?: number
}

/**
 * Creates a mock PostgreSQL pool compatible with saga's `createDatabaseClient`.
 *
 * @example
 * ```ts
 * const pool = createMockPool({ rows: [{ id: 1, name: 'Alice' }] })
 * const db = createDatabaseClient(pool)
 * ```
 */
export function createMockPool(queryResult: QueryResult = { rows: [] }): MockPool {
	return {
		query: vi.fn().mockResolvedValue(queryResult),
		connect: vi.fn(),
	}
}

/**
 * Creates a mock PostgreSQL client with `query` and `release` methods.
 * Useful for testing transaction flows.
 *
 * @example
 * ```ts
 * const client = createMockClient({ rows: [{ id: 1 }] })
 * ;(pool.connect as Mock).mockResolvedValue(client)
 * ```
 */
export function createMockClient(queryResult: QueryResult = { rows: [] }): MockClient {
	return {
		query: vi.fn().mockResolvedValue(queryResult),
		release: vi.fn(),
	}
}

/**
 * Mock pool/client result presets for common scenarios.
 */
export const mockResults = {
	/** Empty result set */
	empty: { rows: [], rowCount: 0 } satisfies QueryResult,

	/** Single row result */
	single: <T extends Record<string, unknown>>(row: T): QueryResult<T> => ({
		rows: [row],
		rowCount: 1,
	}),

	/** Multiple row result */
	many: <T extends Record<string, unknown>>(rows: T[]): QueryResult<T> => ({
		rows,
		rowCount: rows.length,
	}),

	/** Affected rows only (for UPDATE/DELETE) */
	affected: (count: number): QueryResult => ({
		rows: [],
		rowCount: count,
	}),
}

/**
 * Creates a mock Hono middleware that simply calls `next()`.
 * Useful for stubbing out middleware like vidar or auth in tests.
 *
 * @example
 * ```ts
 * vi.mock('vidar/client', () => ({
 *   createVidar: vi.fn().mockReturnValue(createPassthroughMiddleware()),
 * }))
 * ```
 */
export function createPassthroughMiddleware() {
	return async (_c: unknown, next: () => Promise<void>) => {
		await next()
	}
}
