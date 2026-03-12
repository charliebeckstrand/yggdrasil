<template>
	<div class="w-full max-w-sm space-y-4">
		<h1 class="text-2xl font-semibold text-center">Sign in</h1>

		<p v-if="registered" class="text-sm text-green-600 text-center">
			Account created successfully. Please sign in.
		</p>

		<p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

		<div class="bg-white text-black border border-gray-200 rounded-lg p-4">
			<form class="flex flex-col w-full gap-4" @submit.prevent="handleSubmit">
				<div class="flex flex-col gap-2">
					<label for="email" class="font-medium text-gray-700 text-sm">Email</label>

					<input
						id="email"
						v-model="email"
						type="email"
						name="email"
						placeholder="you@example.com"
						required
						class="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label for="password" class="font-medium text-gray-700 text-sm">Password</label>

					<input
						id="password"
						v-model="password"
						type="password"
						name="password"
						placeholder="Password"
						required
						class="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
					/>
				</div>

				<button
					type="submit"
					:disabled="submitting"
					class="inline-flex items-center justify-center outline-none font-medium whitespace-nowrap transition-colors duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 bg-black-500 text-white hover:bg-black-400 active:bg-black-600 h-9 px-3.5 text-sm rounded-md"
				>
					Sign in
				</button>
			</form>
		</div>

		<p class="text-sm text-center text-gray-500">
			Don't have an account?
			<RouterLink to="/register" class="text-blue hover:underline">Create one</RouterLink>
		</p>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { error, submitting, login } = useAuth()

const email = ref('')
const password = ref('')
const registered = ref(route.query.registered === 'true')

async function handleSubmit() {
	await login(email.value, password.value)
}
</script>
