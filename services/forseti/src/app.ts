import { createApp } from 'grid'

import { environment } from './lib/env.js'
import { broadcastMessage } from './routes/broadcast.js'
import { channels } from './routes/channels.js'
import { declareIntent } from './routes/declare.js'
import { health } from './routes/health.js'
import { heartbeat } from './routes/heartbeat.js'
import { resolutionLog } from './routes/log.js'
import { register } from './routes/register.js'
import { registry } from './routes/registry.js'
import { resolveIntent } from './routes/resolve.js'
import { sendMessage } from './routes/send.js'

export function createForsetiApp() {
	const env = environment()

	const { app, setup } = createApp({
		basePath: '/forseti',
		title: 'Forseti',
		description: 'Intent-based service orchestrator',
		cors: { origin: env.CORS_ORIGIN, credentials: true },
	})

	// --- Intent orchestration ---

	app.route('/forseti', register)
	app.route('/forseti', resolveIntent)
	app.route('/forseti', declareIntent)
	app.route('/forseti', heartbeat)
	app.route('/forseti', registry)
	app.route('/forseti', resolutionLog)

	// --- Messaging (WebSocket push) ---

	app.route('/forseti', sendMessage)
	app.route('/forseti', broadcastMessage)
	app.route('/forseti', channels)

	// --- Health ---

	app.route('/forseti', health)

	// --- Finalize ---

	setup()

	return app
}
