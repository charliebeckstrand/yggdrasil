import { ref } from 'vue'
import { useRouter } from 'vue-router'

export function useAuth() {
	const router = useRouter()
	const error = ref('')
	const submitting = ref(false)

	async function login(email: string, password: string) {
		error.value = ''
		submitting.value = true

		try {
			const res = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})

			if (res.ok) {
				router.push('/')

				return
			}

			const data = (await res.json().catch(() => ({}))) as { message?: string }

			error.value = data.message || 'Invalid email or password.'
		} catch {
			error.value = 'Something went wrong. Please try again.'
		} finally {
			submitting.value = false
		}
	}

	async function register(name: string, email: string, password: string, confirmPassword: string) {
		error.value = ''
		submitting.value = true

		if (password !== confirmPassword) {
			error.value = 'Passwords do not match.'
			submitting.value = false

			return
		}

		try {
			const res = await fetch('/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name }),
			})

			if (res.ok) {
				router.push('/login?registered=true')

				return
			}

			const data = (await res.json().catch(() => ({}))) as { code?: string }

			error.value =
				data.code === 'email_exists'
					? 'An account with that email already exists.'
					: 'Registration failed. Please try again.'
		} catch {
			error.value = 'Something went wrong. Please try again.'
		} finally {
			submitting.value = false
		}
	}

	async function logout() {
		await fetch('/auth/logout', { method: 'POST' }).catch(() => {})

		router.push('/login')
	}

	return { error, submitting, login, register, logout }
}
