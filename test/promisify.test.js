/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

const Util = require('util')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Optioner = require('optioner')

const Plugin = require('..')

lab.test(
  'validate',
  PluginValidator(Plugin, module) //(fin)
)

lab.test('happy', async () => {
  var counter = 0

  var si = seneca_instance().message('a:1', async function (msg) {
    counter++
    return { x: msg.x }
  })

  // async message (no response)
  si.send('a:1,x:2')

  // sync message (has response)
  var out = await si.post('a:1,x:3')
  expect(out.x).equal(3)

  expect(counter).equal(2)
})

lab.test('no-action', async () => {
  var tmp = { a1: 0, a1x1: 0 }

  var si = seneca_instance().message('a:1')

  si.sub('a:1', (m) => {
    tmp.a1++
  }).sub('a:1,x:1', (m) => {
    tmp.a1x1++
  })

  // async message (no response)
  si.act('a:1')
  await si.ready()
  expect(tmp).equal({ a1: 1, a1x1: 0 })

  return

  si.send('a:1,x:1')
  await si.ready()
  expect(tmp).equal({ a1: 1, a1x1: 1 })
})

lab.test('close', async () => {
  var si = seneca_instance()
  expect(si.flags.closed).false()

  await si.close()
  expect(si.flags.closed).true()
})

lab.test('validate-handle', async () => {
  var counter = 0

  async function a1(msg) {
    counter++
    return { x: msg.x }
  }

  a1.validate = {
    x: Number,
  }

  a1.handle = function () {}

  var si = seneca_instance().message('a:1', a1)

  // async message (no response)
  si.send('a:1,x:2')

  // sync message (has response)
  var out = await si.post('a:1,x:3')
  expect(out.x).equal(3)

  expect(counter).equal(2)
})

lab.test('plugin', async () => {
  var si = seneca_instance().use(function () {
    var y = 0

    this.message('a:1', async function a1(msg) {
      return { x: msg.x, y: y }
    })
      .prepare(async function () {
        y = 50
      })
      .prepare(async function prep() {
        y = 100
      })
  })

  var out = await si.post('a:1,x:2')
  expect(out).equal({ x: 2, y: 100 })
})

lab.test('entity', async () => {
  var si = seneca_instance()

  var bar0 = si.entity('bar').data$({ a: 1 })
  expect('' + bar0).equal('$-/-/bar;id=;{a:1}')

  var bar1 = si.entity('bar', { a: 2 })
  expect('' + bar1).equal('$-/-/bar;id=;{a:2}')

  var bar2 = si.entity('bar')
  bar2.a = 3
  expect('' + bar2).equal('$-/-/bar;id=;{a:3}')

  var bar10 = si.make('bar').data$({ a: 1 })
  expect('' + bar10).equal('$-/-/bar;id=;{a:1}')

  var bar11 = si.make('bar', { a: 2 })
  expect('' + bar11).equal('$-/-/bar;id=;{a:2}')

  var bar12 = si.make('bar')
  bar12.a = 3
  expect('' + bar12).equal('$-/-/bar;id=;{a:3}')

  var foo0 = await si.entity('foo').data$({ a: 1 }).save$()

  var foo1 = await si.entity('foo').load$(foo0.id)
  expect('' + foo0).equal('' + foo1)

  var foo2 = await si.entity('foo').data$({ a: 1 }).save$()
  var list = await si.entity('foo').list$({ a: 1 })
  expect(list.length).equal(2)

  await foo0.remove$()
  list = await si.entity('foo').list$({ a: 1 })
  expect(list.length).equal(1)

  var foo3 = list[0].clone$()
  foo3.a = 2
  await foo3.save$()

  var foo4 = await list[0].load$()
  expect(foo4.a).equal(2)
})

lab.test('prepare-entity', async () => {
  var si = seneca_instance().use(function () {
    this.prepare(async function () {
      var foo = await this.entity('foo').data$({ a: 1 }).save$()
      expect(foo.a).equal(1)
    })
  })

  //await Util.promisify(si.ready)()
  await si.ready()
})

lab.test('prior', async () => {
  var si = seneca_instance()

  si.add('trad:0', function (msg, reply) {
    reply({ x: msg.x, y: 1, z: msg.z, q: msg.q })
  })

  si.add('trad:0', function (msg, reply) {
    msg = this.util.clean(msg)
    msg.z = 1
    this.prior(msg, reply)
  })

  var out = await si.post('trad:0,x:1')
  expect(out).equal({ x: 1, y: 1, z: 1, q: void 0 })

  si.message('trad:0', async function (msg) {
    msg = this.util.clean(msg)
    msg.q = 1
    return await this.prior(msg)
  })

  var out = await si.post('trad:0,x:1')
  expect(out).equal({ x: 1, y: 1, z: 1, q: 1 })

  var tmp = {}
  si.add('a:1', function (msg) {
    tmp.a = msg.a
  })

  si.add('a:1', function (msg) {
    this.prior({ a: msg.a })
  })

  si.send('a:1')

  setImmediate(function () {
    expect(tmp.a).equal(1)
  })
})

lab.test('ready', async () => {
  var si = seneca_instance()
  var tmp = {}

  si.use(function (opts) {
    this.prepare(async function () {
      await new Promise((r) => setTimeout(r, 111))
      tmp.a = 1
    })
  })

  var so = await si.ready()
  expect(tmp.a).equal(1)
  expect(si === so).true()
})

function seneca_instance(fin, testmode) {
  return Seneca().test(fin, testmode).use(Plugin).use('entity')
}
