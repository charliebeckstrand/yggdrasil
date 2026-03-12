import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import type { Size, Type } from '../types/index.js'

import { buttonVariants } from './variants.js'

export const Button = defineComponent({
	name: 'RuneButton',
	inheritAttrs: false,

	props: {
		type: { type: String as PropType<Type>, default: undefined },
		size: { type: String as PropType<Size>, default: undefined },
		disabled: { type: Boolean, default: false },
		class: { type: String, default: undefined },
	},

	setup(props, { slots }) {
		return () =>
			h(
				'button',
				{
					class: buttonVariants({
						type: props.type,
						size: props.size,
						className: props.class,
					}),
					disabled: props.disabled,
				},
				slots.default?.(),
			)
	},
})
