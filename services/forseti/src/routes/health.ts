import { createHealthRoute } from 'grid'
import { getChannels, getSubscriberCount } from '../lib/channels.js'
import { getProviders } from '../services/registry.js'

export const health = createHealthRoute({
	description: 'Returns the health status of the Forseti orchestrator',
	check: async () => ({
		providers: getProviders().length,
		connections: getSubscriberCount(),
		channels: getChannels().length,
	}),
})
