import { AuthError, registerUser } from 'heimdall'
import type { Context } from 'hono'

export async function handleRegisterUser(c: Context, email: string, password: string, ip: string) {
	try {
		const user = await registerUser(email, password, ip)

		return c.json({ id: user.id, email: user.email }, 201)
	} catch (err) {
		if (err instanceof AuthError && err.code === 'email_exists') {
			return c.json({ error: 'Conflict', message: err.message, statusCode: 409 }, 409)
		}

		throw err
	}
}
