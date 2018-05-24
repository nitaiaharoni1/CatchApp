const express = require('express');
const bodyParser = require('body-parser');
const cogserv = require('cogserv-text-analytics')({key: "be5cce28a9694bf192daeb242d114e08"})
const {keyPhrases, sentiment} = require('cogserv-text-analytics')

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
    let textRazorOptions = {extractors: 'entities'}
    let text = req.headers.text.toUpperCase();
    let userLang = req.headers.lang.toLowerCase();
    textRazor.exec(text, textRazorOptions).then(terms =>{
        let phrases = terms.response.entities;
        if(phrases != undefined){
            phrasesLoop(phrases, userLang).then(obj =>{
                res.send(obj);
            }).catch(err => console.error(err));
        } else{
            res.send({"Error": "Can't find entities in: " + req.headers.text});
        }
    }).catch(err => console.error(err));
});

async function phrasesLoop(phrases, userLang){
    var ret = await new Promise(resolve =>{
        let lang = userLang;
        let finalPhrases = [];
        for(var i = 0; i < phrases.length; i++){
            if(!finalPhrases.includes(phrases[i].entityEnglishId)){
                finalPhrases.push(phrases[i].entityEnglishId);
            }
        }
        let obj = {};
        var counter = 0;
        for(i = 0; i < finalPhrases.length; i++){
            wikiTerm(finalPhrases[i], lang).then(wiki =>{
                if(wiki != undefined && Object.keys(wiki).length != 0){
                    if(wiki.englishTitle != undefined){
                        obj[wiki.englishTitle] = wiki;
                    }else{
                        obj.Error = wiki;
                    }
                    counter++;
                    if(counter == finalPhrases.length){
                        resolve(obj);
                    }
                } else{
                    counter++;
                    if(counter == finalPhrases.length){
                        resolve(obj);
                    }
                }
            }).catch(err =>{
                counter++;
                console.error(err);
            });
        }
    });
    return ret;
}

async function wikiTerm(term, userLang){
    var retWikiTerm = await new Promise(resolve =>{
        let langCountry;
        let obj = {};
        let counter = 0;
        wiki().page(term).then(page =>{
            findLang(page, userLang).then(arr =>{ //country,langTitle,englishTitle
                if(arr != undefined && arr.length == 3){
                    objBuild(arr[0], arr[1], arr[2]).then(obj =>{
                        resolve(obj);
                    }).catch(err =>{
                        console.error(err);
                        resolve({});
                    });
                }
            }).catch(err =>{
                console.error(err);
                resolve({"Error": "Can't find Wikipedia page of: " + term + " in your specified language"});
            });
        }).catch(err =>{
            console.error(err);
            resolve({"Error": "Can't find Wikipedia page of: " + term});
        });
    });
    return retWikiTerm;
}

async function objBuild(langCountry, langTitle, englishTitle){
    var retObj = await new Promise(resolve =>{
        var obj = {};
        obj.englishTitle = englishTitle;
        obj.title = langTitle;
        wiki({apiUrl: 'http://' + langCountry + '.wikipedia.org/w/api.php'}).page(langTitle).then(page =>{
            obj.url = page.raw.fullurl;
            page.summary().then(summary =>{
                if(summary.length < 110 || summary == undefined){
                    obj.summary = "";
                } else{
                    summary = summary.split(/[.;]/);
                    var sumSummary = "";
                    for(var i = 0; i < summary.length; i++){
                        if(sumSummary.length < 350){
                            sumSummary += summary[i] + ".";
                        }
                    }
                    sumSummary = sumSummary.replace(/\.\./gm, '.');
                    sumSummary = sumSummary.replace(/(\[\d*\])/gm, '');
                    obj.summary = sumSummary;
                }
                if(obj.summary != ""){
                    obj.image = "";
                    page.images().then(images =>{
                        if(images != undefined){
                            for(var i = 0; i < images.length; i++){
                                if(images[i].endsWith(".jpg") || images[i].endsWith(".png")){
                                    obj.image = images[i];
                                    break;
                                }
                            }
                        }
                        resolve(obj);
                    }).catch(err =>{
                        resolve(obj);
                    });
                } else{
                    resolve({"Error": "Summery of " + englishTitle + " is to short and probably not found right"});
                }
            })
        })
    });
    return retObj;
}

async function findLang(page, userLang){
    var langArr = await new Promise(resolve =>{
        var arr = [];
        page.langlinks().then(langsArray =>{
            if(langsArray == undefined || langsArray.length < 3){    //does not return object with less then 5 translations
                resolve(arr);
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
        }).catch(err =>{
            resolve(arr);
            console.error(err);
        });
    });
    return langArr;
}


// app.get("/input", function(req, res){
//     res.setHeader('Content-Type', 'application/json');
//     let text = req.headers.text
//     let userLang = req.headers.lang.toLowerCase();
//     let obj = {};
//     phrasesLoopInput(text, userLang).then(obj =>{
//         res.send(obj);
//     }).catch(err => console.error(err));
// })
// ;
//
// async function phrasesLoopInput(phrase, userLang){
//     var ret = await new Promise(resolve =>{
//         let lang = userLang;
//         let obj = {};
//         wikiInputTerm(phrase, lang).then(wiki =>{
//             if(wiki != undefined){
//                 obj[wiki.englishTitle] = wiki;
//                 resolve(obj);
//             } else{
//                 resolve(obj);
//             }
//         }).catch(err =>{
//             console.error(err);
//         });
//     });
//     return ret;
// }
//
// async function wikiInputTerm(term, userLang){
//     var retWikiTerms = await new Promise(resolve =>{
//         let langCountry;
//         let obj = {};
//         let counter = 0;
//         wiki().search(term, 1).then(searched =>{
//             if(searched.results.length == 0){
//                 resolve(obj);
//             }
//             term = searched.results[0];
//             wiki().page(term).then(page =>{
//                 page.html().then(html =>{
//                     if(html.indexOf("may refer to") != -1){
//                         page.links().then(links =>{
//                             let link = links[0];
//                             let linkArr = [];
//                             for(var i in links){
//                                 if(links[i].toLowerCase().startsWith(term.toLowerCase())){
//                                     linkArr.push(links[i]);
//                                 }
//                                 if(linkArr.length > 1){
//                                     var maxLength = 0;
//                                     var maxJ;
//                                     for(var j in linkArr){
//                                         if(linkArr[j].length > maxLength){
//                                             maxLength = linkArr[j].length;
//                                             maxJ = j;
//                                         }
//                                     }
//                                     link = linkArr[maxJ];
//                                 } else if(linkArr.length == 1){
//                                     link = linkArr[0];
//                                 }
//                             }
//                             wiki().page(link).then(page =>{
//                                 findLang(page, userLang).then(arr =>{ //country,langTitle,englishTitle
//                                     objBuild(arr[0], arr[1], arr[2]).then(obj =>{
//                                         resolve(obj);
//                                     }).catch(err =>{
//                                         console.error(err);
//                                         resolve();
//                                     });
//                                 }).catch(err =>{
//                                     console.error(err);
//                                     resolve();
//                                 });
//                             }).catch(err =>{
//                                 console.error(err);
//                                 resolve();
//                             });
//                         }).catch(err =>{
//                             console.error(err);
//                             resolve();
//                         });
//                     } else{
//                         findLang(page, userLang).then(arr =>{ //country,langTitle,englishTitle
//                             objBuild(arr[0], arr[1], arr[2]).then(obj =>{
//                                 resolve(obj);
//                             }).catch(err =>{
//                                 console.error(err);
//                                 resolve();
//                             });
//                         }).catch(err =>{
//                             console.error(err);
//                             resolve();
//                         });
//                     }
//                 }).catch(err =>{
//                     console.error(err);
//                     resolve();
//                 });
//             }).catch(err =>{
//                 console.error(err);
//                 resolve();
//             });
//         }).catch(err =>{
//             console.error(err);
//             resolve();
//         });
//     });
//     return retWikiTerms;
// }
