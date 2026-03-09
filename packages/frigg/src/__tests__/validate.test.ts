import { describe, expect, it } from 'vitest'
import type { EnvironmentData, ManifestData } from '../types.js'
import { checkPortConflicts, validateAll, validateService } from '../validate.js'

const manifests: ManifestData = {
	heimdall: {
		name: 'heimdall',
		port: 3001,
		vars: {
			SECRET_KEY: { type: 'secret' },
			DATABASE_URL: { type: 'value', default: 'postgresql://localhost/heimdall' },
		},
	},
	bifrost: {
		name: 'bifrost',
		port: 3000,
		vars: {
			HEIMDALL_URL: { type: 'ref', service: 'heimdall' },
			HEIMDALL_API_KEY: { type: 'ref', service: 'heimdall', key: 'SECRET_KEY' },
		},
	},
}

describe('validateService', () => {
	it('reports empty values as errors', () => {
		const data = { PORT: '3001', SECRET_KEY: '', DATABASE_URL: 'pg://localhost/db' }
		const allServices: EnvironmentData = { heimdall: data }

		const issues = validateService('heimdall', data, allServices, manifests)

		expect(issues).toContainEqual({ level: 'error', message: 'SECRET_KEY is empty' })
	})

	it('reports invalid PORT', () => {
		const data = { PORT: 'abc' }
		const allServices: EnvironmentData = { test: data }

		const issues = validateService('test', data, allServices, {})

		expect(issues).toContainEqual({
			level: 'error',
			message: "PORT 'abc' is not a valid port number",
		})
	})

	it('reports invalid URLs', () => {
		const data = { PORT: '3000', HEIMDALL_URL: 'not-a-url' }
		const allServices: EnvironmentData = { bifrost: data }

		const issues = validateService('bifrost', data, allServices, manifests)

		expect(issues).toContainEqual({
			level: 'error',
			message: "HEIMDALL_URL 'not-a-url' is not a valid URL",
		})
	})

	it('reports missing manifest vars', () => {
		const data = { PORT: '3001', NODE_ENV: 'development' }
		const allServices: EnvironmentData = { heimdall: data }

		const issues = validateService('heimdall', data, allServices, manifests)

		expect(issues).toContainEqual({
			level: 'error',
			message: 'SECRET_KEY declared in manifest but missing from config',
		})
	})

	it('warns when no manifest found', () => {
		const data = { PORT: '3000' }
		const allServices: EnvironmentData = { unknown: data }

		const issues = validateService('unknown', data, allServices, {})

		expect(issues).toContainEqual({
			level: 'warning',
			message: 'No manifest.json found for this service',
		})
	})

	it('passes for valid configuration', () => {
		const data = {
			PORT: '3001',
			NODE_ENV: 'development',
			SECRET_KEY: 'abc123',
			DATABASE_URL: 'postgresql://localhost/heimdall',
		}
		const allServices: EnvironmentData = { heimdall: data }

		const issues = validateService('heimdall', data, allServices, manifests)

		expect(issues).toHaveLength(0)
	})
})

describe('checkPortConflicts', () => {
	it('detects port conflicts', () => {
		const allServices: EnvironmentData = {
			service1: { PORT: '3000' },
			service2: { PORT: '3000' },
			service3: { PORT: '3001' },
		}

		const conflicts = checkPortConflicts(allServices)

		expect(conflicts).toHaveLength(2) // both conflicting services get an issue
		expect(conflicts[0].issues[0].message).toContain('PORT 3000 conflicts with')
	})

	it('returns empty when no conflicts', () => {
		const allServices: EnvironmentData = {
			service1: { PORT: '3000' },
			service2: { PORT: '3001' },
		}

		expect(checkPortConflicts(allServices)).toHaveLength(0)
	})
})

describe('validateAll', () => {
	it('returns results for all services', () => {
		const environments: EnvironmentData = {
			heimdall: {
				PORT: '3001',
				NODE_ENV: 'development',
				SECRET_KEY: 'abc',
				DATABASE_URL: 'postgresql://localhost/heimdall',
			},
			bifrost: {
				PORT: '3000',
				NODE_ENV: 'development',
				HEIMDALL_URL: 'http://localhost:3001',
				HEIMDALL_API_KEY: 'abc',
			},
		}

		const results = validateAll(environments, manifests)

		expect(results).toHaveLength(2)

		for (const result of results) {
			expect(result.service).toBeDefined()
			expect(['pass', 'warn', 'fail']).toContain(result.status)
		}
	})
})
