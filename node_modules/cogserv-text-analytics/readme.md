### config

supply your api key either through the COGSERV_TEXT_KEY enviroment variable or by passing a config object when requiring the library, eg

```
require('cogserv-text-analytics')({key: '<key>'})
```

### usage

you can consume through either a promise or callback style api

```
const { keyPhrases, sentiment } = require('cogserv-text-analytics')

keyPhrases(documents, (err, res) => {
  console.log(err || JSON.parse(res))
})

keyPhrases(documents)
  .then(res => JSON.parse(res))
  .then(res => console.log(res.documents))
  .catch(err => console.error(err))
```

cog services excepts each document to be assigned a unique key. If you don't provide one, a 8 byte hex key will be generated for each document.

```
const documents = [{
  id: '1234',
  language: 'en',
  text: 'document text',
}, {
  id: '5678',
  language: 'en',
  text: 'document text',
}]
```

you may also pass an array of strings, or a single document as a string, and the library will assume the english language, generate ids, and format the object for you.

