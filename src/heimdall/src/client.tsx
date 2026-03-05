"use client"

import { createContext, useContext, type ReactNode } from "react"

export interface AuthContext {
	/** Whether the user has an active session. */
	authenticated: boolean
}

const Context = createContext<AuthContext>({ authenticated: false })

export function AuthProvider({
	authenticated,
	children,
}: {
	authenticated: boolean
	children: ReactNode
}) {
	return <Context value={{ authenticated }}>{children}</Context>
}

export function useAuth(): AuthContext {
	return useContext(Context)
}
