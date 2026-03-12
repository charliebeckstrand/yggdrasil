<template>
	<Card>
		<Form :action :method="method ?? 'post'" @submit="$emit('submit', $event)">
			<div class="flex flex-col gap-2">
				<Label html-for="email">Email</Label>

				<Input
					input-type="email"
					name="email"
					id="email"
					placeholder="you@example.com"
					required
					:value="email"
					@input="$emit('update:email', ($event.target as any).value)"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<Label html-for="password">Password</Label>

				<Input
					input-type="password"
					name="password"
					id="password"
					placeholder="Password"
					required
					:value="password"
					@input="$emit('update:password', ($event.target as any).value)"
				/>
			</div>

			<Button type="default" size="medium" :disabled>Sign in</Button>
		</Form>
	</Card>
</template>

<script setup lang="ts">
import { Button } from '../../button/index.js'
import { Card } from '../../card/index.js'
import { Form } from '../../form/index.js'
import { Input } from '../../input/index.js'
import { Label } from '../../label/index.js'

withDefaults(
	defineProps<{
		action?: string
		method?: 'get' | 'post' | 'dialog'
		email?: string
		password?: string
		disabled?: boolean
	}>(),
	{
		method: 'post',
		email: '',
		password: '',
		disabled: false,
	},
)

defineEmits<{
	submit: [event: Event]
	'update:email': [value: string]
	'update:password': [value: string]
}>()
</script>
