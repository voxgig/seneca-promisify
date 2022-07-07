/* Copyright (c) 2018-2022 voxgig and other contributors, MIT License */
'use strict'

// A promise interface for Seneca

var Util = require('util')

module.exports = promisify

module.exports.preload = function preload_promisify(plugin) {
  var self = this

  var options = plugin.options

  var actives = {
    ...plugin.defaults.active,
    ...plugin.options.active,
  }
  
  self.root.send = function (msg) {
    this.act(msg)
    return this
  }

  
  if(actives.post) {
    self.root.post = Util.promisify(this.act)
  }

  
  if(actives.message) {
    self.root.message = function (pattern0, pattern1, action) {
      let actfunc = action || pattern1
      var action_wrapper =
          null == actfunc
          ? null
          : function (msg, reply, meta) {
            actfunc.call(this, msg, meta).then(reply).catch(reply)
          }

      if (null != actfunc && null != action_wrapper) {
        if ('' != actfunc.name) {
          Object.defineProperty(action_wrapper, 'name', { value: actfunc.name })
        }

        for (var p in actfunc) {
          action_wrapper[p] = actfunc[p]
        }

        // NOTE: also set properties defined after call to seneca.message
        setImmediate(function () {
          for (var p in actfunc) {
            action_wrapper[p] = actfunc[p]
          }
        })
      }

      if (action) {
        this.add(pattern0, pattern1, action_wrapper)
      } else if (action_wrapper) {
        this.add(pattern0, action_wrapper)
      } else {
        this.add(pattern0)
      }

      return this
    }
  }


  if(actives.prepare) {
    self.root.prepare = function (prepare) {
      async function prepare_wrapper(msg) {
        await prepare.call(this, msg)
        return this.prior(msg)
      }

      if ('' != prepare.name) {
        Object.defineProperty(prepare_wrapper, 'name', {
          value: 'prepare_' + prepare.name,
        })
      }

      const plugin = this.plugin

      let pat = {
        role: 'seneca',
        plugin: 'init',
        init: plugin.name,
      }

      if (null != plugin.tag && '-' != plugin.tag) {
        pat.tag = plugin.tag
      }

      this.message(pat, prepare_wrapper)

      this.plugin.prepare = this.plugin.prepare || []
      this.plugin.prepare.push(prepare)

      return this
    }
  }
  

  if(actives.destroy) {
    self.root.destroy = function (destroy) {
      async function destroy_wrapper(msg) {
        await destroy.call(this, msg)
        return this.prior(msg)
      }

      if ('' != destroy.name) {
        Object.defineProperty(destroy_wrapper, 'name', {
          value: 'destroy_' + destroy.name,
        })
      }

      this.message('role:seneca,cmd:close', destroy_wrapper)

      this.plugin.destroy = this.plugin.destroy || []
      this.plugin.destroy.push(destroy)

      return this
    }
  }

  
  const __prior$$ = self.root.prior
  const __priorAsync$$ = Util.promisify(self.root.prior)


  if(actives.prior) {
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
  }

  
  const __ready$$ = self.root.ready
  const __readyAsync$$ = Util.promisify(self.root.ready)

  
  if(actives.ready) {
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
  }
  
  self.root.__promisify$$ = true
}

function promisify(options) {}


promisify.defaults = {
  active: {
    post: true,
    message: true,
    prepare: true,
    destroy: true,
    prior: true,
    ready: true,
  }
}

