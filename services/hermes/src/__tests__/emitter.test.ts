import { createMessageId, getEmitter } from '@/lib/emitter'

describe('getEmitter', () => {
	it('returns an EventEmitter instance', () => {
		const emitter = getEmitter()

		expect(emitter).toBeDefined()
		expect(emitter.on).toBeTypeOf('function')
		expect(emitter.emit).toBeTypeOf('function')
	})

	it('returns the same emitter instance', () => {
		const emitter1 = getEmitter()
		const emitter2 = getEmitter()

		expect(emitter1).toBe(emitter2)
	})

	it('supports up to 100 listeners', () => {
		const emitter = getEmitter()

		expect(emitter.getMaxListeners()).toBe(100)
	})
})

describe('createMessageId', () => {
	it('returns a string starting with msg_', () => {
		const id = createMessageId()

		expect(id).toMatch(/^msg_/)
	})

	it('generates unique IDs', () => {
		const id1 = createMessageId()
		const id2 = createMessageId()

		expect(id1).not.toBe(id2)
	})

	it('includes a timestamp component', () => {
		const id = createMessageId()

		const parts = id.split('_')

		expect(parts.length).toBeGreaterThanOrEqual(3)

		const timestamp = Number(parts[1])

		expect(timestamp).toBeGreaterThan(0)
	})
})
