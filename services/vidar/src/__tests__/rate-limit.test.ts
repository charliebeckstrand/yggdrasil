import { createTokenBucket } from '@/rate-limit'

describe('createTokenBucket', () => {
	it('allows requests within burst capacity', () => {
		const bucket = createTokenBucket({ rate: 5, burst: 3 })

		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(true)
	})

	it('rejects requests when tokens are exhausted', () => {
		const bucket = createTokenBucket({ rate: 5, burst: 2 })

		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(false)
	})

	it('tracks buckets per key independently', () => {
		const bucket = createTokenBucket({ rate: 5, burst: 1 })

		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-2')).toBe(true)

		expect(bucket.consume('ip-1')).toBe(false)
		expect(bucket.consume('ip-2')).toBe(false)
	})

	it('refills tokens over time', async () => {
		const bucket = createTokenBucket({ rate: 1000, burst: 1 })

		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(false)

		await new Promise((r) => setTimeout(r, 10))

		expect(bucket.consume('ip-1')).toBe(true)
	})

	it('caps tokens at burst capacity', async () => {
		const bucket = createTokenBucket({ rate: 1000, burst: 2 })

		// Wait for refill
		await new Promise((r) => setTimeout(r, 50))

		// Should still be capped at burst (2)
		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(true)
		expect(bucket.consume('ip-1')).toBe(false)
	})

	it('uses default rate and burst when no config provided', () => {
		const bucket = createTokenBucket()

		// Default burst is 10
		for (let i = 0; i < 10; i++) {
			expect(bucket.consume('ip-1')).toBe(true)
		}

		expect(bucket.consume('ip-1')).toBe(false)
	})
})
