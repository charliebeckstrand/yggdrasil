import { z } from 'zod'

const envSchema = z.object({
	PORT: z.coerce.number().default(3001),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.string().optional(),
	RATATOSKR_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(): Env {
	const result = envSchema.safeParse(process.env)

	if (!result.success) {
		console.error('Invalid environment variables:', result.error.format())

		process.exit(1)
	}

	return result.data
}
