# heimdall

Database-agnostic authentication library for Yggdrasil services. Handles JWT token management, Argon2id password hashing, and user credential verification. Heimdall is decoupled from any specific database or HTTP framework — consumers provide a `UserRepository` implementation, and Heimdall handles the rest. Failed login attempts and new registrations are surfaced through a pluggable security event callback.

## configure

Singleton setup that must be called once at application startup before any other Heimdall function. Accepts a config object with the following properties:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `userRepository` | `UserRepository` | Yes | Implementation of the database operations Heimdall needs |
| `secretKey` | `string` | Yes | HS256 signing key (minimum 32 characters) |
| `apiKey` | `string` | No | API key for service-to-service auth |
| `onSecurityEvent` | `(event) => void` | No | Callback fired on `login_failed` and `registration` events |

```typescript
import { configure } from 'heimdall'

configure({
  userRepository: createUserRepository(),
  secretKey: env.SECRET_KEY,
  apiKey: env.HEIMDALL_API_KEY,
  onSecurityEvent: (event) =>
    reportEvent(event.type, event.ip, event.details ?? {}, 'heimdall'),
})
```

## authenticateUser

```typescript
authenticateUser(email: string, password: string, ip?: string): Promise<TokenPair>
```

Normalizes the email, fetches credentials from the repository, and verifies the password with Argon2id. On success, returns an access/refresh token pair. On failure, throws `AuthError('invalid_credentials')` and fires a `login_failed` security event if an IP was provided.

A pre-computed dummy hash ensures Argon2 always runs — even when the email doesn't exist — to prevent timing-based email enumeration.

## registerUser

```typescript
registerUser(email: string, password: string, ip?: string): Promise<UserRow>
```

Hashes the password with Argon2id, generates a UUID, and inserts the user via the repository. Returns the created `UserRow`. If the email is already taken (PostgreSQL unique constraint violation), throws `AuthError('email_exists')`. Fires a `registration` security event if an IP was provided.

## verifyAccessToken

```typescript
verifyAccessToken(token: string): Promise<UserRow>
```

Verifies the JWT signature and expiry, confirms the token type is `access`, fetches the user from the repository, and checks that the account is active. Returns the `UserRow` on success, throws `AuthError('invalid_token')` on any failure.

## refreshTokenPair

```typescript
refreshTokenPair(refreshToken: string): Promise<TokenPair>
```

Verifies a refresh token and issues a fresh access/refresh pair. The original refresh token is not revoked — stateless rotation. Throws `AuthError('invalid_token')` if the token is invalid, expired, not a refresh token, or the user is inactive.

## AuthError

Custom error class thrown by all authentication functions. The `code` property identifies the failure:

| Code | Meaning |
| --- | --- |
| `invalid_credentials` | Wrong email or password |
| `account_inactive` | User account has been deactivated |
| `email_exists` | Registration attempted with a taken email |
| `invalid_token` | Token is missing, expired, malformed, or wrong type |

## UserRepository

Interface that consumers must implement to connect Heimdall to their database:

```typescript
interface UserRepository {
  insertUser(id: string, email: string, hashedPassword: string): Promise<UserRow>
  getCredentialsByEmail(email: string): Promise<CredentialsRow | null>
  getUserById(id: string): Promise<UserRow | null>
}
```

## Tokens

All tokens are signed with HS256 and include a `jti` (unique JWT ID) for audit trails.

| Type | Expiry | Usage |
| --- | --- | --- |
| `access` | 30 minutes | Authenticate API requests |
| `refresh` | 7 days | Obtain a new token pair without re-entering credentials |
