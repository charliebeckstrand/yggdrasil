import { createEnvironment } from 'grid/environment'
import { z } from 'zod'

export const environment = createEnvironment({
	CORS_ORIGIN: z.string().default('http://localhost:3000'),
	VIDAR_URL: z.string().default('http://localhost:3002'),
	VIDAR_API_KEY: z.string().optional(),
})

export type Environment = ReturnType<typeof environment>
