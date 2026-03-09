import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveEnvironments, writeEnvFiles } from '../environments.js'
import type { ManifestData } from '../types.js'

const manifests: ManifestData = {
	heimdall: {
		name: 'heimdall',
		port: 3001,
		vars: {
			SECRET_KEY: { type: 'secret' },
			HEIMDALL_API_KEY: { type: 'secret' },
			DATABASE_URL: { type: 'value', default: 'postgresql://localhost/heimdall' },
		},
	},
	bifrost: {
		name: 'bifrost',
		port: 3000,
		vars: {
			SESSION_SECRET: { type: 'secret' },
			HEIMDALL_URL: { type: 'ref', service: 'heimdall' },
			HEIMDALL_API_KEY: { type: 'ref', service: 'heimdall', key: 'HEIMDALL_API_KEY' },
		},
	},
}

const secretsCache: Record<string, string> = {
	'heimdall:SECRET_KEY': 'secret-key-value',
	'heimdall:HEIMDALL_API_KEY': 'api-key-value',
	'bifrost:SESSION_SECRET': 'session-secret-value',
}

describe('resolveEnvironments', () => {
	it('resolves NODE_ENV and PORT for each service', () => {
		const result = resolveEnvironments(manifests, secretsCache, 'production')

		expect(result.heimdall.NODE_ENV).toBe('production')
		expect(result.heimdall.PORT).toBe('3001')
		expect(result.bifrost.NODE_ENV).toBe('production')
		expect(result.bifrost.PORT).toBe('3000')
	})

	it('resolves value type vars with defaults', () => {
		const result = resolveEnvironments(manifests, secretsCache)

		expect(result.heimdall.DATABASE_URL).toBe('postgresql://localhost/heimdall')
	})

	it('resolves secret type vars from cache', () => {
		const result = resolveEnvironments(manifests, secretsCache)

		expect(result.heimdall.SECRET_KEY).toBe('secret-key-value')
		expect(result.heimdall.HEIMDALL_API_KEY).toBe('api-key-value')
	})

	it('resolves ref type vars without key as URL from port', () => {
		const result = resolveEnvironments(manifests, secretsCache)

		expect(result.bifrost.HEIMDALL_URL).toBe('http://localhost:3001')
	})

	it('resolves ref type vars with key from referenced service secret', () => {
		const result = resolveEnvironments(manifests, secretsCache)

		expect(result.bifrost.HEIMDALL_API_KEY).toBe('api-key-value')
	})

	it('defaults NODE_ENV to development', () => {
		const result = resolveEnvironments(manifests, secretsCache)

		expect(result.heimdall.NODE_ENV).toBe('development')
	})

	it('returns empty string for missing secrets', () => {
		const result = resolveEnvironments(manifests, {})

		expect(result.heimdall.SECRET_KEY).toBe('')
	})

	it('returns empty string for ref to unknown service', () => {
		const manifests: ManifestData = {
			test: {
				name: 'test',
				port: 3000,
				vars: {
					UNKNOWN_URL: { type: 'ref', service: 'nonexistent' },
				},
			},
		}

		const result = resolveEnvironments(manifests, {})

		expect(result.test.UNKNOWN_URL).toBe('')
	})
})

describe('writeEnvFiles', () => {
	let servicesDir: string

	beforeEach(() => {
		servicesDir = join(tmpdir(), `frigg-test-${Date.now()}`)

		mkdirSync(join(servicesDir, 'heimdall'), { recursive: true })
		mkdirSync(join(servicesDir, 'bifrost'), { recursive: true })
	})

	afterEach(() => {
		rmSync(servicesDir, { recursive: true, force: true })
	})

	it('writes .env files for all services when no filter is provided', () => {
		const environments = resolveEnvironments(manifests, secretsCache)

		writeEnvFiles(environments, servicesDir)

		expect(existsSync(join(servicesDir, 'heimdall', '.env'))).toBe(true)
		expect(existsSync(join(servicesDir, 'bifrost', '.env'))).toBe(true)
	})

	it('writes .env only for filtered services', () => {
		const environments = resolveEnvironments(manifests, secretsCache)

		writeEnvFiles(environments, servicesDir, ['bifrost'])

		expect(existsSync(join(servicesDir, 'bifrost', '.env'))).toBe(true)
		expect(existsSync(join(servicesDir, 'heimdall', '.env'))).toBe(false)
	})

	it('resolves cross-service refs even when only writing filtered service', () => {
		const environments = resolveEnvironments(manifests, secretsCache)

		writeEnvFiles(environments, servicesDir, ['bifrost'])

		const content = readFileSync(join(servicesDir, 'bifrost', '.env'), 'utf-8')

		expect(content).toContain('HEIMDALL_URL=http://localhost:3001')
		expect(content).toContain('HEIMDALL_API_KEY=api-key-value')
	})
})
