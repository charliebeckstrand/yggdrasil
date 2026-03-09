import { serve } from '@hono/node-server'
import { reportReady } from 'startup'
import { createApp } from './app.js'
import { loadEnv } from './lib/env.js'
import { loadEnvironments } from './lib/environments.js'

const env = loadEnv()

// Pre-load environments at startup to fail fast if the file is missing
const environments = loadEnvironments()

const serviceCount = Object.keys(environments).length

const app = createApp()

serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`  ${serviceCount} services loaded from ${env.NODE_ENV} environment`)
		reportReady(info.port, [{ label: 'docs', path: '/services/docs' }])
	},
)
