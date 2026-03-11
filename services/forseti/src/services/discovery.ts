import { registerProvider } from './registry.js'

export interface ServiceEntry {
	name: string
	url: string
	spec: string
}

let knownServices: ServiceEntry[] = []
let discoveryTimer: ReturnType<typeof setInterval> | null = null

const REDISCOVERY_INTERVAL_MS = 60_000

/**
 * Configure which services Forseti should discover.
 * Forseti fetches their OpenAPI specs and builds the operation registry.
 */
export function configureServices(services: ServiceEntry[]): void {
	knownServices = services
}

/**
 * Run initial discovery and start periodic rediscovery.
 */
export async function startDiscovery(): Promise<void> {
	await discoverAll()

	discoveryTimer = setInterval(() => {
		discoverAll().catch((err) => {
			console.error('[forseti] Rediscovery failed:', err)
		})
	}, REDISCOVERY_INTERVAL_MS)
}

export function stopDiscovery(): void {
	if (discoveryTimer) {
		clearInterval(discoveryTimer)

		discoveryTimer = null
	}
}

async function discoverAll(): Promise<void> {
	const results = await Promise.allSettled(
		knownServices.map(async (svc) => {
			try {
				const count = await registerProvider(svc.name, svc.url, svc.spec)

				console.log(`[forseti] Discovered ${svc.name} (${count} operations)`)

				return count
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)

				console.warn(`[forseti] Could not discover ${svc.name}: ${msg}`)

				throw err
			}
		}),
	)

	const discovered = results.filter((r) => r.status === 'fulfilled').length

	console.log(`[forseti] Discovery complete: ${discovered}/${knownServices.length} services`)
}
