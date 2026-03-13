import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
	const { logout } = useAuth()

	return (
		<div className="text-center space-y-4">
			<h1 className="text-3xl font-semibold">Welcome</h1>

			<p className="text-gray-600">You are signed in.</p>

			<button
				type="button"
				className="inline-block px-4 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-700"
				onClick={logout}
			>
				Sign out
			</button>
		</div>
	)
}
