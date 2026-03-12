import { createApp } from 'grid'

import { environment } from './lib/env.js'
import { rpcLogger } from './middleware/rpc-logger.js'
import { timing } from './middleware/timing.js'
import { health } from './routes/health.js'
import { security } from './routes/security.js'

export function createHermesApp() {
	const env = environment()

	const { app, setup } = createApp({
		basePath: '/rpc',
		title: 'Hermes',
		description: 'Typed RPC gateway for inter-service communication',
		cors: { origin: env.CORS_ORIGIN, credentials: true },
	})

	app.use('/rpc/*', timing())
	app.use('/rpc/*', rpcLogger())

	const routes = app.route('/rpc', health).route('/rpc', security)

	setup()

	return routes
}

export type HermesApp = ReturnType<typeof createHermesApp>
