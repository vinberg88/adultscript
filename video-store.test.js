const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { ensureVideoFile, readVideos, writeVideos } = require('./video-store');

test('copies an existing catalog once and keeps later data independent of the old file', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-store-'));
    const legacy = path.join(dir, 'videos.json');
    const current = path.join(dir, 'data', 'videos.json');
    try {
        await fs.writeJson(legacy, [{ id: 'old' }]);
        await ensureVideoFile(current, legacy);
        assert.deepEqual(await readVideos(current), [{ id: 'old' }]);
        await writeVideos([{ id: 'new' }], current);
        await ensureVideoFile(current, legacy);
        assert.deepEqual(await readVideos(current), [{ id: 'new' }]);
        assert.deepEqual(await fs.readJson(legacy), [{ id: 'old' }]);
    } finally {
        await fs.remove(dir);
    }
});
