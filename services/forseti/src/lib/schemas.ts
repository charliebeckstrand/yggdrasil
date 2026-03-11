import { z } from 'zod'

export { ErrorSchema, MessageSchema } from 'grid'

export const RegisterSchema = z
	.object({
		service: z.string().min(1).max(100).openapi({ description: 'Service name', example: 'vidar' }),
		url: z
			.string()
			.url()
			.openapi({ description: 'Service base URL', example: 'http://localhost:3003' }),
		spec: z.string().url().openapi({
			description: 'OpenAPI spec URL — Forseti fetches this to discover operations',
			example: 'http://localhost:3003/vidar/openapi.json',
		}),
	})
	.openapi('Register')

export const ResolveRequestSchema = z
	.object({
		intent: z.string().min(1).max(200).openapi({
			description: 'Operation to resolve as <service>.<operationId>',
			example: 'vidar.check-ip',
		}),
		payload: z
			.record(z.string(), z.unknown())
			.default({})
			.openapi({ description: 'Intent payload', example: { ip: '192.168.1.1' } }),
	})
	.openapi('ResolveRequest')

export const ResolveResponseSchema = z
	.object({
		resolved: z.boolean().openapi({ description: 'Whether the intent was resolved' }),
		intent: z.string().openapi({ description: 'The intent that was resolved' }),
		provider: z.string().optional().openapi({ description: 'Service that handled the intent' }),
		data: z.unknown().optional().openapi({ description: 'Response data from provider' }),
		error: z.string().optional().openapi({ description: 'Error message if resolution failed' }),
		duration: z.number().openapi({ description: 'Resolution time in ms' }),
	})
	.openapi('ResolveResponse')

export const DeclareRequestSchema = z
	.object({
		intent: z.string().min(1).max(200).openapi({
			description: 'Operation to declare as <service>.<operationId>',
			example: 'vidar.ingest-event',
		}),
		payload: z
			.record(z.string(), z.unknown())
			.default({})
			.openapi({ description: 'Intent payload' }),
		callback: z
			.string()
			.url()
			.optional()
			.openapi({ description: 'Callback URL for async result delivery' }),
	})
	.openapi('DeclareRequest')

export const DeclareResponseSchema = z
	.object({
		accepted: z.boolean().openapi({ description: 'Whether the intent was accepted' }),
		intent: z.string().openapi({ description: 'The declared intent' }),
		id: z.string().openapi({ description: 'Unique declaration ID for tracking' }),
	})
	.openapi('DeclareResponse')

export const HeartbeatSchema = z
	.object({
		service: z.string().min(1).max(100).openapi({ description: 'Service name', example: 'vidar' }),
	})
	.openapi('Heartbeat')

export const OperationSchema = z
	.object({
		operationId: z.string(),
		method: z.string(),
		path: z.string(),
		summary: z.string().optional(),
	})
	.openapi('Operation')

export const ProviderSchema = z
	.object({
		service: z.string(),
		url: z.string(),
		spec: z.string(),
		operations: z.array(OperationSchema),
		registeredAt: z.string(),
		lastSeen: z.string(),
	})
	.openapi('Provider')

export const RegistrySchema = z
	.object({
		providers: z.array(ProviderSchema),
		operations: z.record(
			z.string(),
			z.object({ service: z.string(), method: z.string(), path: z.string() }),
		),
	})
	.openapi('Registry')

export const LogEntrySchema = z
	.object({
		id: z.string(),
		intent: z.string(),
		provider: z.string().nullable(),
		resolved: z.boolean(),
		duration: z.number(),
		error: z.string().optional(),
		timestamp: z.string(),
	})
	.openapi('LogEntry')

export const LogSchema = z
	.object({
		entries: z.array(LogEntrySchema),
		total: z.number(),
	})
	.openapi('Log')

export const SendMessageSchema = z
	.object({
		channel: z
			.string()
			.min(1)
			.max(255)
			.openapi({ description: 'Target channel name', example: 'user.notifications' }),
		data: z.record(z.string(), z.unknown()).default({}).openapi({ description: 'Message payload' }),
		source: z
			.string()
			.min(1)
			.max(100)
			.optional()
			.openapi({ description: 'Originating service', example: 'bifrost' }),
	})
	.openapi('SendMessage')

export const SendResultSchema = z
	.object({
		message: z.string(),
		channel: z.string(),
		recipients: z.number(),
	})
	.openapi('SendResult')

export const BroadcastMessageSchema = z
	.object({
		data: z
			.record(z.string(), z.unknown())
			.default({})
			.openapi({ description: 'Broadcast payload' }),
		source: z.string().min(1).max(100).optional().openapi({ description: 'Originating service' }),
	})
	.openapi('BroadcastMessage')

export const BroadcastResultSchema = z
	.object({
		message: z.string(),
		recipients: z.number(),
	})
	.openapi('BroadcastResult')

export const ChannelInfoSchema = z
	.object({
		channel: z.string(),
		subscribers: z.number(),
	})
	.openapi('ChannelInfo')

export const ChannelListSchema = z
	.object({
		data: z.array(ChannelInfoSchema),
		total: z.number(),
	})
	.openapi('ChannelList')
