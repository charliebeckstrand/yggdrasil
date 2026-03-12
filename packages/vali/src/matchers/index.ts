import { expect } from 'vitest'
import type { ZodType } from 'zod'

/**
 * Custom Vitest matchers for common assertion patterns.
 *
 * Install via `vali/setup` in your vitest config's `setupFiles`,
 * or call `installMatchers()` manually.
 */
export function installMatchers() {
	expect.extend({
		/**
		 * Assert that a Hono/fetch Response has a specific status code.
		 *
		 * @example
		 * ```ts
		 * const res = await app.request('/api/health')
		 * expect(res).toHaveStatus(200)
		 * ```
		 */
		toHaveStatus(received: Response, expected: number) {
			const pass = received.status === expected

			return {
				pass,
				message: () =>
					pass
						? `expected response not to have status ${expected}`
						: `expected response to have status ${expected}, but got ${received.status}`,
			}
		},

		/**
		 * Assert that a response body (parsed JSON) contains the specified subset.
		 *
		 * @example
		 * ```ts
		 * const res = await app.request('/api/health')
		 * await expect(res).toRespondWith({ status: 'healthy' })
		 * ```
		 */
		async toRespondWith(received: Response, expected: Record<string, unknown>) {
			const body = await received.clone().json()

			const pass = this.equals(body, expect.objectContaining(expected))

			return {
				pass,
				message: () =>
					pass
						? `expected response body not to contain ${JSON.stringify(expected)}`
						: `expected response body to contain ${JSON.stringify(expected)}, but got ${JSON.stringify(body)}`,
			}
		},

		/**
		 * Assert that a value passes Zod schema validation.
		 *
		 * @example
		 * ```ts
		 * expect({ email: 'test@example.com' }).toMatchSchema(userSchema)
		 * ```
		 */
		toMatchSchema(received: unknown, schema: ZodType) {
			const result = schema.safeParse(received)

			return {
				pass: result.success,
				message: () =>
					result.success
						? 'expected value not to match schema'
						: `expected value to match schema, but got errors: ${JSON.stringify(
								(result as { error: { issues: unknown[] } }).error.issues,
								null,
								2,
							)}`,
			}
		},

		/**
		 * Assert that a SQL fragment's text matches the expected string.
		 *
		 * @example
		 * ```ts
		 * expect(sql`SELECT * FROM users WHERE id = ${1}`).toMatchSQL('SELECT * FROM users WHERE id = $1')
		 * ```
		 */
		toMatchSQL(received: { text: string }, expected: string) {
			const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

			const pass = normalize(received.text) === normalize(expected)

			return {
				pass,
				message: () =>
					pass
						? `expected SQL not to match "${expected}"`
						: `expected SQL to match "${expected}", but got "${received.text}"`,
			}
		},
	})
}

/**
 * Type augmentation for custom matchers.
 * This is automatically applied when importing `vali/matchers` or `vali/setup`.
 */
declare module 'vitest' {
	interface Assertion<T> {
		toHaveStatus(status: number): void
		toRespondWith(body: Record<string, unknown>): Promise<void>
		toMatchSchema(schema: ZodType): void
		toMatchSQL(expected: string): void
	}

	interface AsymmetricMatchersContaining {
		toHaveStatus(status: number): void
		toRespondWith(body: Record<string, unknown>): Promise<void>
		toMatchSchema(schema: ZodType): void
		toMatchSQL(expected: string): void
	}
}
