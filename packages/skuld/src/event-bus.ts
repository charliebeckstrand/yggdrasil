import { z } from '@hono/zod-openapi'
import { createListSchema } from './composites.js'
import {
	CallbackUrlSchema,
	IdSchema,
	PayloadSchema,
	ServiceNameSchema,
	TimestampSchema,
	TopicSchema,
} from './primitives.js'

export const PublishEventSchema = z
	.object({
		topic: TopicSchema,
		payload: PayloadSchema,
		source: ServiceNameSchema,
	})
	.openapi('PublishEvent')

export const EventSchema = z
	.object({
		id: IdSchema,
		topic: z.string(),
		payload: z.record(z.string(), z.unknown()),
		source: z.string(),
		created_at: TimestampSchema,
	})
	.openapi('Event')

export const CreateSubscriptionSchema = z
	.object({
		topic: TopicSchema,
		callback_url: CallbackUrlSchema,
		service: ServiceNameSchema,
	})
	.openapi('CreateSubscription')

export const SubscriptionSchema = z
	.object({
		id: IdSchema,
		topic: z.string(),
		callback_url: z.url(),
		service: z.string(),
		is_active: z.boolean(),
		created_at: TimestampSchema,
		updated_at: TimestampSchema,
	})
	.openapi('Subscription')

export const SubscriptionListSchema = createListSchema(SubscriptionSchema, 'SubscriptionList')
