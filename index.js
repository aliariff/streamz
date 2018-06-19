const rp = require('request-promise');
const opn = require('opn');
const url = require('url');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const websites = [
    'http://footy-area.blogspot.com',
    'http://stream-cr7.net/twitch.html',
    'http://onetopstream.website/liver.php',
    'http://www.freesport.info',
    'http://www.bilasport.com/p/cup.html',
    'http://messistream.com/Soccer/Ronaldo7/hd2.html',
];

streamLive = async function(channelName) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.twitch.tv/' + channelName, {
        waitUntil: 'networkidle2'
    });
    const content = await page.content();
    await browser.close();

    if (content.includes('icon_live')) {
        return channelName;
    }
    return null;
};

getChannel = async function(website) {
    const body = await rp(website);
    let $ = cheerio.load(body);
    let links = $('iframe');
    let result = [];
    $(links).each(function(i, link) {
        const src = $(link).attr('src');
        const channel = url.parse(src, true).query.channel;
        result.push(channel);
    });
    return result;
};

main = async function() {
    let promises = [];
    websites.forEach(function(website) {
        promises.push(getChannel(website));
    });
    let allChannels = await Promise.all(promises);
    allChannels = [].concat(...allChannels);
    promises = [];
    allChannels.forEach(function(channelName) {
        promises.push(streamLive(channelName));
    });
    let liveChannels = await Promise.all(promises);
    liveChannels.forEach(function(liveChannel) {
        if (liveChannel != null) {
            opn('https://player.twitch.tv/?channel=' + liveChannel);
        }
    });
};

main();