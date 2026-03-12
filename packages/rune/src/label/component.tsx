import type { ReactNode } from 'react'

import { labelVariants } from './variants.js'

export type LabelProps = {
	htmlFor?: string
	size?: 'small' | 'medium'
	className?: string
	children?: ReactNode
}

export function Label({ htmlFor, size, className, children, ...rest }: LabelProps) {
	return (
		<label htmlFor={htmlFor} className={labelVariants({ size, className })} {...rest}>
			{children}
		</label>
	)
}
