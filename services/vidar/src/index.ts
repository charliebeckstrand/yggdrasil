import { serve } from '@hono/node-server'
import { registerWithForseti } from 'forseti/client'
import { setupLifecycle } from 'norns'
import { createVidarApp } from './app.js'
import { closePool } from './lib/db.js'
import { environment } from './lib/env.js'
import { cleanExpiredBans } from './services/bans.js'

const env = environment()
const app = createVidarApp()

const CLEANUP_INTERVAL_MS = 3_600_000 // 1 hour

const cleanupTimer = setInterval(() => {
	cleanExpiredBans().catch((err) => {
		console.error('[vidar] Failed to clean expired bans:', err)
	})
}, CLEANUP_INTERVAL_MS)

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Vidar running on http://localhost:${info.port}`)
		console.log(`API docs available at http://localhost:${info.port}/vidar/docs`)

		registerWithForseti({
			forsetiUrl: env.FORSETI_URL,
			service: 'vidar',
			url: `http://localhost:${info.port}`,
			spec: `http://localhost:${info.port}/vidar/openapi.json`,
		})
	},
)

setupLifecycle({
	server,
	name: 'Vidar',
	port: env.PORT,
	onShutdown: async () => {
		clearInterval(cleanupTimer)

		await closePool()
	},
})
