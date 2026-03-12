<template>
	<div class="w-full max-w-sm space-y-4">
		<h1 class="text-2xl font-semibold text-center">Create account</h1>

		<p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

		<div class="bg-white text-black border border-gray-200 rounded-lg p-4 shadow-sm">
			<form class="flex flex-col w-full gap-4" @submit.prevent="handleSubmit">
				<div class="flex flex-col gap-1.5">
					<label for="name" class="font-medium text-gray-700 text-sm">Name</label>

					<input
						id="name"
						v-model="name"
						type="text"
						name="name"
						placeholder="Jane Doe"
						required
						class="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
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

				<div class="flex flex-col gap-1.5">
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

				<div class="flex flex-col gap-1.5">
					<label for="confirmPassword" class="font-medium text-gray-700 text-sm">
						Confirm password
					</label>

					<input
						id="confirmPassword"
						v-model="confirmPassword"
						type="password"
						name="confirmPassword"
						placeholder="Confirm password"
						required
						class="flex w-full bg-white text-black outline-none placeholder:text-gray-400 transition-colors duration-150 ease-in-out border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black h-9 px-3 text-sm rounded-md"
					/>
				</div>

				<button
					type="submit"
					:disabled="submitting"
					class="inline-flex items-center justify-center outline-none font-medium whitespace-nowrap transition-colors duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 bg-black-500 text-white hover:bg-black-400 active:bg-black-600 h-9 px-3.5 text-sm rounded-md"
				>
					Create account
				</button>
			</form>
		</div>

		<p class="text-sm text-center text-gray-500">
			Already have an account?
			<RouterLink to="/login" class="text-blue hover:underline">Sign in</RouterLink>
		</p>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAuth } from '@/composables/useAuth'

const { error, submitting, register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

async function handleSubmit() {
	await register(name.value, email.value, password.value, confirmPassword.value)
}
</script>
