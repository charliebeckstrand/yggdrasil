<template>
	<div class="w-full max-w-sm space-y-4">
		<h1 class="text-2xl font-semibold text-center">Sign in</h1>

		<p v-if="registered" class="text-sm text-green-600 text-center">
			Account created successfully. Please sign in.
		</p>

		<p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

		<LoginForm
			v-model:email="email"
			v-model:password="password"
			:disabled="submitting"
			@submit.prevent="handleSubmit"
		/>

		<p class="text-sm text-center text-gray-500">
			Don't have an account?
			<RouterLink to="/register" class="text-blue hover:underline">Create one</RouterLink>
		</p>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { LoginForm } from 'rune/vue'

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
