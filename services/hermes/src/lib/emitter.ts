import { EventEmitter } from 'node:events'

export interface HermesMessage {
	id: string
	topic: string
	payload: Record<string, unknown>
	source: string
	timestamp: string
}

const emitter = new EventEmitter()

emitter.setMaxListeners(100)

export function getEmitter(): EventEmitter {
	return emitter
}

let messageCounter = 0

export function createMessageId(): string {
	messageCounter++

	return `msg_${Date.now()}_${messageCounter}`
}
