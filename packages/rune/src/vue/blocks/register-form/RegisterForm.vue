<template>
	<Card padding="medium" shadow="small">
		<Form :action :method="method ?? 'post'" @submit="$emit('submit', $event)">
			<div class="flex flex-col gap-1.5">
				<Label html-for="name">Name</Label>

				<Input
					input-type="text"
					name="name"
					id="name"
					placeholder="Jane Doe"
					required
					:value="name"
					@input="$emit('update:name', ($event.target as any).value)"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
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

			<div class="flex flex-col gap-1.5">
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

			<div class="flex flex-col gap-1.5">
				<Label html-for="confirmPassword">Confirm password</Label>

				<Input
					input-type="password"
					name="confirmPassword"
					id="confirmPassword"
					placeholder="Confirm password"
					required
					:value="confirmPassword"
					@input="
						$emit('update:confirmPassword', ($event.target as any).value)
					"
				/>
			</div>

			<Button type="default" size="medium" :disabled>Create account</Button>
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
		name?: string
		email?: string
		password?: string
		confirmPassword?: string
		disabled?: boolean
	}>(),
	{
		method: 'post',
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		disabled: false,
	},
)

defineEmits<{
	submit: [event: Event]
	'update:name': [value: string]
	'update:email': [value: string]
	'update:password': [value: string]
	'update:confirmPassword': [value: string]
}>()
</script>
