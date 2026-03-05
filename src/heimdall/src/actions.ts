import "server-only"
import { redirect } from "next/navigation"
import { createSessionHelpers, type Session, type SessionConfig } from "./session"

export interface LoginInput {
	email: string
	password: string
}

export interface LoginResult {
	error?: string
}

function createActions(config: SessionConfig) {
	const { set, clear, getSession } = createSessionHelpers(config)

	async function login(input: LoginInput): Promise<LoginResult> {
		const res = await fetch(`${config.apiOrigin}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		})

		if (!res.ok) {
			const body = await res.json().catch(() => null)
			return { error: body?.message ?? "Invalid email or password" }
		}

		const data = (await res.json()) as {
			access_token: string
			refresh_token: string
			expires_in: number
		}

		const session: Session = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Date.now() + data.expires_in * 1000,
		}

		await set(session)
		return {}
	}

	async function logout(): Promise<never> {
		await clear()
		redirect("/auth/login")
	}

	return { login, logout, getSession }
}

export { createActions }
