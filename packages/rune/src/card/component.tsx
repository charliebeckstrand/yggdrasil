import type { ReactNode } from 'react'

import { cardVariants } from './variants.js'

export type CardProps = {
	padding?: 'none' | 'small' | 'medium' | 'large'
	shadow?: 'none' | 'small' | 'medium'
	className?: string
	children?: ReactNode
}

export function Card({ padding, shadow, className, children, ...rest }: CardProps) {
	return (
		<div className={cardVariants({ padding, shadow, className })} {...rest}>
			{children}
		</div>
	)
}
