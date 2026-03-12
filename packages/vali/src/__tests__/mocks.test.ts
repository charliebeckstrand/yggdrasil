import {
	createMockClient,
	createMockPool,
	createPassthroughMiddleware,
	mockResults,
} from '../mocks/index.js'

describe('createMockPool', () => {
	it('creates a pool with default empty result', async () => {
		const pool = createMockPool()

		const result = await pool.query('SELECT 1')

		expect(result.rows).toEqual([])
	})

	it('creates a pool with custom query result', async () => {
		const pool = createMockPool({ rows: [{ id: 1 }], rowCount: 1 })

		const result = await pool.query('SELECT * FROM users')

		expect(result.rows).toEqual([{ id: 1 }])
		expect(result.rowCount).toBe(1)
	})

	it('has a connect method', () => {
		const pool = createMockPool()

		expect(pool.connect).toBeDefined()
		expect(vi.isMockFunction(pool.connect)).toBe(true)
	})
})

describe('createMockClient', () => {
	it('creates a client with default empty result', async () => {
		const client = createMockClient()

		const result = await client.query('SELECT 1')

		expect(result.rows).toEqual([])
	})

	it('has a release method', () => {
		const client = createMockClient()

		expect(client.release).toBeDefined()
		expect(vi.isMockFunction(client.release)).toBe(true)
	})
})

describe('mockResults', () => {
	it('creates empty result', () => {
		expect(mockResults.empty).toEqual({ rows: [], rowCount: 0 })
	})

	it('creates single row result', () => {
		const result = mockResults.single({ id: 1, name: 'Alice' })

		expect(result.rows).toHaveLength(1)
		expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' })
		expect(result.rowCount).toBe(1)
	})

	it('creates many rows result', () => {
		const rows = [{ id: 1 }, { id: 2 }, { id: 3 }]

		const result = mockResults.many(rows)

		expect(result.rows).toHaveLength(3)
		expect(result.rowCount).toBe(3)
	})

	it('creates affected rows result', () => {
		const result = mockResults.affected(5)

		expect(result.rows).toEqual([])
		expect(result.rowCount).toBe(5)
	})
})

describe('createPassthroughMiddleware', () => {
	it('calls next()', async () => {
		const middleware = createPassthroughMiddleware()

		const next = vi.fn().mockResolvedValue(undefined)

		await middleware({}, next)

		expect(next).toHaveBeenCalledOnce()
	})
})
