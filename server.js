const express = require('express');
const bodyParser = require('body-parser');

const cogserv = require('cogserv-text-analytics'); //Text Analytics
process.env.COGSERV_TEXT_KEY = '8ca2bdd32e074e00ae381100115a49c5';
const {keyPhrases, sentiment} = require('./text-analytics')

const wiki = require('wikijs').default; //Wikipedia API

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
// app.use(fileUpload());
var object = {}
object.get
var port = process.env.PORT || 8010;
app.listen(port);

// app.get("/terms", function (req, res) {
//     res.setHeader('Content-Type', 'application/json');
//     let out = {};
//     let phrases;
//     let text = req.headers.text;
//     let userLang = req.headers.lang;
//     console.log(text);
//     console.log(userLang);
//
//     if (text.length == 0) {
//         res.send(out);
//     }
//     //console.log(text);
//     getPhrases(text).then(retPhrases => {
//         phrases = retPhrases;
//         phrasesLoop(phrases, userLang).then(retWikiTerms => {
//             wikiTerms = retWikiTerms;
//             //console.log(wikiTerms);
//             out.text = text;
//             out.terms = phrases;
//             out.wiki = wikiTerms;
//             res.send(out);
//         }).catch(err => {
//             console.error(err);
//         });
//     }).catch(err => {
//         console.error(err);
//     });
// });

app.get("", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({"welcome": "!"});
});

app.get("/phrases", function (req, res) {
    //console.log(req);
    res.setHeader('Content-Type', 'application/json');
    let phrases = [];
    let text = req.headers.text;
    if (text.length == 0) {
        res.send(phrases);
    }
    getPhrases(text).then(retPhrases => {
        phrases = retPhrases;
        res.send({"phrases": phrases});
    }).catch(err => {
        console.error(err);
    });
});

app.post("/wiki", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let out = {};
    console.log(req.headers.lang);
    console.log(req.headers.terms);
    let phrases = Object.keys(req.headers.terms);
    console.log(phrases);
    let userLang = req.headers.lang;
    if (phrases.length == 0) {
        res.send(out);
    }
    phrasesLoop(phrases, userLang).then(retWikiTerms => {
        wikiTerms = retWikiTerms;
        out = wikiTerms;
        res.send(out);
    }).catch(err => {
        console.error(err);
    });
});


//Functions
async function getPhrases(text) {
    var retPhrases = await new Promise(resolve => {
        let arrPhrases;
        keyPhrases(text).then(resPhrases => {
            resPhrases = JSON.parse(resPhrases);
            try {
                arrPhrases = resPhrases.documents[0].keyPhrases;
                resolve(arrPhrases);
            } catch (error) {
                console.error(err);
                arrPhrases = [];
                resolve(arrPhrases);
            }
        }).catch(err => {
            console.error(err);
            arrPhrases = [];
            resolve(arrPhrases);
        });
    });
    return retPhrases;
}

async function wikiTerm(term, userLang) {
    var retWikiTerms = await new Promise(resolve => {
        let langCountry;
        let obj = {};
        let counter = 0;
        wiki().search(term, 1).then(searched => {
            if (searched.results.length == 0) {
                resolve(obj);
            }
            //which result to choose??? 0, 1 or 2?
            wiki().page(searched.results[0]).then(page => {
                page.html().then(html => {
                    if (html.indexOf("may refer to") != -1) {
                        page.links().then(links => {
                            //console.log(links);
                            wiki().page(links[0]).then(page => {
                                langPage(page, userLang).then(obj => {
                                    resolve(obj);
                                }).catch(err => {
                                    console.error(err);
                                });
                            }).catch(err => {
                                console.error(err);
                            });
                        }).catch(err => {
                            console.error(err);
                        });
                    } else {
                        langPage(page, userLang).then(obj => {
                            resolve(obj);
                        }).catch(err => {
                            console.error(err);
                        });
                    }
                }).catch(err => {
                    console.error(err);
                });
            }).catch(err => {
                console.error(err);
            });
        }).catch(err => {
            console.error(err);
        });
    }).catch(err => {
        console.error(err);
        resolve(obj);
    });

    return retWikiTerms;
}

async function phrasesLoop(phrases, userLang) {
    var retWikiTerms = await new Promise(resolve => {
        var counter = 0;
        let obj = {};
        phrases.forEach(function (term, i) {
            wikiTerm(term, userLang).then(wiki => {
                obj[term] = wiki;
                counter++;
                if (counter == phrases.length) {
                    resolve(obj);
                }
            }).catch(err => {
                console.error(err);
            });
        });
    });
    return retWikiTerms;
}

async function langPage(page, userLang) {
    var langObj = await new Promise(resolve => {
        var obj = {};
        page.langlinks().then(langsArray => {
            if (langsArray.length < 3) {    //does not return object with less then 5 translations
                resolve(obj);
            }
            langTitle = page.raw.title;
            langCountry = "en";
            for (var i = 0; i < langsArray.length; i++) {
                if (langsArray[i].lang == userLang.toLowerCase()) {
                    langTitle = langsArray[i].title;
                    langCountry = userLang;
                    break;
                }
            }
            wiki({apiUrl: 'http://' + langCountry + '.wikipedia.org/w/api.php'}).page(langTitle).then(page => {
                obj.title = page.raw.title;
                obj.url = page.raw.fullurl;
                page.summary().then(summary => {
                    obj.summery = summary;
                    if (obj.image != undefined) {
                        resolve(obj);
                    }
                }).catch(err => {
                    obj.summery = "";
                    if (obj.image != undefined) {
                        resolve(obj);
                    }
                });
                page.mainImage().then(mainImage => {
                    obj.image = mainImage;
                    if (obj.summery != undefined) {
                        resolve(obj);
                    }
                }).catch(err => {
                    obj.image = "";
                    if (obj.summery != undefined) {
                        resolve(obj);
                    }
                });
            }).catch(err => {
                console.error(err);
            });
        }).catch(err => {
            obj = {};
            resolve(obj);
        });
    });
    return langObj;
}


// const fs = require('fs');
// const fileUpload = require('express-fileupload'); //File Upload API


// const speech = require("@google-cloud/speech"); // Google Speech API
// const configGoogle = {
//     projectId: 'dulcet-pilot-202710',
//     keyFilename: './google-speech/Catchapp-24f90e9bc6d3.json'
// };

// const speechService = require('ms-bing-speech-service');//Bing Speech API
// const speechServiceOptions = {
//     language: 'en-US',
//     subscriptionKey: '94dabe3881d944099d322529affca28e',
//     mode: 'dictation'
//     //format: 'simple'
// };

// app.post('/upload', function (req, res) {
//     res.setHeader('Content-Type', 'application/json');
//     let filePath = './' + req.files.mFileName.name;
//     console.log(req.files);
//     let analyzedText;
//     let out = {};
//     let phrases;
//     //let userLang = req.body.userLanguage;
//     let userLang = "fr";
//     SpeechToTextGoogle(filePath).then(retAnalyzedText => {
//         analyzedText = retAnalyzedText;
//         console.log(analyzedText);
//         getPhrases(analyzedText).then(retPhrases => {
//             phrases = retPhrases;
//             console.log(phrases);
//             wikiLoop(phrases, userLang).then(retWikiTerms => {
//                 wikiTerms = retWikiTerms;
//                 console.log(wikiTerms);
//                 out.text = analyzedText;
//                 out.terms = phrases;
//                 out.wiki = wikiTerms;
//                 res.send(JSON.stringify({a: out}));
//             });
//         });
//     });
// });


// async function SpeechToTextMicrosoft(filePath) {
//     var retText = await new Promise(resolve => {
//         let recognizer = new speechService(speechServiceOptions);
//         let analyzedText;
//         recognizer.start((error, service) => {
//             if (!error) {
//                 console.log('Recognition Started!');
//                 service.sendFile(filePath);
//                 service.on('recognition', (speechtotext) => {
//                     if (speechtotext.RecognitionStatus === 'Success') {
//                         analyzedText = speechtotext.DisplayText;
//                         resolve(analyzedText);
//                     } else {
//                     }
//                 });
//             }
//         });
//     });
//     return retText;
// }
//
// async function SpeechToTextGoogle(filePath) {
//     var retText = await new Promise(resolve => {
//         let client = new speech.SpeechClient(configGoogle);
//         // Reads a local audio file and converts it to base64
//         let file = fs.readFileSync(filePath);
//         let audioBytes = file.toString('base64');
//         let request = {
//             audio: {content: audioBytes,},
//             config: {
//                 encoding: 'LINEAR16',
//                 sampleRateHertz: 16000,
//                 languageCode: 'en-US',
//             },
//         };
//         // Detects speech in the audio file
//         client.recognize(request).then(data => {
//             var transcription = data[0].results[0].alternatives[0].transcript;
//             resolve(transcription);
//         }).catch(err => {
//             console.error('ERROR:', err)
//             resolve(err);
//         });
//     });
//     return retText;
// }