const test = require('node:test');
const assert = require('node:assert/strict');
const ejs = require('ejs');
const path = require('path');
const { app } = require('./index');

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
        thumbnail: 'https://example.com/thumb.jpg', duration: '11:26', views: 3362, rating: 80
    };
    const home = await ejs.renderFile(path.join(__dirname, 'views/index.ejs'), { videos: [video], sort: 'latest' });
    const detail = await ejs.renderFile(path.join(__dirname, 'views/video.ejs'), { video, related: [] });
    assert.match(home, /11:26/);
    assert.match(home, /3\s?362/);
    assert.match(detail, /https:\/\/www\.pornhub\.com\/embed\/abc123/);
    assert.doesNotMatch(home, /05:20/);
});

