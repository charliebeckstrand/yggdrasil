import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { EnvironmentData, ManifestData } from './types.js'

/**
 * Resolve all service configurations from manifests and a secrets cache.
 * Returns a map of service name -> resolved environment variables.
 */
export function resolveEnvironments(
	manifests: ManifestData,
	secretsCache: Record<string, string>,
	nodeEnv = 'development',
): EnvironmentData {
	const result: EnvironmentData = {}

	for (const [serviceName, manifest] of Object.entries(manifests)) {
		const resolved: Record<string, string> = {
			NODE_ENV: nodeEnv,
			PORT: String(manifest.port),
		}

		for (const [varName, config] of Object.entries(manifest.vars || {})) {
			switch (config.type) {
				case 'value': {
					resolved[varName] = config.default ?? ''

					break
				}

				case 'secret': {
					const cacheKey = `${serviceName}:${varName}`

					resolved[varName] = secretsCache[cacheKey] ?? ''

					break
				}

				case 'ref': {
					const refManifest = manifests[config.service ?? '']

					if (!refManifest) {
						console.error(
							`  warning: ${serviceName}.${varName} references unknown service '${config.service}'`,
						)

						resolved[varName] = ''

						break
					}

					if (config.key) {
						const refVarConfig = refManifest.vars?.[config.key]

						if (!refVarConfig) {
							console.error(
								`  warning: ${serviceName}.${varName} references '${config.service}.${config.key}' which does not exist`,
							)

							resolved[varName] = ''
						} else if (refVarConfig.type === 'secret') {
							const cacheKey = `${config.service}:${config.key}`

							resolved[varName] = secretsCache[cacheKey] || ''
						} else if (refVarConfig.type === 'value') {
							resolved[varName] = refVarConfig.default ?? ''
						} else {
							console.error(
								`  warning: ${serviceName}.${varName} references '${config.service}.${config.key}' which is itself a ref (not supported)`,
							)

							resolved[varName] = ''
						}
					} else {
						resolved[varName] = `http://localhost:${refManifest.port}`
					}

					break
				}

				default:
					console.error(
						`  warning: ${serviceName}.${varName} has unknown type '${(config as { type: string }).type}'`,
					)

					resolved[varName] = ''
			}
		}

		result[serviceName] = resolved
	}

	return result
}

/**
 * Write .env files for each service into their respective directories.
 * When `filter` is provided, only writes .env files for the specified services.
 */
export function writeEnvFiles(
	environments: EnvironmentData,
	servicesDir: string,
	filter?: string[],
): void {
	for (const [serviceName, vars] of Object.entries(environments)) {
		if (filter && !filter.includes(serviceName)) continue

		const serviceDir = resolve(servicesDir, serviceName)

		if (!existsSync(serviceDir)) continue

		const content = Object.entries(vars)
			.map(([key, value]) => `${key}=${value}`)
			.join('\n')

		writeFileSync(resolve(serviceDir, '.env'), `${content}\n`)

		console.log(`  wrote ${serviceName}/.env`)
	}
}
