import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { validationHook } from 'grid'
import { getIpAddress } from 'grid/middleware'
import { EmailSchema, PasswordSchema } from 'skuld'
import { handleRegisterUser } from '../handlers/register.js'
import { ErrorSchema } from '../lib/schemas.js'
import { requireSession, type SessionEnv } from '../middleware/session.js'

const CreateUserRequestSchema = z
	.object({
		email: EmailSchema,
		password: PasswordSchema,
		name: z.string().min(1).optional(),
	})
	.openapi('CreateUserRequest')

const UserResponseSchema = z
	.object({
		id: z.string(),
		email: z.string(),
	})
	.openapi('UserResponse')

const createUserRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Users'],
	summary: 'Create a new user account',
	description: '',
	request: {
		body: {
			content: { 'application/json': { schema: CreateUserRequestSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: UserResponseSchema } },
			description: 'User created',
		},
		400: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Validation error',
		},
		409: {
			content: { 'application/json': { schema: ErrorSchema } },
			description: 'Email already registered',
		},
	},
})

const usersRoutes = new OpenAPIHono<SessionEnv>({ defaultHook: validationHook })

usersRoutes.use('*', requireSession())

usersRoutes.openapi(createUserRoute, async (c) => {
	const { email, password } = c.req.valid('json')

	const ip = getIpAddress(c)

	return handleRegisterUser(c, email, password, ip)
})

export { usersRoutes }
