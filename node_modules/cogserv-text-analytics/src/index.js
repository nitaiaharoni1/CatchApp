'use strict'
const SENTIMENT = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment'
const KEYPHRASES = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases'

const {
  isArray,
  isUndefined,
  isFunction,
  makeid,
} = require('./utils')

const makeRequest = require('./makerequest')
let key = process.env.COGSERV_TEXT_KEY

function processDocuments(rawDocuments) {
  return (isArray(rawDocuments)
  ? rawDocuments
  : [rawDocuments])
  .map(doc => ({
    text: isUndefined(doc.text) ? doc : doc.text,
    id: isUndefined(doc.id) ? makeid() : doc.id,
    language: isUndefined(doc.language) ? 'en' : doc.language,
  }))
}

function keyPhrases(input, cb) {
  const documents = processDocuments(input)

  const options = {
    url: KEYPHRASES,
    method: 'POST',
    body: JSON.stringify({ documents }),
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': key,
    }
  }

  return makeRequest(options, cb)
}

function sentiment(input, cb) {
  const documents = processDocuments(input)

  const options = {
    url: SENTIMENT,
    method: 'POST',
    body: JSON.stringify({ documents }),
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': key,
    }
  }

  return makeRequest(options, cb)
}

function textAnalytics(options) {
  key = options.key || key
  return {
    keyPhrases,
    sentiment,
  }
}

textAnalytics.keyPhrases = keyPhrases
textAnalytics.sentiment = sentiment
module.exports = textAnalytics

/*
{
  keyPhrases,
  sentiment,
}
*/
