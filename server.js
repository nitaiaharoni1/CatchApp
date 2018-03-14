const express = require('express');
const bodyParser = require('body-parser');

//Text Analytics
const cogserv = require('cogserv-text-analytics');
process.env.COGSERV_TEXT_KEY = '7ed66a7ac625436f8b202ff503d5f336';
const {keyPhrases, sentiment} = require('./text-analytics')

const wiki = require('wikijs').default;
const fileUpload = require('express-fileupload');

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
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.use(fileUpload());
var port = process.env.PORT || 8015;

app.get("/", function (req, res) {
    res.send("Welcome")
});

app.post('/upload', function (req, res) {
    console.log(req.files.file);
    let sampleFile = req.files.file;
    sampleFile.mv('./' + sampleFile.name, function (err) {
        if (err)
            return res.status(500).send(err);
    });

    const recognizer = new speechService(options);
    recognizer.start((error, service) => {
        let Out = {};
        if (!error) {
            console.log('Recognition Started!');
            service.sendFile('./' + sampleFile.name);
            service.on('recognition', (speechtotext) => {
                if (speechtotext.RecognitionStatus === 'Success') {
                    Out.text = speechtotext.DisplayText;
                    Out.terms = [];
                    console.log("Out Object text:", Out);
                    keyPhrases(speechtotext.DisplayText).then(resPhrases => {
                        resPhrases = JSON.parse(resPhrases);
                        console.log("ResPhrases Here:", resPhrases.documents[0].keyPhrases);
                        var counter = 0;
                        resPhrases.documents[0].keyPhrases.forEach(function (item, i, array) {
                            Out.terms.push({title: item});
                            //console.log("Out Object with titles:", Out);

                            wiki().search(item, 10).then(data => {
                                //which result to choose??? 0, 1 or 2?? console.log(i + " wiki search:", data.results[0]);
                                wiki().page(data.results[0]).then(page => {
                                    page.summary().then(summary => {
                                        Out.terms[i].summary = summary;
                                        counter = counter + 0.5;
                                        if(counter == array.length){
                                            console.log("Out: ", Out);
                                            res.send(Out);
                                        }
                                    });
                                    page.mainImage().then(mainImage => {
                                        Out.terms[i].image = mainImage;
                                        counter = counter + 0.5;
                                        if(counter == array.length){
                                            console.log("Out: ", Out);
                                            res.send(Out);
                                        }
                                    });
                                });
                            });
                        });
                    }).catch(err => console.error(err))
                }

            });
        }
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