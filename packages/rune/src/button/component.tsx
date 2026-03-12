import type { ReactNode } from 'react'

import type { Size, Type } from '../types/index.js'

import { buttonVariants } from './variants.js'

export type ButtonProps = {
	type?: Type
	size?: Size
	disabled?: boolean
	className?: string
	children?: ReactNode
}

export function Button({ type, size, disabled, className, children, ...rest }: ButtonProps) {
	return (
		<button className={buttonVariants({ type, size, className })} disabled={disabled} {...rest}>
			{children}
		</button>
	)
}
