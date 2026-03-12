export { Card } from './component.js'
export { cardVariants } from './variants.js'

export type CardProps = InstanceType<typeof import('./component.js').Card>['$props']
