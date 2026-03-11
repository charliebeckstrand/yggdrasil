import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { setupLifecycle } from 'norns'
import { createForsetiApp } from './app.js'
import { environment } from './lib/env.js'
import { createWsHandler } from './ws/handler.js'

const env = environment()

const app = createForsetiApp()
const nodeWs = createNodeWebSocket({ app })

app.get('/forseti/ws', createWsHandler(nodeWs.upgradeWebSocket))

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Forseti running on http://localhost:${info.port}`)
		console.log(`API docs available at http://localhost:${info.port}/forseti/docs`)
		console.log(`WebSocket at ws://localhost:${info.port}/forseti/ws`)
	},
)

nodeWs.injectWebSocket(server)

setupLifecycle({ server, name: 'Forseti', port: env.PORT })
