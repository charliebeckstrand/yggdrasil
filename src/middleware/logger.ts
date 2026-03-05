import type { MiddlewareHandler } from "hono";

export function requestLogger(): MiddlewareHandler {
	return async (c, next) => {
		const start = performance.now();
		const method = c.req.method;
		const path = c.req.path;

		await next();

		const duration = (performance.now() - start).toFixed(2);
		const status = c.res.status;
		console.log(`${method} ${path} ${status} ${duration}ms`);
	};
}
