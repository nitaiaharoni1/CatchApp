const request = require('request')
const { isFunction } = require('./utils')

function makeRequest(options, cb) {
  if (!isFunction(cb)) {
    return promiseRequest(options)
  }

  request(options, (err, res, body) => {
    if (err || res.statusCode !== 200) {
      cb(err || new Error(res.body))
    } else {
      cb(false, body)
    }
  })
}

function promiseRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        reject(err || res.body)
      } else {
        resolve(body)
      }
    })
  })
}

module.exports = makeRequest
