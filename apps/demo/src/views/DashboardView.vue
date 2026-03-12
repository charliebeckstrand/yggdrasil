<template>
	<div class="text-center space-y-4">
		<h1 class="text-3xl font-semibold">Welcome</h1>

		<p class="text-gray-600">You are signed in.</p>

		<button
			class="inline-block px-4 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-700"
			@click="logout"
		>
			Sign out
		</button>
	</div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()
</script>
