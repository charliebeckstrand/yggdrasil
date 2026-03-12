import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import { formVariants } from './variants.js'

export const Form = defineComponent({
	name: 'RuneForm',
	inheritAttrs: false,

	props: {
		action: { type: String, default: undefined },
		method: {
			type: String as PropType<'get' | 'post' | 'dialog'>,
			default: undefined,
		},
		spacing: {
			type: String as PropType<'compact' | 'default' | 'relaxed'>,
			default: undefined,
		},
		class: { type: String, default: undefined },
	},

	setup(props, { slots }) {
		return () =>
			h(
				'form',
				{
					action: props.action,
					method: props.method,
					class: formVariants({
						spacing: props.spacing,
						className: props.class,
					}),
				},
				slots.default?.(),
			)
	},
})
