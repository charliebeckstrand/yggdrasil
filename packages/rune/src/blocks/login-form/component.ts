import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

import { Button } from '../../button/component.js'
import { Card } from '../../card/component.js'
import { Form } from '../../form/component.js'
import { Input } from '../../input/component.js'
import { Label } from '../../label/component.js'

export const LoginForm = defineComponent({
	name: 'RuneLoginForm',
	inheritAttrs: false,

	props: {
		action: { type: String, default: undefined },
		method: {
			type: String as PropType<'get' | 'post' | 'dialog'>,
			default: 'post',
		},
		class: { type: String, default: undefined },
	},

	setup(props) {
		return () =>
			h(Card, { class: props.class }, () =>
				h(Form, { action: props.action, method: props.method }, () => [
					h('div', { class: 'flex flex-col gap-2' }, [
						h(Label, { htmlFor: 'email' }, () => 'Email'),

						h(Input, {
							inputType: 'email',
							name: 'email',
							id: 'email',
							placeholder: 'you@example.com',
							required: true,
						}),
					]),

					h('div', { class: 'flex flex-col gap-2' }, [
						h(Label, { htmlFor: 'password' }, () => 'Password'),

						h(Input, {
							inputType: 'password',
							name: 'password',
							id: 'password',
							placeholder: 'Password',
							required: true,
						}),
					]),

					h(Button, { type: 'default', size: 'medium' }, () => 'Sign in'),
				]),
			)
	},
})
