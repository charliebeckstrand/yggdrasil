import type { Size } from '../types/index.js'

import { inputVariants } from './variants.js'

export type InputProps = {
	type?: 'default' | 'error' | 'success'
	inputType?: string
	size?: Exclude<Size, 'tiny'>
	placeholder?: string
	name?: string
	id?: string
	value?: string
	required?: boolean
	disabled?: boolean
	className?: string
}

export function Input({ type, inputType, size, disabled, className, ...rest }: InputProps) {
	return (
		<input
			type={inputType ?? 'text'}
			className={inputVariants({ type, size, className })}
			disabled={disabled}
			{...rest}
		/>
	)
}
