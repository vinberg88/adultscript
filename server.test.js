const test = require('node:test');
const assert = require('node:assert/strict');
const ejs = require('ejs');
const path = require('path');
const http = require('http');
const { app } = require('./index');
const { siteForHost, siteWithSettings } = require('./site-profile');
const { paginate } = require('./pagination');

test('admin requires a password and rejects cross-site writes', async () => {
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = 'test-only-password';
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const unauthenticated = await fetch(`${base}/secret-admin-panel-777`);
        assert.equal(unauthenticated.status, 401);
        const authorization = `Basic ${Buffer.from('admin:test-only-password').toString('base64')}`;
        const authenticated = await fetch(`${base}/secret-admin-panel-777`, { headers: { authorization } });
        assert.equal(authenticated.status, 200);
        const adminHtml = await authenticated.text();
        assert.match(adminHtml, /Utseende och automatisk import/);
        assert.match(adminHtml, /Föreslå sajttext/);
        const crossSite = await fetch(`${base}/admin/force-import`, {
            method: 'POST', headers: { authorization, origin: 'https://attacker.example' }
        });
        assert.equal(crossSite.status, 403);
    } finally {
        await new Promise(resolve => server.close(resolve));
        if (previous === undefined) delete process.env.ADMIN_PASSWORD;
        else process.env.ADMIN_PASSWORD = previous;
    }
});

test('renders imported metadata and the Pornhub embed URL', async () => {
    const video = {
        id: 'pornhub-abc123', title: 'Example', source: 'Pornhub',
        url: 'https://www.pornhub.com/view_video.php?viewkey=abc123',
        embedUrl: 'https://www.pornhub.com/embed/abc123',
        thumbnail: 'https://example.com/thumb.jpg', duration: '11:26', views: 3362, rating: 90.9091
    };
    const site = siteForHost('snusk.eu');
    const ads = { top: { enabled: false }, bottom: { enabled: false } };
    const home = await ejs.renderFile(path.join(__dirname, 'views/index.ejs'), { ...paginate([video], 1), sort: 'latest', site, ads, categories: [], selectedCategory: '', categorySuffix: '' });
    const detail = await ejs.renderFile(path.join(__dirname, 'views/video.ejs'), { video, related: [], site, ads, videoCategories: [] });
    assert.match(home, /11:26/);
    assert.match(home, /3\s?362/);
    assert.match(home, /90,9%/);
    assert.match(detail, /90,9%/);
    assert.doesNotMatch(home, /90\.9091%/);
    assert.match(detail, /https:\/\/www\.pornhub\.com\/embed\/abc123/);
    assert.doesNotMatch(home, /05:20/);
    assert.match(home, /Snusk - Filmer/);
    const themedSite = siteWithSettings(site, { theme: 'forest', accent: '#123abc', saved: true });
    const themedHome = await ejs.renderFile(path.join(__dirname, 'views/index.ejs'), { ...paginate([video], 1), sort: 'latest', site: themedSite, ads, categories: [], selectedCategory: '', categorySuffix: '' });
    assert.match(themedHome, /class="site-theme-forest" style="--accent: #123abc"/);
});

test('public pages use the requested domain name', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const getForHost = host => new Promise((resolve, reject) => {
            http.get({ hostname: '127.0.0.1', port: server.address().port, path: '/', headers: { Host: host } }, response => {
                let body = '';
                response.setEncoding('utf8');
                response.on('data', chunk => { body += chunk; });
                response.on('end', () => resolve(body));
            }).on('error', reject);
        });
        const snusk = await getForHost('snusk.eu');
        const swehub = await getForHost('swehub.com');
        assert.match(snusk, /<title>Snusk - Filmer<\/title>/);
        assert.match(swehub, /<title>SweHub - Filmer<\/title>/);
        assert.doesNotMatch(snusk, /gratis-erotik\.se/);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('category links keep the active filter when films span multiple pages', async () => {
    const site = siteForHost('gratis-erotik.se');
    const ads = { top: { enabled: false }, bottom: { enabled: false } };
    const categories = [{ slug: 'amateur', label: 'Amateur', count: 101 }];
    const videos = Array.from({ length: 101 }, (_, index) => ({ id: `film-${index}`, title: `Film ${index}`, thumbnail: 'https://example.com/thumb.jpg' }));
    const home = await ejs.renderFile(path.join(__dirname, 'views/index.ejs'), {
        ...paginate(videos, 1), sort: 'latest', site, ads, categories, selectedCategory: 'amateur', categorySuffix: '&category=amateur'
    });
    const directory = await ejs.renderFile(path.join(__dirname, 'views/categories.ejs'), { site, ads, categories });
    assert.match(home, /sort=latest&amp;category=amateur&amp;page=2#filmer/);
    assert.match(directory, /\?category=amateur#filmer/);
    assert.match(directory, /101 filmer/);
});

