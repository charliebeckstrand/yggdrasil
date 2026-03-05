import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export type AuthUser = {
	id: string;
	email: string;
	roles: string[];
};

type AuthEnv = {
	Variables: {
		user: AuthUser;
	};
};

/**
 * Authentication middleware that validates requests against Ironclad.
 *
 * Expects a Bearer token in the Authorization header and verifies it
 * with the Ironclad auth service. On success, sets `c.get("user")`.
 *
 * TODO: Wire up to Ironclad service once available.
 */
export function auth(): MiddlewareHandler<AuthEnv> {
	return async (c: Context<AuthEnv>, next) => {
		const authorization = c.req.header("Authorization");

		if (!authorization?.startsWith("Bearer ")) {
			throw new HTTPException(401, { message: "Missing or invalid authorization header" });
		}

		const token = authorization.slice(7);

		if (!token) {
			throw new HTTPException(401, { message: "Invalid token" });
		}

		// TODO: Replace with actual Ironclad verification
		// const ironcladUrl = process.env.IRONCLAD_URL;
		// const response = await fetch(`${ironcladUrl}/verify`, {
		//   method: "POST",
		//   headers: { "Content-Type": "application/json" },
		//   body: JSON.stringify({ token }),
		// });

		c.set("user", {
			id: "placeholder-user-id",
			email: "user@example.com",
			roles: ["user"],
		});

		await next();
	};
}

/**
 * Role-based authorization middleware.
 * Use after `auth()` to restrict access to specific roles.
 */
export function requireRole(...roles: string[]): MiddlewareHandler<AuthEnv> {
	return async (c: Context<AuthEnv>, next) => {
		const user = c.get("user");

		if (!user) {
			throw new HTTPException(401, { message: "Not authenticated" });
		}

		const hasRole = roles.some((role) => user.roles.includes(role));

		if (!hasRole) {
			throw new HTTPException(403, {
				message: `Insufficient permissions. Required: ${roles.join(", ")}`,
			});
		}

		await next();
	};
}
