export interface Operation {
	operationId: string
	method: string
	path: string
	summary?: string
	description?: string
	parameters?: OperationParam[]
	hasRequestBody: boolean
}

export interface OperationParam {
	name: string
	in: 'query' | 'path' | 'header'
	required: boolean
}

export interface Provider {
	service: string
	url: string
	spec: string
	operations: Operation[]
	registeredAt: string
	lastSeen: string
}

const providers = new Map<string, Provider>()
const operationIndex = new Map<string, { service: string; operation: Operation }>()

export async function registerProvider(
	service: string,
	url: string,
	specUrl: string,
): Promise<number> {
	const now = new Date().toISOString()

	const existing = providers.get(service)

	if (existing) {
		for (const op of existing.operations) {
			operationIndex.delete(`${service}.${op.operationId}`)
		}
	}

	const operations = await fetchOperations(specUrl)

	providers.set(service, {
		service,
		url: url.replace(/\/$/, ''),
		spec: specUrl,
		operations,
		registeredAt: existing?.registeredAt ?? now,
		lastSeen: now,
	})

	for (const op of operations) {
		operationIndex.set(`${service}.${op.operationId}`, { service, operation: op })
	}

	return operations.length
}

export function unregisterProvider(service: string): boolean {
	const provider = providers.get(service)

	if (!provider) return false

	for (const op of provider.operations) {
		operationIndex.delete(`${service}.${op.operationId}`)
	}

	providers.delete(service)

	return true
}

/**
 * Look up an operation by intent name.
 * Intent format: `<service>.<operationId>` (e.g., `vidar.check-ip`)
 */
export function lookupOperation(
	intent: string,
): { provider: Provider; operation: Operation } | null {
	const entry = operationIndex.get(intent)

	if (!entry) return null

	const provider = providers.get(entry.service)

	if (!provider) return null

	return { provider, operation: entry.operation }
}

export function updateHeartbeat(service: string): boolean {
	const provider = providers.get(service)

	if (!provider) return false

	provider.lastSeen = new Date().toISOString()

	return true
}

export function getProviders(): Provider[] {
	return Array.from(providers.values())
}

export function getOperationIndex(): Record<
	string,
	{ service: string; method: string; path: string; summary?: string }
> {
	const result: Record<
		string,
		{ service: string; method: string; path: string; summary?: string }
	> = {}

	for (const [key, { service, operation }] of operationIndex) {
		result[key] = {
			service,
			method: operation.method,
			path: operation.path,
			summary: operation.summary,
		}
	}

	return result
}

export function resetRegistry(): void {
	providers.clear()
	operationIndex.clear()
}

// --- OpenAPI spec parsing ---

interface OpenAPISpec {
	paths?: Record<string, Record<string, OpenAPIOperation>>
}

interface OpenAPIOperation {
	operationId?: string
	summary?: string
	description?: string
	parameters?: Array<{
		name: string
		in: string
		required?: boolean
	}>
	requestBody?: unknown
}

async function fetchOperations(specUrl: string): Promise<Operation[]> {
	const res = await fetch(specUrl, { signal: AbortSignal.timeout(5000) })

	if (!res.ok) {
		throw new Error(`Failed to fetch OpenAPI spec from ${specUrl}: ${res.status}`)
	}

	const spec = (await res.json()) as OpenAPISpec
	const operations: Operation[] = []

	if (!spec.paths) return operations

	for (const [path, methods] of Object.entries(spec.paths)) {
		for (const [method, op] of Object.entries(methods)) {
			if (!op.operationId) continue

			if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
				operations.push({
					operationId: op.operationId,
					method: method.toUpperCase(),
					path,
					summary: op.summary,
					description: op.description,
					parameters: op.parameters?.map((p) => ({
						name: p.name,
						in: p.in as 'query' | 'path' | 'header',
						required: p.required ?? false,
					})),
					hasRequestBody: !!op.requestBody,
				})
			}
		}
	}

	return operations
}
