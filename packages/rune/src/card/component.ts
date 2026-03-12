import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import { cardVariants } from './variants.js'

export const Card = defineComponent({
	name: 'RuneCard',
	inheritAttrs: false,

	props: {
		padding: {
			type: String as PropType<'none' | 'small' | 'medium' | 'large'>,
			default: undefined,
		},
		shadow: {
			type: String as PropType<'none' | 'small' | 'medium'>,
			default: undefined,
		},
		class: { type: String, default: undefined },
	},

	setup(props, { slots }) {
		return () =>
			h(
				'div',
				{
					class: cardVariants({
						padding: props.padding,
						shadow: props.shadow,
						className: props.class,
					}),
				},
				slots.default?.(),
			)
	},
})
