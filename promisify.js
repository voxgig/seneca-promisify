/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

// An experimental promise interface for Seneca

var Util = require('util')

module.exports = promise

module.exports.preload = function preload_promise() {
  var self = this
  
  self.root.send = function(msg) { return this.act(msg) }
  self.root.post = Util.promisify(this.act)

  self.root.message = function(pattern, action) {
    var action_wrapper = function(msg, reply, meta) {
      action.call(this, msg, meta).then(reply).catch(reply)
    }
    if( '' != action.name ) {
      Object.defineProperty(action_wrapper, 'name', {value:action.name})
    }
    
    this.add(pattern, action_wrapper)

    return this
  }

  self.entity = function() {
    var ent = self.make.apply(self,arguments)
    ent = promisify_entity(ent)
    return ent
  }


  self.prepare = function(init) {
    var init_wrapper = function(done) {
      init.call(this).then(done).catch(done)
    }
    if( '' != init.name ) {
      Object.defineProperty(init_wrapper, 'name', {value:init.name})
    }
    
    this.init(init_wrapper)

    return this
  }
  
  return self
}


function promisify_entity(ent) {
  if(null == ent) {
    return ent
  }
  
  ent.__load__$ = Util.promisify(ent.load$)
  ent.__save__$ = Util.promisify(ent.save$)
  ent.__list__$ = Util.promisify(ent.list$)
  ent.__remove__$ = Util.promisify(ent.remove$)

  ent.load$ = async function() {
    var outent = await ent.__load__$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.save$ = async function() {
    var outent = await ent.__save__$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.remove$ = async function() {
    var outent = await ent.__remove__$.apply(ent, arguments)
    return promisify_entity(outent)
  }

  ent.list$ = async function() {
    var outlist = await ent.__list__$.apply(ent, arguments)
    for(var i = 0; i < outlist.length; i++ ) {
      outlist[i] = promisify_entity(outlist[i])
    }
    return outlist
  }
  
  return ent
}


function promise(options) {

}


