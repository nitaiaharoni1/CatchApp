const express = require('express');
const bodyParser = require('body-parser');

const TextRazor = require('textrazor')
//nitai - 1f5b8b282f0efbf7da5f6c543a16a45d58d3ec090ba069c92ffc9587
//dyny - 60d32def4796a0ba0bc0d0f82d0414f9dcf71f9b681c8d7b2fbee5a9
const textRazor = new TextRazor('60d32def4796a0ba0bc0d0f82d0414f9dcf71f9b681c8d7b2fbee5a9')
const wiki = require('wikijs').default; //Wikipedia API

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
var object = {}
var port = process.env.PORT || 8010;
app.listen(port);

app.get("", function(req, res){
    res.setHeader('Content-Type', 'application/json');
    res.send({"welcome": "!"});
});

app.get("/phrases", function(req, res){
    res.setHeader('Content-Type', 'application/json');
    let textRazorOptions = {extractors: 'entities, topics, phrases'}
    let text = req.headers.text
    let userLang = req.headers.lang.toLowerCase();
    if(text.length == 0){
        res.send({});
    }
    textRazor.exec(text, textRazorOptions).then(terms =>{
        let phrases = terms.response.entities;
        if(phrases != undefined){
            phrasesLoop(phrases, userLang).then(obj =>{
                res.send(obj);
            }).catch(err => console.error(err));
        } else{
            res.send({});
        }
    }).catch(err =>{
        console.error(err);
    });
})
;

async function phrasesLoop(phrases, userLang){
    var ret = await new Promise(resolve =>{
        let lang = userLang;
        var counter = 0;
        let finalPhrases = [];
        let obj = {};
        phrases.forEach(function(termObj, i){
            if(!finalPhrases.includes(termObj.entityEnglishId) && termObj.confidenceScore > 1.2){
                finalPhrases.push(termObj.entityEnglishId);
            }
        });
        finalPhrases.forEach(function(term, j){
            wikiTerm(term, lang).then(wiki =>{
                obj[wiki.englishTitle] = wiki;
                counter++;
                if(counter == finalPhrases.length){
                    resolve(obj);
                }
            }).catch(err =>{
                console.error(err);
            });
        });
    });
    return ret;
}

async function wikiTerm(term, userLang){
    var retWikiTerms = await new Promise(resolve =>{
        let langCountry;
        let obj = {};
        let counter = 0;
        wiki().page(term).then(page =>{
            findLang(page, userLang).then(arr =>{ //country,langTitle,englishTitle
                objBuild(arr[0], arr[1], arr[2]).then(obj =>{
                    resolve(obj);
                }).catch(err =>{
                    console.error(err);
                    resolve(obj);
                });
            }).catch(err =>{
                console.error(err);
                resolve(obj);
            });
        }).catch(err =>{
            console.error(err);
            resolve(obj);
        });
    }).catch(err =>{
        console.error(err);
        resolve(obj);
    });

    return retWikiTerms;
}

async function objBuild(langCountry, langTitle, englishTitle){
    var obj = await new Promise(resolve =>{
        var obj = {};
        wiki({apiUrl: 'http://' + langCountry + '.wikipedia.org/w/api.php'}).page(langTitle).then(page =>{
            obj.title = langTitle;
            obj.englishTitle = englishTitle;
            obj.url = page.raw.fullurl;
            page.summary().then(summary =>{
                summary = summary.split(/[.;]/);
                obj.summary = "";
                for(var i = 0; i < summary.length; i++){
                    if(obj.summary.length < 350){

                        obj.summary += summary[i];
                    }
                }
                summary = obj.summary
                obj.summary = summary.replace(/(\[\d*\])/gm, '');
                resolve(obj);
            }).catch(err =>{
                obj.summary = "";
                if(obj.image != undefined){
                    resolve(obj);
                }
            });
            page.images().then(images =>{
                for(var i = 0; i < images.length; i++){
                    if(images[i].endsWith(".jpg") || images[i].endsWith(".png")){
                        obj.image = images[i];
                        break;
                    }
                }
                if(obj.summary != undefined){
                    resolve(obj);
                }
            }).catch(err =>{
                obj.image = "";
                if(obj.summary != undefined){
                    resolve(obj);
                }
            });
        }).catch(err =>{
            console.error(err);
        });
    });
    return obj;
}

async function findLang(page, userLang){
    var langArr = await new Promise(resolve =>{
        page.langlinks().then(langsArray =>{
            var arr = [];
            if(langsArray.length < 3){    //does not return object with less then 5 translations
                resolve(obj);
            }
            arr[2] = page.raw.title; //englishTitle
            langTitle = page.raw.title;
            langCountry = "en";
            for(var i = 0; i < langsArray.length; i++){
                if(langsArray[i].lang == userLang){
                    langCountry = userLang;
                    langTitle = langsArray[i].title;
                    break;
                }
            }
            arr[0] = langCountry;
            arr[1] = langTitle;
            resolve(arr);
        });
    });
    return langArr;

}


// page.html().then(html =>{
//     if(html.indexOf("may refer to") != -1){
//         page.links().then(links =>{
//             //console.log(links);
//             wiki().page(links[0]).then(page =>{
//                 langPage(page, userLang).then(obj =>{
//                     resolve(obj);
//                 }).catch(err =>{
//                     console.error(err);
//                 });
//             }).catch(err =>{
//                 console.error(err);
//             });
//         }).catch(err =>{
//             console.error(err);
//         });
//     } else{
//         langPage(page, userLang).then(obj =>{
//             resolve(obj);
//         }).catch(err =>{
//             console.error(err);
//         });
//     }
// }).catch(err =>{
//     console.error(err);
// });