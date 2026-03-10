import { randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface VarConfig {
	type: 'value' | 'secret' | 'ref'
	default?: string
	service?: string
	key?: string
}

export interface Manifest {
	name: string
	port: number
	vars: Record<string, VarConfig>
}

export type EnvironmentData = Record<string, Record<string, string>>
export type ManifestData = Record<string, Manifest>
export type Issue = { level: 'error' | 'warning'; message: string }
export type GenerateSecretsOptions = { rotate?: true | string[] }

export interface InitOptions {
	rootDir: string
	rotate?: true | string[]
	nodeEnv?: string
	services?: string[]
}

function warn(message: string): void {
	console.error(`  warning: ${message}`)
}

export function loadManifests(servicesDir: string): ManifestData {
	const manifests: ManifestData = {}

	for (const entry of readdirSync(servicesDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue

		try {
			const manifest: Manifest = JSON.parse(
				readFileSync(resolve(servicesDir, entry.name, 'manifest.json'), 'utf-8'),
			)
			manifests[manifest.name || entry.name] = manifest
		} catch {
			// Skip missing or malformed manifests
		}
	}

	return manifests
}

export function getSecretConsumers(manifests: ManifestData): Record<string, string[]> {
	const consumers: Record<string, string[]> = {}

	for (const [serviceName, manifest] of Object.entries(manifests)) {
		for (const [varName, config] of Object.entries(manifest.vars)) {
			const key = config.type === 'secret' ? varName : config.type === 'ref' ? config.key : null

			if (key) {
				consumers[key] ??= []
				consumers[key].push(serviceName)
			}
		}
	}

	return consumers
}

export function generateSecrets(
	manifests: ManifestData,
	cache: Record<string, string>,
	options?: GenerateSecretsOptions,
): Record<string, string> {
	let updated: Record<string, string>

	if (options?.rotate === true) {
		console.log('  rotating all secrets')
		updated = {}
	} else {
		updated = { ...cache }
	}

	if (Array.isArray(options?.rotate)) {
		for (const keyName of options.rotate) {
			for (const cacheKey of Object.keys(updated)) {
				if (cacheKey.endsWith(`:${keyName}`)) {
					delete updated[cacheKey]

					console.log(`  rotating ${cacheKey}`)
				}
			}
		}
	}

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

export function loadSecretsCache(path: string): Record<string, string> {
	try {
		return JSON.parse(readFileSync(path, 'utf-8'))
	} catch {
		return {}
	}
}

export function saveSecretsCache(cache: Record<string, string>, path: string): void {
	writeFileSync(path, `${JSON.stringify(cache, null, '\t')}\n`)
}

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
			if (config.type === 'value') {
				resolved[varName] = config.default ?? ''
			} else if (config.type === 'secret') {
				resolved[varName] = secretsCache[`${serviceName}:${varName}`] ?? ''
			} else if (config.type === 'ref') {
				resolved[varName] = resolveRef(serviceName, varName, config, manifests, secretsCache)
			} else {
				warn(`${serviceName}.${varName} has unknown type '${(config as { type: string }).type}'`)
				resolved[varName] = ''
			}
		}

		result[serviceName] = resolved
	}

	return result
}

function resolveRef(
	serviceName: string,
	varName: string,
	config: VarConfig,
	manifests: ManifestData,
	secretsCache: Record<string, string>,
): string {
	const refManifest = manifests[config.service ?? '']

	if (!refManifest) {
		warn(`${serviceName}.${varName} references unknown service '${config.service}'`)
		return ''
	}

	if (!config.key) return `http://localhost:${refManifest.port}`

	const refVar = refManifest.vars?.[config.key]

	if (!refVar) {
		warn(
			`${serviceName}.${varName} references '${config.service}.${config.key}' which does not exist`,
		)
		return ''
	}

	if (refVar.type === 'secret') return secretsCache[`${config.service}:${config.key}`] || ''
	if (refVar.type === 'value') return refVar.default ?? ''

	warn(
		`${serviceName}.${varName} references '${config.service}.${config.key}' which is itself a ref (not supported)`,
	)
	return ''
}

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

export function checkPortConflicts(
	allServices: EnvironmentData,
): { service: string; issues: Issue[] }[] {
	const portMap = new Map<string, string[]>()

	for (const [name, data] of Object.entries(allServices)) {
		if (!data.PORT) continue
		if (!portMap.has(data.PORT)) portMap.set(data.PORT, [])
		portMap.get(data.PORT)?.push(name)
	}

	const results: { service: string; issues: Issue[] }[] = []

	for (const [port, services] of portMap) {
		if (services.length <= 1) continue

		for (const service of services) {
			const others = services.filter((s) => s !== service).join(', ')
			results.push({
				service,
				issues: [{ level: 'error', message: `PORT ${port} conflicts with: ${others}` }],
			})
		}
	}

	return results
}

export function validateService(
	name: string,
	data: Record<string, string>,
	allServices: EnvironmentData,
	manifests: ManifestData,
): Issue[] {
	const issues: Issue[] = []

	for (const [key, value] of Object.entries(data)) {
		if (value === '') {
			issues.push({ level: 'error', message: `${key} is empty` })
		}

		if (key.endsWith('_URL') && value !== '') {
			if (!URL.canParse(value)) {
				issues.push({ level: 'error', message: `${key} '${value}' is not a valid URL` })
			} else {
				const refName = key.replace(/_URL$/, '').toLowerCase()
				const refService = allServices[refName]

				if (refService?.PORT) {
					const url = new URL(value)
					const urlPort = url.port || (url.protocol === 'https:' ? '443' : '80')

					if (urlPort !== refService.PORT) {
						issues.push({
							level: 'error',
							message: `${key} port :${urlPort} does not match ${refName}'s PORT ${refService.PORT}`,
						})
					}
				}
			}
		}

		if (key.endsWith('_API_KEY')) {
			const refName = key.replace(/_API_KEY$/, '').toLowerCase()
			const refService = allServices[refName]
			const refKey = `${key.replace(/_API_KEY$/, '').toUpperCase()}_API_KEY`

			if (refService?.[refKey] && refService[refKey] !== value) {
				issues.push({
					level: 'error',
					message: `${key} does not match ${refName}'s ${refKey}`,
				})
			}
		}
	}

	if (data.PORT !== undefined) {
		const port = Number(data.PORT)

		if (Number.isNaN(port) || port < 1 || port > 65535) {
			issues.push({ level: 'error', message: `PORT '${data.PORT}' is not a valid port number` })
		}
	} else {
		issues.push({ level: 'warning', message: 'No PORT configured' })
	}

	const manifest = manifests[name]

	if (manifest) {
		for (const [varName, config] of Object.entries(manifest.vars)) {
			if (data[varName] === undefined) {
				issues.push({
					level: 'error',
					message: `${varName} declared in manifest but missing from config`,
				})
			}

			if (config.type === 'ref' && config.service) {
				const refManifest = manifests[config.service]

				if (!refManifest) {
					issues.push({
						level: 'error',
						message: `${varName} references service '${config.service}' which has no manifest`,
					})
				} else if (config.key && !refManifest.vars[config.key]) {
					issues.push({
						level: 'error',
						message: `${varName} references '${config.service}.${config.key}' which is not declared in ${config.service}'s manifest`,
					})
				}
			}
		}
	} else {
		issues.push({ level: 'warning', message: 'No manifest.json found for this service' })
	}

	return issues
}

export function validateAll(
	environments: EnvironmentData,
	manifests: ManifestData,
): { service: string; status: 'pass' | 'warn' | 'fail'; issues: Issue[] }[] {
	const portConflicts = checkPortConflicts(environments)

	return Object.entries(environments).map(([name, data]) => {
		const issues = validateService(name, data, environments, manifests)
		const conflicts = portConflicts.find((pc) => pc.service === name)

		if (conflicts) issues.push(...conflicts.issues)

		const status = issues.some((i) => i.level === 'error')
			? 'fail'
			: issues.some((i) => i.level === 'warning')
				? 'warn'
				: 'pass'

		return { service: name, status, issues }
	})
}

export function initEnvironments(options: InitOptions): void {
	const servicesDir = resolve(options.rootDir, 'services')
	const secretsCachePath = resolve(options.rootDir, '.secrets.json')
	const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? 'development'
	const manifests = loadManifests(servicesDir)

	if (Object.keys(manifests).length === 0) {
		console.error('No service manifests found.')
		process.exit(1)
	}

	const cache = loadSecretsCache(secretsCachePath)
	const updatedCache = generateSecrets(manifests, cache, { rotate: options.rotate })
	const environments = resolveEnvironments(manifests, updatedCache, nodeEnv)

	writeEnvFiles(environments, servicesDir, options.services)
	saveSecretsCache(updatedCache, secretsCachePath)
	console.log('saved secrets cache')
}
