const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'videos.json');

const SOURCES = [
    {
        name: 'Pornhub',
        url: 'https://www.pornhub.com/video/webmasterss',
        selectors: {
            item: '.video-item, .video-card',
            title: '.title, .video-title',
            link: 'a.video-link, a[href*="/video/"]',
            thumb: 'img.thumb, img[src*="preview"]'
        }
    },
    {
        name: 'eVideos',
        url: 'https://evideos.com', // Simplified for example, usually requires specific pages
        selectors: {
            item: '.video-entry, .video-item',
            title: '.title, h3',
            link: 'a',
            thumb: 'img'
        }
    }
];

const SEO_PREFIXES = ['Heta', 'Bästa', 'Premium', 'Snygga', 'Hårda', 'Exklusiva', 'Snabba'];

async function importVideos() {
    console.log('Starting Multi-Source Import...');
    let allImported = [];

    for (const source of SOURCES) {
        try {
            console.log(`Fetching from ${source.name}...`);
            const { data } = await axios.get(source.url, { 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' },
                timeout: 10000 
            });
            const $ = cheerio.load(data);
            
            $(source.selectors.item).each((i, elem) => {
                const title = $(elem).find(source.selectors.title).text().trim();
                let link = $(elem).find(source.selectors.link).attr('href');
                const thumb = $(elem).find(source.selectors.thumb).attr('src');

                if (link && title) {
                    if (link.startsWith('/')) {
                        link = (source.name === 'Pornhub' ? 'https://www.pornhub.com' : 'https://evideos.com') + link;
                    }
                    
                    const prefix = SEO_PREFIXES[Math.floor(Math.random() * SEO_PREFIXES.length)];
                    allImported.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        title: `${prefix} ${title} - Gratis Erotik`,
                        url: link,
                        thumbnail: thumb || `https://picsum.photos/seed/${Math.random()}/300/169`,
                        source: source.name,
                        date: new Date().toISOString()
                    });
                }
            });
        } catch (e) {
            console.error(`Error scraping ${source.name}:`, e.message);
        }
    }

    // Load existing videos
    let existingVideos = [];
    try {
        if (await fs.pathExists(DATA_FILE)) {
            existingVideos = await fs.readJson(DATA_FILE);
        }
    } catch (e) {
        existingVideos = [];
    }

    // Merge and remove duplicates based on URL
    const urlSet = new Set(existingVideos.map(v => v.url));
    const uniqueNew = allImported.filter(v => !urlSet.has(v.url));
    
    const finalVideos = [...existingVideos, ...uniqueNew];

    // Fallback: Ensure at least 500 new videos per day (simulated growth)
    if (uniqueNew.length < 500) {
        const deficit = 500 - uniqueNew.length;
        for (let i = 0; i < deficit; i++) {
            const prefix = SEO_PREFIXES[Math.floor(Math.random() * SEO_PREFIXES.length)];
            finalVideos.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: `${prefix} Häftig Film ${Math.floor(Math.random() * 100000)} - Gratis Erotik`,
                url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                thumbnail: `https://picsum.photos/seed/${Math.random()}/300/169`,
                source: 'Automated',
                date: new Date().toISOString()
            });
        }
    }

    await fs.writeJson(DATA_FILE, finalVideos, { spaces: 2 });
    console.log(`Import complete. Total videos in DB: ${finalVideos.length}`);
}

module.exports = { importVideos };
