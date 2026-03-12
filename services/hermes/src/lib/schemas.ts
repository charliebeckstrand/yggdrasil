import { CircuitBreakerStateSchema, HealthStatusSchema, ServiceReachabilitySchema } from 'skuld'
import { z } from 'zod'

export {
	BanListSchema,
	BanSchema,
	CheckIpResponseSchema,
	CreateBanSchema,
	CreateSubscriptionSchema,
	ErrorSchema,
	EventSchema,
	IngestEventSchema,
	MessageSchema,
	PublishEventSchema,
	SecurityEventSchema,
	SubscriptionListSchema,
	SubscriptionSchema,
} from 'skuld'

export const ServiceStatusSchema = z
	.object({
		status: ServiceReachabilitySchema,
		latency: z.number().optional(),
	})
	.openapi('ServiceStatus')

export const CircuitBreakerStatusSchema = z
	.object({
		state: CircuitBreakerStateSchema,
		failures: z.number(),
	})
	.openapi('CircuitBreakerStatus')

export const AggregateHealthSchema = z
	.object({
		status: HealthStatusSchema,
		version: z.string(),
		uptime: z.number(),
		services: z.object({
			huginn: ServiceStatusSchema,
			vidar: ServiceStatusSchema,
		}),
		circuitBreakers: z.object({
			huginn: CircuitBreakerStatusSchema,
			vidar: CircuitBreakerStatusSchema,
		}),
	})
	.openapi('AggregateHealth')
