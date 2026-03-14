import type { Context } from 'hono'
import { registerUser } from '../auth/index.js'

export async function handleRegisterUser(c: Context, email: string, password: string, ip: string) {
	const user = await registerUser(email, password, ip)

	return c.json({ id: user.id, email: user.email }, 201)
}
