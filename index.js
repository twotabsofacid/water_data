'use strict';

const puppeteer = require('puppeteer');
const jetpack = require('fs-jetpack');
const chalk = require('chalk');
const art = require('./ascii-art');
let scrapeCount = 0;
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
        this.sayHello();
        for (let [index, urlObj] of urls.entries()) {
            this.constructPageLinksArray(urlObj.url).then((value) => {
                this.writeToFiles(urlObj.baseDir, value).then((value) => {
                    scrapeCount++;
                    if (scrapeCount == urls.length) {
                        jetpack.copy('./documents/', '/Volumes/CESDD/', {
                            overwrite: (srcInspectData, destInspectData) => {
                                return srcInspectData.modifyTime > destInspectData.modifyTime;
                            }
                        });
                        this.sayGoodbye();
                    }
                });
            });
        }
    }
    addListeners() {
        process.on("unhandledRejection", (reason, p) => {
            console.error(chalk.red("Unhandled Rejection at: Promise", p, "reason:", reason));
            process.exit(1);
        });
    }
    sayHello() {
        console.log(chalk.white.bgCyan.bold(`${startString} STARTING ${startString}`));
        console.log(chalk.green(art.flower));
        console.log(chalk.hex("#222").bgHex("#6900DB").bold(`${endString}   this might   ${endString}`));
        setTimeout(() => {
            console.log(chalk.hex("#222").bgHex("#06B1DB").bold(`${endString}  take a while  ${endString}`));
            setTimeout(() => {
                console.log(chalk.hex("#222").bgHex("#00DBAE").bold(`${endString} take this time ${endString}`));
                setTimeout(() => {
                    console.log(chalk.hex("#222").bgHex("#00DB03").bold(`${endString}   to reflect   ${endString}`));
                }, 1000)
            }, 1000);
        }, 1000);
    }
    sayGoodbye() {
        console.log(chalk.white.bgCyan.bold(`\n\n\n\n\n\n\n\n\n\n${startString} ENDING ${startString}`));
        console.log(chalk.green(art.flower));
        console.log(chalk.hex("#222").bgHex("#6900DB").bold(`${endString}     thank you      ${endString}`));
        setTimeout(() => {
            console.log(chalk.hex("#222").bgHex("#06B1DB").bold(`${endString}      new data      ${endString}`));
            setTimeout(() => {
                console.log(chalk.hex("#222").bgHex("#00DBAE").bold(`${endString}   has been added   ${endString}`));
                setTimeout(() => {
                    console.log(chalk.hex("#222").bgHex("#67DB55").bold(`${endString}   to the system    ${endString}`));
                    setTimeout(() => {
                        console.log(chalk.hex("#222").bgHex("#C178C9").bold(`${endString}  please disconnect ${endString}`));
                        setTimeout(() => {
                            console.log(chalk.hex("#222").bgHex("#4269C9").bold(`${endString}     the drive      ${endString}`));
                            setTimeout(() => {
                                console.log(chalk.hex("#222").bgHex("#72C9C2").bold(`${endString}       safely       ${endString}`));
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
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
        return new Promise((resolve, reject) => {
            for (let obj of value) {
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
                console.log(chalk.white.bgHex("#2FDB8D").bold(`\n\n\n${startString} START OF SCRAPED FILE ${startString}`));
                console.log(fileText);
                console.log(chalk.hex("#222").bgHex("#FFFF51").bold(`${endString} END OF SCRAPED FILE ${endString}`));
                jetpack.dir(`documents/${baseDir}`)
                    .file(`${obj.questionSlug}.txt`, {content: fileText});
                resolve(true);
            }
        });
    }
}

new Water();
