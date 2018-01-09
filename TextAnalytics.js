'use strict';

let https = require ('https');

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Replace the accessKey string value with your valid access key.
let accessKey = 'd3134ad5e831408fbb3aa768a0a5496a';

// Replace or verify the region.

// You must use the same region in your REST API call as you used to obtain your access keys.
// For example, if you obtained your access keys from the westus region, replace
// "westcentralus" in the URI below with "westus".

// NOTE: Free trial access keys are generated in the westcentralus region, so if you are using
// a free trial access key, you should not need to change this region.
let uri = 'https://westcentralus.api.cognitive.microsoft.com';
let path = '/text/analytics/v2.0';

let response_handler = function (response) {
    let body = '';
    response.on ('data', function (d) {
        body += d;
    });
    response.on ('end', function () {
        let body_ = JSON.parse (body);
        let body__ = JSON.stringify (body_, null, '  ');
        console.log (body__);
    });
    response.on ('error', function (e) {
        console.log ('Error: ' + e.message);
    });
};

let get_language = function (text) {
    let body = JSON.stringify (text);

    let request_params = {
        method : 'POST',
        hostname : uri,
        path : path + "languages",
        headers : {
            'Ocp-Apim-Subscription-Key' : accessKey,
        }
    };

    let req = https.request (request_params, response_handler);
    req.write (body);
    req.end ();
}

let get_sentiments = function (text) {
    let body = JSON.stringify (text);

    let request_params = {
        method : 'POST',
        hostname : uri,
        path : path + "sentiment",
        headers : {
            'Ocp-Apim-Subscription-Key' : accessKey,
        }
    };

    let req = https.request (request_params, response_handler);
    req.write (body);
    req.end ();
}

let get_key_phrases = function (text) {
    let body = JSON.stringify (text);

    let request_params = {
        method : 'POST',
        hostname : uri,
        path : path + 'keyPhrases',
        headers : {
            'Ocp-Apim-Subscription-Key' : accessKey,
        }
    };

    let req = https.request (request_params, response_handler);
    req.write (body);
    req.end ();
}

module.exports = get_key_phrases;
module.exports = get_sentiments;
module.exports = get_language;


