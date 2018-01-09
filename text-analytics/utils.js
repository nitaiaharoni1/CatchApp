const crypto = require('crypto')

function isArray(n) {
  return (typeof(n.reduce) === 'function')
}

function isUndefined(n) {
  return (typeof(n) === 'undefined')
}

function isFunction(n) {
  return (typeof(n) === 'function')
}

function makeid() {
  return crypto.randomBytes(8).toString('hex')
}

module.exports = {
  isArray,
  isUndefined,
  isFunction,
  makeid,
}
