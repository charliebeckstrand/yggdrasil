import { type NextRequest, NextResponse } from "next/server"

export interface MiddlewareConfig {
	/** Routes that don't require authentication (regex patterns). */
	publicPatterns?: RegExp[]
	/** Path to redirect unauthenticated users to. Defaults to "/auth/login". */
	loginPath?: string
}

const COOKIE_NAME = "sigil-session"

function createMiddleware(config: MiddlewareConfig = {}) {
	const { publicPatterns = [], loginPath = "/auth/login" } = config

	return function middleware(request: NextRequest): NextResponse {
		const { pathname } = request.nextUrl

		if (publicPatterns.some((p) => p.test(pathname))) {
			return NextResponse.next()
		}

		const session = request.cookies.get(COOKIE_NAME)

		if (!session?.value) {
			const url = request.nextUrl.clone()
			url.pathname = loginPath
			url.searchParams.set("callbackUrl", request.url)
			return NextResponse.redirect(url)
		}

		return NextResponse.next()
	}
}

export { createMiddleware }
