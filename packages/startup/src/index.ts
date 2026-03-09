import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export interface StartupRoute {
	label: string
	path: string
}

interface ReadySignal {
	name: string
	port: number
	routes: StartupRoute[]
	pid: number
}

const READY_DIR = join(tmpdir(), 'yggdrasil-dev')

function findManifest(startDir: string): { dir: string; name: string; port: number } {
	let dir = startDir

	while (!existsSync(resolve(dir, 'manifest.json'))) {
		const parent = resolve(dir, '..')
		if (parent === dir) throw new Error('manifest.json not found')
		dir = parent
	}

	const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf-8'))
	return { dir, name: manifest.name, port: manifest.port }
}

function discoverServices(servicesDir: string): string[] {
	return readdirSync(servicesDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.filter((d) => {
			const manifestPath = resolve(servicesDir, d.name, 'manifest.json')
			if (!existsSync(manifestPath)) return false
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
			return typeof manifest.port === 'number'
		})
		.map((d) => d.name)
}

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

function cleanStale(readyDir: string): void {
	if (!existsSync(readyDir)) return

	let hasValid = false

	for (const file of readdirSync(readyDir)) {
		if (file.startsWith('.')) continue
		const filepath = join(readyDir, file)
		try {
			const data: ReadySignal = JSON.parse(readFileSync(filepath, 'utf-8'))
			if (isProcessAlive(data.pid)) {
				hasValid = true
			} else {
				unlinkSync(filepath)
			}
		} catch {
			unlinkSync(filepath)
		}
	}

	if (!hasValid) {
		const lockPath = join(readyDir, '.printed')
		if (existsSync(lockPath)) unlinkSync(lockPath)
	}
}

function getReadyServices(readyDir: string): ReadySignal[] {
	if (!existsSync(readyDir)) return []

	return readdirSync(readyDir)
		.filter((f) => !f.startsWith('.'))
		.map((f) => {
			try {
				return JSON.parse(readFileSync(join(readyDir, f), 'utf-8')) as ReadySignal
			} catch {
				return null
			}
		})
		.filter((s): s is ReadySignal => s !== null)
		.sort((a, b) => a.port - b.port)
}

function tryPrintTable(services: ReadySignal[]): boolean {
	const lockPath = join(READY_DIR, '.printed')
	try {
		writeFileSync(lockPath, process.pid.toString(), { flag: 'wx' })
	} catch {
		return false
	}

	printTable(services)
	return true
}

function printTable(services: ReadySignal[]): void {
	const nameWidth = Math.max('Service'.length, ...services.map((s) => s.name.length))
	const portWidth = Math.max('Port'.length, ...services.map((s) => String(s.port).length))

	const rows: string[][] = []
	for (const service of services) {
		for (let i = 0; i < service.routes.length; i++) {
			const route = service.routes[i]
			const url = `http://localhost:${service.port}${route.path}`
			rows.push([
				i === 0 ? service.name : '',
				i === 0 ? String(service.port) : '',
				`${route.label} → ${url}`,
			])
		}
		if (service.routes.length === 0) {
			rows.push([service.name, String(service.port), `http://localhost:${service.port}`])
		}
	}

	const urlWidth = Math.max('URLs'.length, ...rows.map((r) => r[2].length))

	const pad = (s: string, w: number) => s + ' '.repeat(w - s.length)
	const line = (l: string, m: string, r: string, fill: string) =>
		`${l}${fill.repeat(nameWidth + 2)}${m}${fill.repeat(portWidth + 2)}${m}${fill.repeat(urlWidth + 2)}${r}`

	console.log('')
	console.log(line('┌', '┬', '┐', '─'))
	console.log(
		`│ ${pad('Service', nameWidth)} │ ${pad('Port', portWidth)} │ ${pad('URLs', urlWidth)} │`,
	)
	console.log(line('├', '┼', '┤', '─'))

	for (const [name, port, url] of rows) {
		console.log(`│ ${pad(name, nameWidth)} │ ${pad(port, portWidth)} │ ${pad(url, urlWidth)} │`)
	}

	console.log(line('└', '┴', '┘', '─'))
	console.log('')
}

export function reportReady(port: number, routes: StartupRoute[]): void {
	const manifest = findManifest(process.cwd())
	const servicesDir = resolve(manifest.dir, '..')
	const expected = discoverServices(servicesDir)

	cleanStale(READY_DIR)

	mkdirSync(READY_DIR, { recursive: true })

	const signal: ReadySignal = {
		name: manifest.name,
		port,
		routes,
		pid: process.pid,
	}

	writeFileSync(join(READY_DIR, `${manifest.name}.json`), JSON.stringify(signal))

	const ready = getReadyServices(READY_DIR)

	if (ready.length >= expected.length) {
		tryPrintTable(ready)
	} else {
		setTimeout(() => {
			const ready = getReadyServices(READY_DIR)
			tryPrintTable(ready)
		}, 3000)
	}
}
