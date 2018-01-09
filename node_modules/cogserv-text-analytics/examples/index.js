const { keyPhrases, sentiment } = require('../src')
//const republic = require('./republic.json')
const documents = require('./example.json')

keyPhrases(documents, (err, res) => {
  console.log(err || JSON.parse(res))
})

keyPhrases(documents)
  .then(res => JSON.parse(res))
  .then(res => {
    console.log(res.documents.length)
    console.log(res.documents)
    console.log(res.errors)
  })
  .catch(err => console.error(err))

sentiment(documents)
  .then(res => JSON.parse(res))
  .then(res => res.documents.forEach(x => console.log(x)))
  .catch(err => console.error(err))

