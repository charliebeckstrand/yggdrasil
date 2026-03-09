// TODO: Add saga service to .do/app.yaml and secrets to .github/workflows/deploy.yml when ready to deploy

import { serve } from '@hono/node-server'
import { reportReady } from 'startup'
import { createApp } from './app.js'
import { loadEnv } from './lib/env.js'

const env = loadEnv()
const app = createApp()

serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		reportReady(info.port, [
			{ label: 'docs', path: '/events/docs' },
			{ label: 'openapi', path: '/events/openapi.json' },
		])
	},
)
