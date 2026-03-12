import { installMatchers } from '../matchers/index.js'

installMatchers()

describe('toHaveStatus', () => {
	it('passes when status matches', () => {
		const res = new Response('OK', { status: 200 })

		expect(res).toHaveStatus(200)
	})

	it('fails when status does not match', () => {
		const res = new Response('Not Found', { status: 404 })

		expect(res).not.toHaveStatus(200)
	})
})

describe('toRespondWith', () => {
	it('passes when body contains expected subset', async () => {
		const body = JSON.stringify({ status: 'healthy', version: '1.0.0' })

		const res = new Response(body, {
			headers: { 'Content-Type': 'application/json' },
		})

		await expect(res).toRespondWith({ status: 'healthy' })
	})

	it('fails when body does not contain expected subset', async () => {
		const body = JSON.stringify({ status: 'unhealthy' })

		const res = new Response(body, {
			headers: { 'Content-Type': 'application/json' },
		})

		await expect(res).not.toRespondWith({ status: 'healthy' })
	})
})

describe('toMatchSQL', () => {
	it('passes when normalized SQL matches', () => {
		const fragment = { text: '  SELECT *  FROM  users  WHERE id = $1  ' }

		expect(fragment).toMatchSQL('SELECT * FROM users WHERE id = $1')
	})

	it('fails when SQL does not match', () => {
		const fragment = { text: 'SELECT * FROM users' }

		expect(fragment).not.toMatchSQL('SELECT * FROM posts')
	})
})

describe('toMatchSchema', () => {
	it('passes when value matches schema', async () => {
		const { z } = await import('zod')

		const schema = z.object({ name: z.string(), age: z.number() })

		expect({ name: 'Alice', age: 30 }).toMatchSchema(schema)
	})

	it('fails when value does not match schema', async () => {
		const { z } = await import('zod')

		const schema = z.object({ name: z.string() })

		expect({ name: 123 }).not.toMatchSchema(schema)
	})
})
