const fs = require('fs');
const querystring = require('querystring');
const http = require('http');

let readfile = function (path, callback) {
    let readedfile = fs.readFile(path, (err, data) => {
        if (err) throw err;
        else {
            callback(readedfile);
        }
    });
}

let PostAudio =  function(audio) {
    // Build the post string from an object
    let post_data = querystring.stringify({
        'body' : audio
    });

    // An object of options to indicate where to post to
    let post_options = {
        uri: 'https://speech.platform.bing.com/speech/recognition/interactive/cognitiveservices/v1',
        language: 'en-us',
        method: 'POST',
        headers: {
            'Content-Type': 'audio/wav; codec=audio/pcm; samplerate=16000',
            'Ocp-Apim-Subscription-Key': 'be4559ca9eab4ed2814b4a5e941f494c',
            'Transfer-Encoding' : 'chunked'
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

}

module.exports.readfile = readfile;
module.exports.readfile = PostAudio;