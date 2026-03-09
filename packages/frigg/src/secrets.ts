import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { ManifestData } from './types.js'

export interface GenerateSecretsOptions {
	/** Rotate secrets. `true` rotates all, string array rotates specific keys. */
	rotate?: true | string[]
}

/**
 * Generate secrets for all services. Returns an updated secrets cache.
 * Existing secrets are preserved unless rotation is requested.
 */
export function generateSecrets(
	manifests: ManifestData,
	cache: Record<string, string>,
	options?: GenerateSecretsOptions,
): Record<string, string> {
	const updated = { ...cache }

	// Handle rotation: remove specified keys
	if (options?.rotate) {
		if (options.rotate === true) {
			for (const key of Object.keys(updated)) {
				delete updated[key]
			}

			console.log('  rotating all secrets')
		} else {
			for (const keyName of options.rotate) {
				for (const cacheKey of Object.keys(updated)) {
					if (cacheKey.endsWith(`:${keyName}`)) {
						delete updated[cacheKey]

						console.log(`  rotating ${cacheKey}`)
					}
				}
			}
		}
	}

	// Generate secrets for vars with type 'secret'
	for (const [serviceName, manifest] of Object.entries(manifests)) {
		for (const [varName, config] of Object.entries(manifest.vars || {})) {
			if (config.type !== 'secret') continue

			const cacheKey = `${serviceName}:${varName}`

			if (!updated[cacheKey]) {
				updated[cacheKey] = randomBytes(32).toString('hex')

				console.log(`  generated ${cacheKey}`)
			}
		}
	}

	return updated
}

/**
 * Load secrets cache from a JSON file.
 */
export function loadSecretsCache(path: string): Record<string, string> {
	if (!existsSync(path)) return {}

	try {
		return JSON.parse(readFileSync(path, 'utf-8'))
	} catch {
		return {}
	}
}

/**
 * Save secrets cache to a JSON file.
 */
export function saveSecretsCache(cache: Record<string, string>, path: string): void {
	writeFileSync(path, `${JSON.stringify(cache, null, '\t')}\n`)
}
