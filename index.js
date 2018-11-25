'use strict';

const puppeteer = require('puppeteer');
const urlList = [
    'https://gardening.stackexchange.com/questions?sort=newest',
    'https://sustainability.stackexchange.com/questions?sort=newest',
    'https://electronics.stackexchange.com/questions?sort=newest'
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
        for (let url of urlList) {
            this.constructPageLinksArray(url).then((value) => {
                console.log(`${startString} STARTING QUESTION AND ANSWER TEXT ${startString}`);
                console.log(value);
                console.log(`${endString} ENDING QUESTION AND ANSWER TEXT ${endString}`);
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
                    const result = await page.evaluate(() => {
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
                            "questionText": document.querySelector('.question .post-text').innerText,
                            "questionComments": questionCommentsText,
                            "answers": answersText
                        }
                        return returnObj;
                    });
                    browser.close();
                    returnArr.push(result);
                }
            }
            scrape().then(() => {
                resolve(returnArr);
            });
        });
    }
}

new Water();
