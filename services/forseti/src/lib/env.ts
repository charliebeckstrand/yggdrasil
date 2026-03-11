import { createEnvironment } from 'frigg'
import { z } from 'zod'

export const environment = createEnvironment({
	CORS_ORIGIN: z.string().default('http://localhost:3000'),
	FORSETI_API_KEY: z.string().optional(),
	BIFROST_URL: z.string().default('http://localhost:3000'),
	HUGINN_URL: z.string().default('http://localhost:3002'),
	VIDAR_URL: z.string().default('http://localhost:3003'),
})

export type Environment = ReturnType<typeof environment>
