import { z } from 'zod'
import { createEnvironment, getManifestPort } from '../environment.js'

describe('getManifestPort', () => {
	it('throws when manifest.json is not found in packages', () => {
		expect(() => getManifestPort()).toThrow('manifest.json not found')
	})
})

describe('createEnvironment', () => {
	it('returns a function that parses base environment', () => {
		vi.stubEnv('PORT', '4000')
		vi.stubEnv('NODE_ENV', 'test')

		const env = createEnvironment()

		const result = env()

		expect(result.PORT).toBe(4000)
		expect(result.NODE_ENV).toBe('test')

		vi.unstubAllEnvs()
	})

	it('coerces PORT from string to number', () => {
		vi.stubEnv('PORT', '9999')

		const env = createEnvironment()

		expect(env().PORT).toBe(9999)

		vi.unstubAllEnvs()
	})

	it('defaults NODE_ENV to development', () => {
		vi.stubEnv('PORT', '3000')

		delete process.env.NODE_ENV

		const env = createEnvironment()

		expect(env().NODE_ENV).toBe('development')

		vi.unstubAllEnvs()
	})

	it('caches the result after first call', () => {
		vi.stubEnv('PORT', '3000')
		vi.stubEnv('NODE_ENV', 'test')

		const env = createEnvironment()

		const first = env()
		const second = env()

		expect(first).toBe(second)

		vi.unstubAllEnvs()
	})

	it('extends with extra Zod schema fields', () => {
		vi.stubEnv('PORT', '3000')
		vi.stubEnv('NODE_ENV', 'test')
		vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/test')

		const env = createEnvironment({
			DATABASE_URL: z.string(),
		})

		const result = env()

		expect(result.DATABASE_URL).toBe('postgres://localhost:5432/test')
		expect(result.PORT).toBe(3000)

		vi.unstubAllEnvs()
	})

	it('treats empty strings as undefined for optional fields', () => {
		vi.stubEnv('PORT', '3000')
		vi.stubEnv('NODE_ENV', 'test')
		vi.stubEnv('OPTIONAL_VAR', '')

		const env = createEnvironment({
			OPTIONAL_VAR: z.string().optional(),
		})

		const result = env()

		expect(result.OPTIONAL_VAR).toBeUndefined()

		vi.unstubAllEnvs()
	})

	it('exits process on invalid environment', () => {
		vi.stubEnv('PORT', '3000')
		vi.stubEnv('NODE_ENV', 'invalid-value')

		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

		const env = createEnvironment()

		env()

		expect(exitSpy).toHaveBeenCalledWith(1)

		exitSpy.mockRestore()

		vi.unstubAllEnvs()
	})
})
