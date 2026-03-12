import { createEnvironment } from 'grid/environment'
import { z } from 'zod'

export const environment = createEnvironment({
	CORS_ORIGIN: z.string().default('http://localhost:3000'),
})

export type Environment = ReturnType<typeof environment>
