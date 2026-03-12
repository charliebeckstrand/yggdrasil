export { Input } from './component.js'
export { inputVariants } from './variants.js'

export type InputProps = InstanceType<typeof import('./component.js').Input>['$props']
