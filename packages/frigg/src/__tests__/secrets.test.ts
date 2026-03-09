import { describe, expect, it } from 'vitest'
import { generateSecrets } from '../secrets.js'
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

describe('generateSecrets', () => {
	it('generates secrets for vars with type secret', () => {
		const result = generateSecrets(manifests, {})

		expect(result['heimdall:SECRET_KEY']).toBeDefined()
		expect(result['heimdall:SECRET_KEY']).toHaveLength(64) // 32 bytes hex
		expect(result['heimdall:HEIMDALL_API_KEY']).toBeDefined()
		expect(result['bifrost:SESSION_SECRET']).toBeDefined()
	})

	it('preserves existing secrets', () => {
		const existing = { 'heimdall:SECRET_KEY': 'existing-secret' }
		const result = generateSecrets(manifests, existing)

		expect(result['heimdall:SECRET_KEY']).toBe('existing-secret')
		expect(result['heimdall:HEIMDALL_API_KEY']).toBeDefined()
	})

	it('does not generate secrets for non-secret vars', () => {
		const result = generateSecrets(manifests, {})

		expect(result['heimdall:DATABASE_URL']).toBeUndefined()
		expect(result['bifrost:HEIMDALL_URL']).toBeUndefined()
	})

	it('rotates all secrets when rotate is true', () => {
		const existing = {
			'heimdall:SECRET_KEY': 'old-1',
			'heimdall:HEIMDALL_API_KEY': 'old-2',
			'bifrost:SESSION_SECRET': 'old-3',
		}

		const result = generateSecrets(manifests, existing, { rotate: true })

		expect(result['heimdall:SECRET_KEY']).not.toBe('old-1')
		expect(result['heimdall:HEIMDALL_API_KEY']).not.toBe('old-2')
		expect(result['bifrost:SESSION_SECRET']).not.toBe('old-3')
	})

	it('rotates specific secrets by key name', () => {
		const existing = {
			'heimdall:SECRET_KEY': 'old-1',
			'heimdall:HEIMDALL_API_KEY': 'old-2',
			'bifrost:SESSION_SECRET': 'old-3',
		}

		const result = generateSecrets(manifests, existing, { rotate: ['SECRET_KEY'] })

		expect(result['heimdall:SECRET_KEY']).not.toBe('old-1')
		expect(result['heimdall:HEIMDALL_API_KEY']).toBe('old-2')
		expect(result['bifrost:SESSION_SECRET']).toBe('old-3')
	})
})
