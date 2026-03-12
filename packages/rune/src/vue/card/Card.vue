<template>
	<div :class="cardVariants({ padding, shadow, className: $attrs.class as string })">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { cardVariants } from '../../card/variants.js'

defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		padding?: 'none' | 'small' | 'medium' | 'large'
		shadow?: 'none' | 'small' | 'medium'
	}>(),
	{
		padding: 'medium',
		shadow: 'none',
	},
)
</script>
