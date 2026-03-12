<template>
	<input
		:type="inputType ?? 'text'"
		:class="inputVariants({ type, size, className: $attrs.class as string })"
		:disabled
		v-bind="$attrs"
	/>
</template>

<script setup lang="ts">
import type { Size } from '../../types/index.js'

import { inputVariants } from '../../input/variants.js'

defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		type?: 'default' | 'error' | 'success'
		inputType?: string
		size?: Exclude<Size, 'tiny'>
		disabled?: boolean
	}>(),
	{
		type: 'default',
		size: 'medium',
		disabled: false,
	},
)
</script>
