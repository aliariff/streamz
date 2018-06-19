const cheerio = require('cheerio');
const fs = require('fs');
const opn = require('opn');
const puppeteer = require('puppeteer');
const rp = require('request-promise');
const url = require('url');

const websites = fs.readFileSync('./links.txt', 'utf-8').split('\n');
let currentChannel = null;

streamLive = async function(channelName) {
    console.log(`checking channel: ${channelName}`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.twitch.tv/${channelName}`, {
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
    console.log(`visiting: ${website}`);
    let result = [];
    let body;
    try {
        body = await rp(website);
    } catch (e) {
        return result;
    }
    let $ = cheerio.load(body);
    let links = $('iframe');
    $(links).each(function(i, link) {
        const src = $(link).attr('src');
        const channel = url.parse(src, true).query.channel;
        result.push(channel);
    });
    return result;
};

findNewChannel = async function() {
    console.log('findNewChannel');
    let allChannels = await Promise.all(getChannelPromises);
    allChannels = [].concat(...allChannels);
    console.log(`all available channels: ${allChannels}`);
    let streamLivePromises = [];
    allChannels.forEach(function(channelName) {
        streamLivePromises.push(streamLive(channelName));
    });
    let liveChannels = await Promise.all(streamLivePromises);
    liveChannels.forEach(function(liveChannel) {
        if (liveChannel != null) {
            console.log(`Found live channel: ${liveChannel}`);
            currentChannel = liveChannel;
            opn(`https://player.twitch.tv/?channel=${liveChannel}`);
        }
    });
};

crawler = async function() {
    if (currentChannel == null) {
        await findNewChannel();
    } else {
        const channel = await streamLive(currentChannel);
        currentChannel = channel;
    }
};

main = async function() {
    while (true) {
        await crawler();
    }
};

let getChannelPromises = [];
websites.forEach(function(website) {
    getChannelPromises.push(getChannel(website));
});

main();