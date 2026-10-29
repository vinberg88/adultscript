const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { importVideos } = require('./importer');

test('imports real metadata once and preserves existing records', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-test-'));
    const dataFile = path.join(dir, 'videos.json');
    const existing = [{ id: 'old', source: 'Automated', url: 'https://example.com' }];
    const record = { video_id: 'abc123', title: 'Example', default_thumb: 'https://example.com/thumb.jpg', publish_date: '2026-10-29', categories: [{ category: 'amateur' }, { category: 'solo-female' }] };
    const fakeFetch = async () => ({ ok: true, json: async () => ({ videos: [record, record] }) });
    try {
        await fs.writeJson(dataFile, existing);
        const first = await importVideos({ fetchImpl: fakeFetch, dataFile, pages: 1 });
        const second = await importVideos({ fetchImpl: fakeFetch, dataFile, pages: 1 });
        const stored = await fs.readJson(dataFile);
        assert.deepEqual([first.added, second.added], [1, 0]);
        assert.equal(stored.length, 2);
        assert.deepEqual(stored[0], existing[0]);
        assert.equal(stored[1].embedUrl, 'https://www.pornhub.com/embed/abc123');
        assert.deepEqual(stored[1].categories, ['amateur', 'solo-female']);
    } finally {
        await fs.remove(dir);
    }
});

test('adds source categories to existing videos without changing their other metadata', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-categories-'));
    const dataFile = path.join(dir, 'videos.json');
    const existing = [{ id: 'pornhub-abc123', sourceId: 'abc123', source: 'Pornhub', title: 'Kept title', url: 'https://www.pornhub.com/view_video.php?viewkey=abc123' }];
    const record = { video_id: 'abc123', title: 'New title', default_thumb: 'https://example.com/thumb.jpg', categories: [{ category: 'milf' }, { category: 'brunette' }] };
    const fakeFetch = async () => ({ ok: true, json: async () => ({ videos: [record] }) });
    try {
        await fs.writeJson(dataFile, existing);
        const first = await importVideos({ fetchImpl: fakeFetch, dataFile, pages: 1 });
        const second = await importVideos({ fetchImpl: fakeFetch, dataFile, pages: 1 });
        const stored = await fs.readJson(dataFile);
        assert.deepEqual([first.added, first.enriched, second.added, second.enriched], [0, 1, 0, 0]);
        assert.deepEqual(stored, [{ ...existing[0], categories: ['milf', 'brunette'] }]);
    } finally {
        await fs.remove(dir);
    }
});

test('failed API response never changes existing data', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-test-'));
    const dataFile = path.join(dir, 'videos.json');
    try {
        await fs.writeJson(dataFile, [{ id: 'old' }]);
        const before = await fs.readFile(dataFile, 'utf8');
        await assert.rejects(importVideos({ fetchImpl: async () => ({ ok: false, status: 503 }), dataFile }), /HTTP 503/);
        assert.equal(await fs.readFile(dataFile, 'utf8'), before);
    } finally {
        await fs.remove(dir);
    }
});
