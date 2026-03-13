import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import { Hono } from 'hono'
import type { ViteDevServer } from 'vite'

import type { SSRData } from './src/lib/types.js'

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 3000)
const bifrostUrl = process.env.BIFROST_URL || 'http://localhost:4000'

const errorMessages: Record<string, string> = {
	invalid_credentials: 'Invalid email or password.',
	email_exists: 'An account with that email already exists.',
	registration_failed: 'Registration failed. Please try again.',
	password_mismatch: 'Passwords do not match.',
}

type RenderFn = (url: string, ssrData?: SSRData) => string | Promise<string>

async function createDemoServer() {
	const app = new Hono()

	let vite: ViteDevServer | undefined
	let template: string
	let ssrRender: RenderFn

	if (isProduction) {
		const distClient = resolve(import.meta.dirname, 'dist/client')
		const { serveStatic } = await import('@hono/node-server/serve-static')

		app.use('/*', serveStatic({ root: distClient }))

		template = readFileSync(resolve(distClient, 'index.html'), 'utf-8')

		// @ts-expect-error -- dist/server is generated at build time
		const serverModule = (await import('./dist/server/entry-server.js')) as { render: RenderFn }

		ssrRender = serverModule.render
	} else {
		const { createServer: createViteServer } = await import('vite')

		vite = await createViteServer({
			server: { middlewareMode: true },
			appType: 'custom',
		})

		template = readFileSync(resolve(import.meta.dirname, 'index.html'), 'utf-8')

		ssrRender = async (url: string, ssrData?: SSRData) => {
			const mod = (await vite?.ssrLoadModule('./src/entry-server.tsx')) as { render: RenderFn }

			return mod.render(url, ssrData)
		}
	}

	app.post('/login', async (c) => {
		const body = await c.req.parseBody()

		try {
			const res = await fetch(`${bifrostUrl}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: body.email,
					password: body.password,
				}),
			})

			if (res.ok) {
				const cookies = res.headers.getSetCookie()

				for (const cookie of cookies) {
					c.header('Set-Cookie', cookie)
				}

				return c.redirect('/')
			}

			const data = (await res.json().catch(() => ({}))) as { message?: string }

			return renderPage(c, '/login', template, ssrRender, vite, {
				error: data.message || errorMessages.invalid_credentials,
			})
		} catch {
			return renderPage(c, '/login', template, ssrRender, vite, {
				error: errorMessages.registration_failed,
			})
		}
	})

	app.post('/register', async (c) => {
		const body = await c.req.parseBody()

		if (body.password !== body.confirmPassword) {
			return renderPage(c, '/register', template, ssrRender, vite, {
				error: errorMessages.password_mismatch,
			})
		}

		try {
			const res = await fetch(`${bifrostUrl}/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: body.name,
					email: body.email,
					password: body.password,
				}),
			})

			if (res.ok) {
				return c.redirect('/login?registered=true')
			}

			const data = (await res.json().catch(() => ({}))) as { code?: string }

			return renderPage(c, '/register', template, ssrRender, vite, {
				error:
					data.code === 'email_exists'
						? errorMessages.email_exists
						: errorMessages.registration_failed,
			})
		} catch {
			return renderPage(c, '/register', template, ssrRender, vite, {
				error: errorMessages.registration_failed,
			})
		}
	})

	app.all('/auth/*', async (c) => {
		const res = await fetch(`${bifrostUrl}${c.req.path}`, {
			method: c.req.method,
			headers: c.req.raw.headers,
			body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
			duplex: 'half',
		} as RequestInit)

		return new Response(res.body, {
			status: res.status,
			headers: res.headers,
		})
	})

	app.all('/api/*', async (c) => {
		const res = await fetch(`${bifrostUrl}${c.req.path}`, {
			method: c.req.method,
			headers: c.req.raw.headers,
			body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
			duplex: 'half',
		} as RequestInit)

		return new Response(res.body, {
			status: res.status,
			headers: res.headers,
		})
	})

	app.get('/*', async (c) => {
		const url = new URL(c.req.url)
		const path = url.pathname + url.search

		const ssrData: SSRData = {}

		if (url.searchParams.get('registered') === 'true') {
			ssrData.registered = true
		}

		return renderPage(c, path, template, ssrRender, vite, ssrData)
	})

	if (vite) {
		const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
			vite?.middlewares(req, res, async () => {
				try {
					const url = `http://localhost:${port}${req.url || '/'}`

					const response = await app.fetch(
						new Request(url, {
							method: req.method,
							headers: req.headers as Record<string, string>,
							body: req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : undefined,
						}),
					)

					res.statusCode = response.status

					for (const [key, value] of response.headers.entries()) {
						res.setHeader(key, value)
					}

					const body = await response.arrayBuffer()

					res.end(Buffer.from(body))
				} catch (e) {
					vite?.ssrFixStacktrace(e as Error)

					console.error(e)

					res.statusCode = 500

					res.end((e as Error).message)
				}
			})
		})

		httpServer.listen(port, () => {
			console.log(`Demo server running at http://localhost:${port}`)
		})
	} else {
		const { serve } = await import('@hono/node-server')

		serve({ fetch: app.fetch, port }, () => {
			console.log(`Demo server running at http://localhost:${port}`)
		})
	}
}

async function renderPage(
	c: { html: (html: string) => Response | Promise<Response> },
	url: string,
	template: string,
	ssrRender: RenderFn,
	vite: ViteDevServer | undefined,
	ssrData: SSRData,
) {
	let html = template

	if (vite) {
		html = await vite.transformIndexHtml(url, html)
	}

	const appHtml = await ssrRender(url, ssrData)

	const ssrScript = `<script>window.__SSR_DATA__=${JSON.stringify(ssrData)}</script>`

	html = html.replace('<!--ssr-outlet-->', `${ssrScript}\n\t\t${appHtml}`)

	return c.html(html)
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve) => {
		let body = ''

		req.on('data', (chunk: Buffer) => {
			body += chunk.toString()
		})

		req.on('end', () => resolve(body))
	})
}

createDemoServer()
