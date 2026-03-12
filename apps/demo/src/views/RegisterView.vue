<template>
	<div class="w-full max-w-sm space-y-4">
		<h1 class="text-2xl font-semibold text-center">Create account</h1>

		<p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

		<RegisterForm
			v-model:name="name"
			v-model:email="email"
			v-model:password="password"
			v-model:confirm-password="confirmPassword"
			:disabled="submitting"
			@submit.prevent="handleSubmit"
		/>

		<p class="text-sm text-center text-gray-500">
			Already have an account?
			<RouterLink to="/login" class="text-blue hover:underline">Sign in</RouterLink>
		</p>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { RegisterForm } from 'rune/vue'

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
