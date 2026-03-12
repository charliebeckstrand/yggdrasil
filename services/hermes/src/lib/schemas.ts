import { CircuitBreakerStateSchema, HealthStatusSchema, ServiceReachabilitySchema } from 'skuld'
import { z } from 'zod'

export {
	BanListSchema,
	BanSchema,
	CheckIpResponseSchema,
	CreateBanSchema,
	ErrorSchema,
	IngestEventSchema,
	MessageSchema,
	SecurityEventSchema,
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
			vidar: ServiceStatusSchema,
		}),
		circuitBreakers: z.object({
			vidar: CircuitBreakerStatusSchema,
		}),
	})
	.openapi('AggregateHealth')
