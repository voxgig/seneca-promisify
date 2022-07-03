# seneca-promisify
[Seneca](senecajs.org) plugin providing a Promise-based API.

This is an interim plugin to provide a Promise-based API to Seneca.

NOTE: no longer provides a Promises API for entities, as seneca-entity
18.x+ provides this directly.

[![Npm][BadgeNpm]][Npm]
[![Travis][BadgeTravis]][Travis]
[![Coveralls][BadgeCoveralls]][Coveralls]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Quick Example

```
const Seneca = require('seneca')

var seneca = Seneca()

// Callback version: seneca.add(msg, action)
// Define a message patter and action
seneca.message('a:1', async function(msg) {
  return {foo:1} // reply by just returning
})

// Callback version: seneca.act(msg, callback)
// Send a synchronous message action and wait for a reply
var reply = await seneca.post('a:1')



```


[BadgeCoveralls]: https://coveralls.io/repos/voxgig/seneca-promisify/badge.svg?branch=master&service=github
[BadgeNpm]: https://badge.fury.io/js/seneca-promisify.svg
[BadgeTravis]: https://travis-ci.org/voxgig/seneca-promisify.svg?branch=master
[Coveralls]: https://coveralls.io/github/voxgig/seneca-promisify?branch=master
[Npm]: https://www.npmjs.com/package/seneca-promisify
[Travis]: https://travis-ci.org/voxgig/seneca-promisify?branch=master
