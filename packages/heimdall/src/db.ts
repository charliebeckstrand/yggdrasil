import { createDb as createMimirDb } from 'mimir'
import { getConfig } from './config.js'

export function creatDb() {
	return createMimirDb(getConfig().getPool())
}
