import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { openApiConfig } from "./lib/openapi.js";
import { requestLogger } from "./middleware/logger.js";
import { health } from "./routes/health.js";
import { users } from "./routes/users.js";

export function createApp() {
	const app = new OpenAPIHono();

	// --- Global middleware ---
	app.use("*", cors());
	app.use("*", requestLogger());

	// --- Routes ---
	app.route("/", health);
	app.route("/", users);

	// --- OpenAPI spec endpoint ---
	app.doc("/openapi.json", openApiConfig);

	// --- Swagger UI ---
	app.get(
		"/docs",
		swaggerUI({
			url: "/openapi.json",
		}),
	);

	// --- Global error handler ---
	app.onError((err, c) => {
		console.error(`Unhandled error: ${err.message}`, err.stack);
		const status = "status" in err ? (err.status as number) : 500;
		return c.json(
			{
				error: err.name,
				message: err.message,
				statusCode: status,
			},
			status as 400 | 500,
		);
	});

	// --- 404 handler ---
	app.notFound((c) => {
		return c.json(
			{
				error: "Not Found",
				message: `Route ${c.req.method} ${c.req.path} not found`,
				statusCode: 404,
			},
			404,
		);
	});

	return app;
}
