import { resolve } from 'node:path'
import { initEnvironments } from './init.js'

const args = process.argv.slice(2)
const rotateFlag = args.find((a) => a.startsWith('--rotate'))

let rotate: true | string[] | undefined

if (rotateFlag) {
	const match = rotateFlag.match(/^--rotate=(.+)$/)

	rotate = match ? match[1].split(',') : true
}

const rootDir = resolve(import.meta.dirname, '..', '..', '..')

initEnvironments({ rootDir, rotate })
