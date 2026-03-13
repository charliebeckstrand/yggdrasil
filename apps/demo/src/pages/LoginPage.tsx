import type { FormEvent } from 'react'

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
	const [searchParams] = useSearchParams()
	const { error, submitting, login } = useAuth()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const registered = searchParams.get('registered') === 'true'

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()

		await login(email, password)
	}

	return (
		<div className="w-full max-w-sm space-y-4">
			<h1 className="text-2xl font-semibold text-center">Sign in</h1>

			{registered && (
				<p className="text-sm text-green-600 text-center">
					Account created successfully. Please sign in.
				</p>
			)}

			{error && <p className="text-sm text-red-600 text-center">{error}</p>}

			<div className="bg-white text-black border border-gray-200 rounded-lg p-4">
				<form className="flex flex-col w-full gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<label htmlFor="email" className="font-medium text-gray-700 text-sm">
							Email
						</label>

						<input
							id="email"
							type="email"
							name="email"
							placeholder="you@example.com"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label htmlFor="password" className="font-medium text-gray-700 text-sm">
							Password
						</label>

						<input
							id="password"
							type="password"
							name="password"
							placeholder="Password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
						/>
					</div>

					<button
						type="submit"
						disabled={submitting}
						className="inline-flex items-center justify-center outline-none font-medium whitespace-nowrap transition-colors duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 bg-black-500 text-white hover:bg-black-400 active:bg-black-600 h-9 px-3.5 text-sm rounded-md"
					>
						Sign in
					</button>
				</form>
			</div>

			<p className="text-sm text-center text-gray-500">
				Don't have an account?{' '}
				<Link to="/register" className="text-blue hover:underline">
					Create one
				</Link>
			</p>
		</div>
	)
}
