import "server-only"
import { cookies } from "next/headers"

const COOKIE_NAME = "sigil-session"
const REFRESH_BUFFER_MS = 30_000

export interface Session {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

export interface SessionConfig {
	/** Sigil backend base URL (e.g. "https://auth.example.com") */
	apiOrigin: string
	/** Cookie max-age in seconds. Defaults to 7 days. */
	maxAge?: number
}

let refreshPromise: Promise<Session | null> | null = null

function createSessionHelpers(config: SessionConfig) {
	const maxAge = config.maxAge ?? 60 * 60 * 24 * 7

	async function set(session: Session): Promise<void> {
		const store = await cookies()
		store.set(COOKIE_NAME, JSON.stringify(session), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge,
		})
	}

	async function clear(): Promise<void> {
		const store = await cookies()
		store.delete(COOKIE_NAME)
	}

	async function get(): Promise<Session | null> {
		const store = await cookies()
		const raw = store.get(COOKIE_NAME)?.value
		if (!raw) return null

		try {
			return JSON.parse(raw) as Session
		} catch {
			return null
		}
	}

	async function refresh(session: Session): Promise<Session | null> {
		if (refreshPromise) return refreshPromise

		refreshPromise = (async () => {
			try {
				const res = await fetch(`${config.apiOrigin}/auth/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refresh_token: session.refreshToken }),
				})

				if (!res.ok) {
					await clear()
					return null
				}

				const data = (await res.json()) as {
					access_token: string
					refresh_token: string
					expires_in: number
				}

				const refreshed: Session = {
					accessToken: data.access_token,
					refreshToken: data.refresh_token,
					expiresAt: Date.now() + data.expires_in * 1000,
				}

				await set(refreshed)
				return refreshed
			} catch {
				await clear()
				return null
			} finally {
				refreshPromise = null
			}
		})()

		return refreshPromise
	}

	async function getSession(): Promise<Session | null> {
		const session = await get()
		if (!session) return null

		if (Date.now() >= session.expiresAt - REFRESH_BUFFER_MS) {
			return refresh(session)
		}

		return session
	}

	return { set, clear, get, getSession }
}

export { createSessionHelpers }
