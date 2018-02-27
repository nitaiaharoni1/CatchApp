const express = require('express');
const bodyParser = require('body-parser');

//Text Analytics
const cogserv = require('cogserv-text-analytics');
process.env.COGSERV_TEXT_KEY = '7ed66a7ac625436f8b202ff503d5f336';
const { keyPhrases, sentiment } = require('./text-analytics')

const wiki = require('wikijs').default;

//Bing Speech API
const speechService = require('ms-bing-speech-service');
const options = {
    language: 'en-US',
    subscriptionKey: '5de01924d56642319d51dd4b8fa99331',
    mode: 'dictation'
    //format: 'simple'
};

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var port = process.env.PORT || 5000;

app.get("/", function(req,res){
    res.send("Welcome")
});

app.post('/audio', function(req, res) {
    var audio = req.audioRec;

    const recognizer = new speechService(options);
    recognizer.start((error, service) => {
        if (!error) {
            console.log('recognition started');
            service.sendFile('./audio1_short.wav');
            service.on('recognition', (text) => {
                if (text.RecognitionStatus === 'Success') {
                    console.log(text);
                    keyPhrases(text.DisplayText).then(res => JSON.parse(res)).then(res => {
                        console.log(res.documents)
                        //console.log(res.errors)
                        //res.documents[0].keyPhrases[1]
                        wiki().search(res.documents[0].keyPhrases[4], 10).then(data => {
                            console.log(data.results[0]);
                            wiki().page(data.results[0]).then(page => {
                                page.summary().then(console.log);
                                page.mainImage().then(console.log);
                            });
                        });
                    }).catch(err => console.error(err))
                }
            });
        }
        res.send('success');
    });
});

app.listen(port);













// var app = express();
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// var port = process.env.PORT || 5000;
// app.listen(port);
//
//
//
//
// app.post('/audio', function(req, res) {
//     var audio = req.body;
//
//     const recognizer = new speechService(options);
//     recognizer.start((error, service) => {
//         if (!error) {
//             console.log('recognition started');
//             service.sendFile(audio);
//             service.on('recognition', (text) => {
//                 if (text.RecognitionStatus === 'Success') {
//                     console.log(text);
//                     keyPhrases(text.DisplayText).then(res => JSON.parse(res)).then(res => {
//                         console.log(res.documents)
//                         //console.log(res.errors)
//                         wiki().search(res.documents[0].keyPhrases[0], 10).then(data =>{
//                             console.log(data.results[0]);
//                             wiki().page(data.results[0]).then(page => {
//                                 page.summary().then(console.log);
//                                 page.mainImage().then(console.log);
//                             });
//                         });
//                     }).catch(err => console.error(err))
//                 }
//             });
//         }
//     });
//
//     res.send(user_id + ' ' + token + ' ' + geo);
// });






// var GoogleSearch = require('google-search');
// var googleSearch = new GoogleSearch({
//     key: 'AIzaSyA7BSZjJBbYXyqqUJV-REm4PSNmrMwVxJA',
//     cx: '007115896535282779850:zjkhmuunzj4'
// });
//
// googleSearch.build({
//     q: "Bitcoin",
//     start: 1,
//     num: 2, // Number of search results to return between 1 and 10, inclusive
//     googlehost: "http://www.google.com" // Restricts results to URLs from a specified site
// }, function(error, response) {
//     console.log(response);
// });