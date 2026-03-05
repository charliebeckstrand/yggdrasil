import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("Health route", () => {
	it("GET /health returns healthy status", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);

		const body = (await res.json()) as Record<string, unknown>;
		expect(body.status).toBe("healthy");
		expect(body.version).toBe("0.1.0");
		expect(body.uptime).toBeTypeOf("number");
		expect(body.services).toBeDefined();
	});
});

describe("OpenAPI", () => {
	it("GET /openapi.json returns the spec", async () => {
		const res = await app.request("/openapi.json");
		expect(res.status).toBe(200);

		const spec = (await res.json()) as Record<string, unknown>;
		expect(spec.openapi).toBe("3.0.0");
		expect((spec.info as Record<string, unknown>).title).toBe("Bifrost API Gateway");
		expect((spec.paths as Record<string, unknown>)["/health"]).toBeDefined();
		expect((spec.paths as Record<string, unknown>)["/users"]).toBeDefined();
	});

	it("GET /docs returns Swagger UI HTML", async () => {
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toContain("swagger-ui");
	});
});

describe("Error handling", () => {
	it("returns 404 for unknown routes", async () => {
		const res = await app.request("/unknown");
		expect(res.status).toBe(404);

		const body = (await res.json()) as Record<string, unknown>;
		expect(body.error).toBe("Not Found");
	});
});
