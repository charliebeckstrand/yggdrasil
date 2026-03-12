<template>
	<form
		:action
		:method
		:class="formVariants({ spacing, className: $attrs.class as string })"
		v-bind="$attrs"
	>
		<slot />
	</form>
</template>

<script setup lang="ts">
import { formVariants } from '../../form/variants.js'

defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		action?: string
		method?: 'get' | 'post' | 'dialog'
		spacing?: 'compact' | 'default' | 'relaxed'
	}>(),
	{
		spacing: 'default',
	},
)
</script>
