import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/__tests__/**'],
		},
	},
	resolve: {
		alias: {
			'@': './src',
		},
	},
})
