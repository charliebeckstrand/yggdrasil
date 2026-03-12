import { createHealthRoute } from 'grid'

import { getEmitter } from '../lib/emitter.js'

export const health = createHealthRoute({
	description: 'Returns the health status of the Hermes messaging service',
	check: async () => ({
		subscribers: getEmitter().listenerCount('message'),
	}),
})
