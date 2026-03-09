export interface VarConfig {
	type: 'value' | 'secret' | 'ref'
	default?: string
	service?: string
	key?: string
}

export interface ServiceManifest {
	name: string
	port: number
	vars: Record<string, VarConfig>
}

export type ManifestData = Record<string, ServiceManifest>

export type EnvironmentData = Record<string, Record<string, string>>

export interface Issue {
	level: 'error' | 'warning'
	message: string
}
