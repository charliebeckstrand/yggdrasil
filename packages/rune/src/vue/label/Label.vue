<template>
	<label :for="htmlFor" :class="labelVariants({ size, className: $attrs.class as string })">
		<slot />
	</label>
</template>

<script setup lang="ts">
import { labelVariants } from '../../label/variants.js'

defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		htmlFor?: string
		size?: 'small' | 'medium'
	}>(),
	{
		size: 'medium',
	},
)
</script>
