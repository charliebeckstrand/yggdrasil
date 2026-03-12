import { watch } from 'node:fs'
import { join } from 'node:path'
import type { Hono } from 'hono'

export function setupLivereload(app: Hono): void {
	let version = 0
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	const bump = () => {
		if (debounceTimer) clearTimeout(debounceTimer)

		debounceTimer = setTimeout(() => {
			version++
		}, 50)
	}

	app.get('/__livereload', (c) => c.json({ version }))

	const distDir = join(process.cwd(), 'dist')

	watch(distDir, { recursive: true }, (_event, filename) => {
		if (filename?.endsWith('.css')) bump()
	})
}
