import { sql } from 'mimir'
import { createDatabase } from './db.js'

export interface UserRow {
	id: string
	email: string
	is_active: boolean
	is_verified: boolean
	created_at: string
	updated_at: string
}

export interface CredentialsRow {
	id: string
	hashed_password: string
	is_active: boolean
}

export async function insertUser(
	id: string,
	email: string,
	hashedPassword: string,
): Promise<UserRow> {
	const db = createDatabase()

	return db.get<UserRow>(
		sql`
			INSERT INTO users (id, email, hashed_password)
			VALUES (${id}, ${email}, ${hashedPassword})
			RETURNING id, email, is_active, is_verified, created_at, updated_at
		`,
	)
}

export async function getCredentialsByEmail(email: string): Promise<CredentialsRow | null> {
	const db = createDatabase()

	return db.query<CredentialsRow>(
		sql`
			SELECT id, hashed_password, is_active
			FROM users
			WHERE email = ${email}
		`,
	)
}

export async function getUserById(id: string): Promise<UserRow | null> {
	const db = createDatabase()

	return db.query<UserRow>(
		sql`
			SELECT id, email, is_active, is_verified, created_at, updated_at
			FROM users
			WHERE id = ${id}
		`,
	)
}
