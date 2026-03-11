import { serve } from '@hono/node-server'
import { registerWithForseti } from 'forseti/client'
import { configure } from 'heimdall'
import { setupLifecycle } from 'norns'
import { createBifrostApp } from './app.js'
import { closePool } from './lib/db.js'
import { environment } from './lib/env.js'
import { configureForseti, reportSecurityEvent } from './lib/forseti.js'
import { createUserRepository } from './lib/user-repository.js'

const env = environment()

configureForseti(env.FORSETI_URL)

configure({
	userRepository: createUserRepository(),
	secretKey: env.SECRET_KEY,
	apiKey: env.HEIMDALL_API_KEY,
	onSecurityEvent: (event) =>
		reportSecurityEvent(event.type, event.ip, event.details ?? {}, 'heimdall'),
})

const app = createBifrostApp()

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Bifrost running on http://localhost:${info.port}`)
		console.log(`API docs available at http://localhost:${info.port}/api/docs`)

		registerWithForseti({
			forsetiUrl: env.FORSETI_URL,
			service: 'bifrost',
			url: `http://localhost:${info.port}`,
			spec: `http://localhost:${info.port}/api/openapi.json`,
		})
	},
)

setupLifecycle({ server, name: 'Bifrost', port: env.PORT, onShutdown: closePool })
