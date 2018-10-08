/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

const Util = require('util')

const Lab = require('lab')
const Code = require('code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Optioner = require('optioner')
const Joi = Optioner.Joi

const Plugin = require('..')


lab.test('validate', Util.promisify(function(x,fin){PluginValidator(Plugin, module)(fin)}))


lab.test('happy', async () => {
  var counter = 0

  var si = seneca_instance()
      .message('a:1', async function(msg) {
        counter++
        return {x:msg.x}
      })

  // async message (no response)
  si.send('a:1,x:2')

  // sync message (has response)
  var out = await si.post('a:1,x:3')
  expect(out.x).equal(3)

  expect(counter).equal(2)
})


lab.test('validate-handle', async () => {
  var counter = 0

  async function a1(msg) {
    counter++
    return {x:msg.x}
  }

  a1.validate = {
    x: Joi.number()
  }

  a1.handle = function() {}

  var si = seneca_instance()
      .message('a:1', a1)

  // async message (no response)
  si.send('a:1,x:2')

  // sync message (has response)
  var out = await si.post('a:1,x:3')
  expect(out.x).equal(3)

  expect(counter).equal(2)
})


lab.test('plugin', async () => {
  var si = seneca_instance()
      .use(function() {
        var y = 0

        this
          .message('a:1', async function a1(msg) {
            return {x:msg.x, y:y}
          })
          .prepare(async function () {
            y = 50
          })
          .prepare(async function prep() {
            y = 100
          })
      })

  var out = await si.post('a:1,x:2')
  expect(out).equal({x:2,y:100})
})


lab.test('entity', async () => {
  var si = seneca_instance()

  var bar0 = si.entity('bar').data$({a:1})
  expect(''+bar0).equal('$-/-/bar;id=;{a:1}')

  var bar1 = si.entity('bar',{a:2})
  expect(''+bar1).equal('$-/-/bar;id=;{a:2}')

  var bar2 = si.entity('bar')  
  bar2.a = 3
  expect(''+bar2).equal('$-/-/bar;id=;{a:3}')

  var bar10 = si.make('bar').data$({a:1})
  expect(''+bar10).equal('$-/-/bar;id=;{a:1}')

  var bar11 = si.make('bar',{a:2})
  expect(''+bar11).equal('$-/-/bar;id=;{a:2}')

  var bar12 = si.make('bar')
  bar12.a = 3
  expect(''+bar12).equal('$-/-/bar;id=;{a:3}')

  
  var foo0 = await si.entity('foo').data$({a:1}).save$()

  var foo1 = await si.entity('foo').load$(foo0.id)
  expect(''+foo0).equal(''+foo1)

  var foo2 = await si.entity('foo').data$({a:1}).save$()
  var list = await si.entity('foo').list$({a:1})
  expect(list.length).equal(2)

  await foo0.remove$()
  list = await si.entity('foo').list$({a:1})
  expect(list.length).equal(1)

  var foo3 = list[0].clone$()
  foo3.a = 2
  await foo3.save$()

  var foo4 = await list[0].load$()
  expect(foo4.a).equal(2)
})



function seneca_instance(fin, testmode) {
  return Seneca()
    .test(fin, testmode)
    .use(Plugin)
    .use('seneca-joi')
    .use('entity')
}
