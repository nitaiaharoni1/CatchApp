const speechService = require('ms-bing-speech-service');
const options = {
    language: 'en-US',
    subscriptionKey: 'be4559ca9eab4ed2814b4a5e941f494c'
};

const cogserv = require('cogserv-text-analytics');
process.env.COGSERV_TEXT_KEY = 'c4a1a23c457647fcb2cb597e8ea41402';
const { keyPhrases, sentiment } = require('./text-analytics')

//const wiki = require('wikijs').default;


const recognizer = new speechService(options);

recognizer.start((error, service) => {
    if (!error) {
        console.log('recognition started');
        service.sendFile('./audio.wav');
        service.on('recognition', (text) => {
            if (text.RecognitionStatus === 'Success') {
                console.log(text);
                keyPhrases(text.DisplayText).then(res => JSON.parse(res)).then(res => {
                        console.log(res.documents.length)
                        console.log(res.documents)
                        console.log(res.errors)
                    }).catch(err => console.error(err))
            }
        });

    }
});


// const express = require('express');
// const bodyParser = require('body-parser');
// let fs = require("fs");
// let Wavefile = require("wavefile");
// var request = require('request');
//
//
// //var app = express();
//
// let wav = fs.("./audio.wav");
// //wav = JSON.stringify(wav);
// console.log(wav);
// request(
//     {
//         method: 'POST',
//         uri: 'https://speech.platform.bing.com',
//         path: '/speech/recognition/conversation/cognitiveservices/v1',
//         format: 'Detailed',
//         language:'en-US',
//
//         headers:{
//             'Ocp-Apim-Subscription-Key': 'be4559ca9eab4ed2814b4a5e941f494c',
//             'Content-Type': 'audio/wav',
//             'Transfer-Encoding': 'chunked',
//             'Accept': 'application/json'
//         },
//         body: wav
//     }, function (error, response, body) {
//         console.log('callback');
//         if (response.statusCode == 200) {
//             //console.log(response);
//         } else {
//             console.log('error: ' + JSON.stringify(response.responseToJSON()));
//             console.log("3");
//         }
//     }
// )