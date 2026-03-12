import { installMatchers } from './matchers/index.js'

/**
 * Vitest setup file that installs all custom matchers.
 *
 * Add to your vitest config:
 * ```ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['vali/setup'],
 *   },
 * })
 * ```
 */
installMatchers()
