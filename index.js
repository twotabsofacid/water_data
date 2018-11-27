'use strict';

const puppeteer = require('puppeteer');
const jetpack = require('fs-jetpack');
const urls = [
    {
        url: 'https://gardening.stackexchange.com/questions?sort=newest',
        baseDir: 'gardening'
    },
    {
        url: 'https://sustainability.stackexchange.com/questions?sort=newest',
        baseDir: 'sustainability'
    },
    {
        url: 'https://electronics.stackexchange.com/questions?sort=newest',
        baseDir: 'electronics'
    }
];

/**
 * Helpers for console.logs
 */
let startString = Array.apply(null, {length: 28}).map(x => '~').join('');
let endString = Array.apply(null, {length: 28}).map(x => '*').join('');

class Water {
    constructor() {
        process.setMaxListeners(Infinity);
        this.addListeners();
        console.log(`${startString} STARTING ${startString}`)
        for (let [index, urlObj] of urls.entries()) {
            this.constructPageLinksArray(urlObj.url).then((value) => {
                this.writeToFiles(urlObj.baseDir, value);
            });
        }
    }
    addListeners() {
        process.on("unhandledRejection", (reason, p) => {
            console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
            process.exit(1);
        });
    }
    constructPageLinksArray(url) {
        return new Promise((resolve, reject) => {
            let scrape = async() => {
                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.goto(url, {
                    timeout: 3000000
                });
                await page.waitFor(1000);
                const result = await page.evaluate((url) => {
                    // return something
                    let links = [].slice.call(document.querySelectorAll('#questions .question-hyperlink'));
                    let returnArr = [];
                    for (let i = 0; i < links.length; i++) {
                        returnArr[i] = {
                            "url": `${url.split('.com')[0]}.com${links[i].getAttribute('href')}`,
                            "name": links[i].innerText
                        }
                    }
                    return returnArr;
                }, url);
                browser.close();
                return result;
            }
            scrape().then((value) => {
                this.storeText(value).then((value) => {
                    resolve(value);
                });
            });
        })
    }
    storeText(arr) {
        let returnArr = [];
        return new Promise((resolve, reject) => {
            let scrape = async() => {
                for (let arrVal of arr) {
                    let url = arrVal.url;
                    const browser = await puppeteer.launch({headless: true});
                    const page = await browser.newPage();
                    await page.goto(url);
                    await page.waitFor(1000);
                    const result = await page.evaluate((url) => {
                        let questionComments = [].slice.call(document.querySelectorAll('.question .comments .comment-body'));
                        let questionCommentsText = [];
                        let j = questionComments.length;
                        while (j--) {
                            questionCommentsText[j] = questionComments[j].innerText;
                        }
                        let answers = [].slice.call(document.querySelectorAll('#answers .answer .post-text'));
                        let answersText = [];
                        let k = answers.length;
                        while (k--) {
                            answersText[k] = answers[k].innerText;
                        }
                        returnObj = {
                            "questionSlug": `${url.split('questions/')[1].split('/')[0]}-${url.split('questions/')[1].split('/')[1]}`,
                            "questionText": document.querySelector('.question .post-text').innerText,
                            "questionComments": questionCommentsText,
                            "answers": answersText
                        }
                        return returnObj;
                    }, url);
                    browser.close();
                    returnArr.push(result);
                }
            }
            scrape().then(() => {
                resolve(returnArr);
            });
        });
    }
    writeToFiles(baseDir, value) {
        for (let obj of value) {
            console.log(`${startString} START OF SCRAPED FILE ${startString}`);
            console.log(obj);
            console.log(`${endString} END OF SCRAPED FILE ${endString}`);
            let questionCommentsText, answersText;
            if (obj.questionComments.length) {
                questionCommentsText = obj.questionComments.reduce(function(accumulator, str) {
                    return `${accumulator}\n\n${str}`;
                });
            } else {
                questionCommentsText = '';
            }
            if (obj.answers.length) {
                answersText = obj.answers.reduce(function (accumulator, str) {
                    return `${accumulator}\n\n${str}`;
                });
            } else {
                answersText = '';
            }
            let fileText = `QUESTION:\n${obj.questionText}\n\n\nQUESTION COMMENTS:\n${questionCommentsText}\n\n\nANSWERS:\n${answersText}`;
            jetpack.dir(`documents/${baseDir}`)
                .file(`${obj.questionSlug}.txt`, {content: fileText});
        }
    }
}

new Water();
