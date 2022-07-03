const Seneca = require('seneca')

let s0 = Seneca({ legacy: false }).use('promisify').use('entity')

let foo = s0.make('foo').data$({ x: 1 })
console.log(foo)

let bar = s0.entity('bar').data$({ y: 1 })
console.log(bar)
