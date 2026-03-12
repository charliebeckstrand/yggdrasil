export { Button } from './component.js'
export { buttonVariants } from './variants.js'

export type ButtonProps = InstanceType<typeof import('./component.js').Button>['$props']
