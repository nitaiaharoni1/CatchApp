const express = require('express');
const bodyParser = require('body-parser');

const fs = require('fs');

const speech = require("@google-cloud/speech"); // Google Speech API
const configGoogle = {
    projectId: 'dulcet-pilot-202710',
    keyFilename: './google-speech/Catchapp-24f90e9bc6d3.json'
};

const cogserv = require('cogserv-text-analytics'); //Text Analytics
process.env.COGSERV_TEXT_KEY = '996f7b4c6b924383b3fe595509a7fec1';
const {keyPhrases, sentiment} = require('./text-analytics')

const wiki = require('wikijs').default; //Wikipedia API

const fileUpload = require('express-fileupload'); //File Upload API

const speechService = require('ms-bing-speech-service');//Bing Speech API
const speechServiceOptions = {
    language: 'en-US',
    subscriptionKey: '94dabe3881d944099d322529affca28e',
    mode: 'dictation'
    //format: 'simple'
};

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.use(fileUpload());

var port = process.env.PORT || 8010;

app.get("/terms", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let out = {};
    let userLang = "fr";
    let phrases;
    let text = req.headers.text;
    console.log(text);
    res.send(JSON.stringify({a: text}))
    getPhrases(text).then(retPhrases => {
        phrases = retPhrases;
        console.log(phrases);
        wikiLoop(phrases, userLang).then(retWikiTerms => {
            wikiTerms = retWikiTerms;
            console.log(wikiTerms);
            out.text = text;
            out.terms = phrases;
            out.wiki = wikiTerms;
            res.send(JSON.stringify({a: out}));
        });
    });

});

app.post('/upload', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let filePath = './' + req.files.mFileName.name;
    console.log(req.files);
    let analyzedText;
    let out = {};
    let phrases;
    //let userLang = req.body.userLanguage;
    let userLang = "fr";

    // if (req.files.mFileName.mimetype != "audio/wave") {
    //     console.log("check: " + req.files.mFileName.mimetype);
    //     res.send(JSON.stringify({a: req.files.mFileName.mimetype}));
    // }
    SpeechToTextGoogle(filePath).then(retAnalyzedText => {
        analyzedText = retAnalyzedText;
        console.log(analyzedText);
        getPhrases(analyzedText).then(retPhrases => {
            phrases = retPhrases;
            console.log(phrases);
            wikiLoop(phrases, userLang).then(retWikiTerms => {
                wikiTerms = retWikiTerms;
                console.log(wikiTerms);
                out.text = analyzedText;
                out.terms = phrases;
                out.wiki = wikiTerms;
                res.send(JSON.stringify({a: out}));
            });
        });
    });
});

app.listen(port);

//Functions
async function SpeechToTextMicrosoft(filePath) {
    var retText = await new Promise(resolve => {
        let recognizer = new speechService(speechServiceOptions);
        let analyzedText;
        recognizer.start((error, service) => {
            if (!error) {
                console.log('Recognition Started!');
                service.sendFile(filePath);
                service.on('recognition', (speechtotext) => {
                    if (speechtotext.RecognitionStatus === 'Success') {
                        analyzedText = speechtotext.DisplayText;
                        resolve(analyzedText);
                    } else {
                        //console.log(speechtotext);
                        //console.log(speechtotext.RecognitionStatus);
                    }
                });
            }
        });
    });
    return retText;
}

async function SpeechToTextGoogle(filePath) {
    var retText = await new Promise(resolve => {
        let client = new speech.SpeechClient(configGoogle);
        // Reads a local audio file and converts it to base64
        let file = fs.readFileSync(filePath);
        let audioBytes = file.toString('base64');
        let request = {
            audio: {content: audioBytes,},
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
        };
        // Detects speech in the audio file
        client.recognize(request).then(data => {
            var transcription = data[0].results[0].alternatives[0].transcript;
            resolve(transcription);
        }).catch(err => {
            console.error('ERROR:', err)
            resolve(err);
        });
    });
    return retText;
}

async function getPhrases(text) {
    var retPhrases = await new Promise(resolve => {
        let phrases;
        keyPhrases(text).then(resPhrases => {
            resPhrases = JSON.parse(resPhrases);
            phrases = resPhrases.documents[0].keyPhrases;
            resolve(phrases);
        }).catch(err => console.error(err));
    });
    return retPhrases;
}

async function wikiTerm(term, userLang) {
    var retWikiTerm = await new Promise(resolve => {
        let langCountry;
        let langSearch;
        let obj = {};
        let counter = 0;
        wiki().search(term, 1).then(searched => {
            //which result to choose??? 0, 1 or 2?
            wiki().page(searched.results[0]).then(page => {
                try {
                    page.langlinks().then(langsArray => {
                        if (langsArray.length < 5) {    //does not return object with less then 5 translations
                            resolve({});
                        }
                        for (var i = 0; i < langsArray.length; i++) {
                            if (langsArray[i].lang == userLang) {
                                langSearch = langsArray[i].title;
                                langCountry = userLang;
                                break;
                            } else {
                                langSearch = searched.results[0];
                                langCountry = "en";
                            }
                        }
                        wiki({apiUrl: 'http://' + langCountry + '.wikipedia.org/w/api.php'}).page(langSearch).then(page => {
                            obj.title = langSearch;
                            obj.url = page.raw.fullurl;
                            page.summary().then(summary => {
                                obj.summery = summary;
                                counter = counter + 0.5;
                                if (counter == 1) {
                                    resolve(obj);
                                }
                            }).catch(err => {
                                obj.summery = "";
                                counter = counter + 0.5;
                                if (counter == 1) {
                                    resolve(obj);
                                }
                            });
                            page.mainImage().then(mainImage => {
                                obj.image = mainImage;
                                counter = counter + 0.5;
                                if (counter == 1) {
                                    resolve(obj);
                                }
                            }).catch(err => {
                                obj.image = "";
                                counter = counter + 0.5;
                                if (counter == 1) {
                                    resolve(obj);
                                }
                            });
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            });
        });
    });
    return retWikiTerm;
}

async function wikiLoop(phrases, userLang) {
    var retWikiTerms = await new Promise(resolve => {
        var counter = 0;
        let array = [];
        phrases.forEach(function (term, i) {
            wikiTerm(term, userLang).then(obj => {
                array.push(obj);
                counter++;
                if (counter == phrases.length) {
                    resolve(array);
                }
            });
        });
    });
    return retWikiTerms;
}