# seneca-promisify
[Seneca](senecajs.org) plugin providing a promise-based API.

[![Npm][BadgeNpm]][Npm]
[![Travis][BadgeTravis]][Travis]
[![Coveralls][BadgeCoveralls]][Coveralls]



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
