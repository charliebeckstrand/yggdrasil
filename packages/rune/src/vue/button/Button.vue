<template>
	<button :class="buttonVariants({ type, size, className: $attrs.class as string })" :disabled>
		<slot />
	</button>
</template>

<script setup lang="ts">
import { buttonVariants } from '../../button/variants.js'

import type { Size, Type } from '../../types/index.js'

defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		type?: Type
		size?: Size
		disabled?: boolean
	}>(),
	{
		type: 'default',
		size: 'medium',
		disabled: false,
	},
)
</script>
