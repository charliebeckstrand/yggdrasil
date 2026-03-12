import { createLazyPool } from '../lazy-pool.js'

vi.mock('../pool.js', () => ({
	createPool: vi.fn(() => ({ end: vi.fn().mockResolvedValue(undefined) })),
	closePool: vi.fn().mockResolvedValue(undefined),
}))

describe('createLazyPool', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('does not create a pool on initialization', async () => {
		const { createPool } = await import('../pool.js')

		createLazyPool(() => 'postgres://localhost/test')

		expect(createPool).not.toHaveBeenCalled()
	})

	it('creates a pool on first getPool() call', async () => {
		const { createPool } = await import('../pool.js')

		const lazy = createLazyPool(() => 'postgres://localhost/test')

		lazy.getPool()

		expect(createPool).toHaveBeenCalledOnce()
		expect(createPool).toHaveBeenCalledWith('postgres://localhost/test', undefined)
	})

	it('returns the same pool on subsequent getPool() calls', async () => {
		const lazy = createLazyPool(() => 'postgres://localhost/test')

		const pool1 = lazy.getPool()
		const pool2 = lazy.getPool()

		expect(pool1).toBe(pool2)
	})

	it('closes the pool and resets state', async () => {
		const { closePool } = await import('../pool.js')

		const lazy = createLazyPool(() => 'postgres://localhost/test')

		lazy.getPool()

		await lazy.closePool()

		expect(closePool).toHaveBeenCalledOnce()
	})

	it('does nothing when closing without an active pool', async () => {
		const { closePool } = await import('../pool.js')

		const lazy = createLazyPool(() => 'postgres://localhost/test')

		await lazy.closePool()

		expect(closePool).not.toHaveBeenCalled()
	})

	it('creates a new pool after close and getPool', async () => {
		const { createPool } = await import('../pool.js')

		const lazy = createLazyPool(() => 'postgres://localhost/test')

		lazy.getPool()

		await lazy.closePool()

		lazy.getPool()

		expect(createPool).toHaveBeenCalledTimes(2)
	})
})
