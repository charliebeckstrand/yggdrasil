import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import type { Size } from '../types/index.js'

import { inputVariants } from './variants.js'

export const Input = defineComponent({
	name: 'RuneInput',
	inheritAttrs: false,

	props: {
		type: {
			type: String as PropType<'default' | 'error' | 'success'>,
			default: undefined,
		},
		inputType: { type: String, default: 'text' },
		size: {
			type: String as PropType<Exclude<Size, 'tiny'>>,
			default: undefined,
		},
		placeholder: { type: String, default: undefined },
		name: { type: String, default: undefined },
		id: { type: String, default: undefined },
		modelValue: { type: String, default: undefined },
		required: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
		class: { type: String, default: undefined },
	},

	emits: ['update:modelValue'],

	setup(props, { emit }) {
		return () =>
			h('input', {
				type: props.inputType,
				class: inputVariants({
					type: props.type,
					size: props.size,
					className: props.class,
				}),
				placeholder: props.placeholder,
				name: props.name,
				id: props.id,
				value: props.modelValue,
				required: props.required,
				disabled: props.disabled,
				onInput: (e: Event) => {
					emit('update:modelValue', (e.target as HTMLInputElement).value)
				},
			})
	},
})
