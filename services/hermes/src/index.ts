import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { reportReady } from 'startup'
import { createApp } from './app.js'
import { loadEnv } from './lib/env.js'
import { createWsHandler } from './ws/handler.js'

const env = loadEnv()

const app = createApp()
const nodeWs = createNodeWebSocket({ app })

app.get('/messages/ws', createWsHandler(nodeWs.upgradeWebSocket))

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		reportReady(info.port, [
			{ label: 'docs', path: '/messages/docs' },
			{ label: 'ws', path: '/messages/ws' },
		])
	},
)

nodeWs.injectWebSocket(server)
