const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const ejs = require('ejs');
const { readAds, writeAds } = require('./ad-settings');

test('ads stay separate per app and render only the chosen image and target', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-ads-'));
    const file = path.join(directory, 'ads.json');
    try {
        const empty = await readAds(file);
        assert.equal(empty.top.enabled, false);
        const saved = await writeAds({
            top: { imageUrl: 'https://club24.com.es/banner.webp', targetUrl: 'https://linje24.se/', alt: 'Linje24', enabled: 'on' },
            bottom: { imageUrl: 'https://club24.com.es/banner.webp', targetUrl: 'https://linje24.se/', alt: 'Linje24', enabled: 'on' }
        }, file);
        assert.deepEqual(await readAds(file), saved);
        const html = await ejs.renderFile(path.join(__dirname, 'views/partials/ad-top.ejs'), { ads: saved });
        assert.match(html, /href="https:\/\/linje24\.se\/"/);
        assert.match(html, /src="https:\/\/club24\.com\.es\/banner\.webp"/);
        assert.match(html, /rel="sponsored noopener noreferrer"/);
        await assert.rejects(writeAds({ top: { imageUrl: 'javascript:alert(1)', enabled: 'on' } }, file), /HTTPS/);
        assert.deepEqual(await readAds(file), saved);
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});
