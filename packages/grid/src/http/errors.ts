import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class HttpError extends Error {
	public readonly status: ContentfulStatusCode

	constructor(status: ContentfulStatusCode, message: string, name?: string) {
		super(message)
		this.status = status
		this.name = name ?? 'HttpError'
	}
}
