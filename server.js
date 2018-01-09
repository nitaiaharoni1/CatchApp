const express = require('express');
const bodyParser = require('body-parser');

const speechService = require('ms-bing-speech-service');
const options = {
    language: 'en-US',
    subscriptionKey: 'be4559ca9eab4ed2814b4a5e941f494c'
};

const cogserv = require('cogserv-text-analytics');
process.env.COGSERV_TEXT_KEY = 'c4a1a23c457647fcb2cb597e8ea41402';
const { keyPhrases, sentiment } = require('./text-analytics')

var app = express();

const wiki = require('wikijs').default;
//wiki().page('Bitcoin').then(page => page.summary()).then(console.log);
//wiki().page('Bitcoin').then(page => page.images()).then(console.log);
//wiki().page('batman').then(page => page.mainImage()).then(console.log);

const recognizer = new speechService(options);
recognizer.start((error, service) => {
    if (!error) {
        console.log('recognition started');
        service.sendFile('./audio.wav');
        service.on('recognition', (text) => {
            if (text.RecognitionStatus === 'Success') {
                console.log(text);
                keyPhrases(text.DisplayText).then(res => JSON.parse(res)).then(res => {
                        console.log(res.documents)
                        //console.log(res.errors)
                    wiki().search(res.documents[0].keyPhrases[0], 10).then(data =>{
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
});