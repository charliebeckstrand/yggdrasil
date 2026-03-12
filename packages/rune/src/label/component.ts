import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import { labelVariants } from './variants.js'

export const Label = defineComponent({
	name: 'RuneLabel',
	inheritAttrs: false,

	props: {
		htmlFor: { type: String, default: undefined },
		size: {
			type: String as PropType<'small' | 'medium'>,
			default: undefined,
		},
		class: { type: String, default: undefined },
	},

	setup(props, { slots }) {
		return () =>
			h(
				'label',
				{
					for: props.htmlFor,
					class: labelVariants({
						size: props.size,
						className: props.class,
					}),
				},
				slots.default?.(),
			)
	},
})
