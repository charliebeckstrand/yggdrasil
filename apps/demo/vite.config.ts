import devServer from '@hono/vite-dev-server'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
	Object.assign(process.env, loadEnv(mode, '.', ''))

	return {
		plugins: [
			tailwindcss(),
			devServer({
				entry: 'src/app.tsx',
			}),
		],
		server: {
			port: 3000,
		},
	}
})
