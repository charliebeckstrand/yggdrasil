import { serve } from '@hono/node-server'
import { setupLifecycle } from 'grid/server-lifecycle'

import { createHermesApp } from './app.js'
import { environment } from './lib/env.js'

const env = environment()
const app = createHermesApp()

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Hermes messaging service running on http://localhost:${info.port}`)
		console.log(`API docs available at http://localhost:${info.port}/msg/docs`)
	},
)

setupLifecycle({ server, name: 'Hermes' })
