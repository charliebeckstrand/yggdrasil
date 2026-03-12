import type { ReactNode } from 'react'

import { formVariants } from './variants.js'

export type FormProps = {
	action?: string
	method?: 'get' | 'post' | 'dialog'
	spacing?: 'compact' | 'default' | 'relaxed'
	className?: string
	children?: ReactNode
}

export function Form({ action, method, spacing, className, children, ...rest }: FormProps) {
	return (
		<form
			action={action}
			method={method}
			className={formVariants({ spacing, className })}
			{...rest}
		>
			{children}
		</form>
	)
}
