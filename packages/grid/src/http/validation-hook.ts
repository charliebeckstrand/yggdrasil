import type { Hook } from '@hono/zod-openapi'
import type { Env } from 'hono'

/**
 * Formats Zod validation errors into a consistent, human-readable response
 * matching the standard ErrorSchema shape.
 */
export const validationHook: Hook<any, Env, any, any> = (result, c) => {
	if (result.success) return

	const messages = result.error.issues.map((issue: { path: PropertyKey[]; message: string }) => {
		const field = issue.path.map(String).join('.')
		return field ? `${field}: ${issue.message}` : issue.message
	})

	return c.json(
		{
			error: 'Validation Error',
			message: messages.join('; '),
			statusCode: 400,
		},
		400,
	)
}
