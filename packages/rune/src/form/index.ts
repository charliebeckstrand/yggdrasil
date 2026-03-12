export { Form } from './component.js'
export { formVariants } from './variants.js'

export type FormProps = InstanceType<typeof import('./component.js').Form>['$props']
