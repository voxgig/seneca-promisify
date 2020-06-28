/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

// An experimental promise interface for Seneca

var Util = require('util')

module.exports = promisify

module.exports.preload = function preload_promisify(plugin) {
  var self = this

  var options = plugin.options


  
  self.root.send = function (msg) {
    this.act(msg)
    return this
  }
  self.root.post = Util.promisify(this.act)

  self.root.message = function (pattern, action) {
    var action_wrapper =
      null == action
        ? null
        : function (msg, reply, meta) {
            action.call(this, msg, meta).then(reply).catch(reply)
          }

    if (null != action && null != action_wrapper) {
      if ('' != action.name) {
        Object.defineProperty(action_wrapper, 'name', { value: action.name })
      }

      for (var p in action) {
        action_wrapper[p] = action[p]
      }

      // NOTE: also set properties defined after call to seneca.message
      setImmediate(function () {
        for (var p in action) {
          action_wrapper[p] = action[p]
        }
      })
    }

    this.add(pattern, action_wrapper)

    return this
  }

  
  if(null == self.root.entity) { 
    self.root.entity = function () {
      var ent = this.make.apply(this, arguments)
      ent = promisify_entity(ent,options)
      return ent
    }
  }
  
  
  self.root.prepare = function (init) {
    var init_wrapper = function (done) {
      init.call(this).then(done).catch(done)
    }
    if ('' != init.name) {
      Object.defineProperty(init_wrapper, 'name', { value: init.name })
    }

    this.init(init_wrapper)

    return this
  }

  const __prior$$ = self.root.prior
  const __priorAsync$$ = Util.promisify(self.root.prior)

  self.root.prior = async function () {
    var last_is_func =
      1 < arguments.length &&
      'function' == typeof arguments[arguments.length - 1]

    if (last_is_func) {
      return __prior$$.apply(this, arguments)
    } else {
      return await __priorAsync$$.apply(this, arguments)
    }
  }

  const __ready$$ = self.root.ready
  const __readyAsync$$ = Util.promisify(self.root.ready)

  self.root.ready = async function () {
    var last_is_func =
      0 < arguments.length &&
      'function' == typeof arguments[arguments.length - 1]

    if (last_is_func) {
      return __ready$$.apply(this, arguments)
    } else {
      await __readyAsync$$.apply(this, arguments)
      return this
    }
  }

  self.root.__promisify$$ = true
}

// In seneca 4, update seneca-entity to be async/await
function promisify_entity(ent,options) {
  if (null == ent ||
      ent.__promisify$$ ||
      (options && false === options.ent))
  {
    return ent
  }

  ent.__promisify$$ = true

  ent.__make$$ = ent.make$
  ent.__load$$ = Util.promisify(ent.load$)
  ent.__save$$ = Util.promisify(ent.save$)
  ent.__list$$ = Util.promisify(ent.list$)
  ent.__remove$$ = Util.promisify(ent.remove$)
  ent.__close$$ = Util.promisify(ent.close$)

  ent.make$ = function () {
    var outent = ent.__make$$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.load$ = async function () {
    var outent = await ent.__load$$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.save$ = async function () {
    var outent = await ent.__save$$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.list$ = async function () {
    var outlist = await ent.__list$$.apply(ent, arguments)
    for (var i = 0; i < outlist.length; i++) {
      outlist[i] = promisify_entity(outlist[i])
    }
    return outlist
  }

  ent.remove$ = async function () {
    var outent = await ent.__remove$$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.close$ = async function () {
    var outent = await ent.__close$$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.native$ = Util.promisify(ent.native$)

  return ent
}

function promisify(options) {}
