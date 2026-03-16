import { randomUUID } from 'node:crypto'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { validationHook } from 'grid'
import { ErrorSchema } from 'skuld'
import { verifyToken } from '../auth/jwt.js'
import { createChatRepository } from '../lib/chat-repository.js'
import { requireSession, type SessionEnv } from '../middleware/session.js'

const chatRepository = createChatRepository()

const AgentMessageRequestSchema = z
	.object({
		chatId: z.string().uuid(),
		content: z.string().min(1),
	})
	.openapi('AgentMessageRequest')

const AgentMessageResponseSchema = z
	.object({
		id: z.string(),
		chat_id: z.string(),
		role: z.enum(['user', 'agent']),
		type: z.string(),
		content: z.string(),
		created_at: z.string(),
	})
	.openapi('AgentMessageResponse')

const agentRoute = createRoute({
	method: 'post',
	path: '/agent',
	tags: ['Chat'],
	summary: 'Send a message to the chat agent',
	request: {
		body: {
			content: { 'application/json': { schema: AgentMessageRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: AgentMessageResponseSchema } },
			description: 'Agent response message',
		},
		400: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Validation error',
		},
	},
})

async function getUserId(c: {
	get: (key: 'session') => { accessToken: string } | null
}): Promise<string> {
	const session = c.get('session')

	if (!session) throw new Error('No session')

	const payload = await verifyToken(session.accessToken)

	return payload.sub as string
}

const chatAgentRoutes = new OpenAPIHono<SessionEnv>({ defaultHook: validationHook })

chatAgentRoutes.use('*', requireSession())

chatAgentRoutes.openapi(agentRoute, async (c) => {
	const { chatId, content } = c.req.valid('json')
	const userId = await getUserId(c)

	const existingChat = await chatRepository.getChatById(chatId, userId)

	if (!existingChat) {
		await chatRepository.insertChat(chatId, userId)
	}

	// TODO: Replace with real agent/LLM call
	const agentReply = `You said: ${content}`

	const message = await chatRepository.insertMessage(
		randomUUID(),
		chatId,
		'agent',
		'text',
		agentReply,
	)

	return c.json(message, 200)
})

export { chatAgentRoutes }
