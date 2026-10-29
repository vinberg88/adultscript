const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { readSettings, writeSettings, validate } = require('./admin-settings');

test('admin settings are validated and persist per app', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-settings-'));
    const file = path.join(directory, 'admin-settings.json');
    try {
        assert.equal((await readSettings(file)).saved, false);
        const saved = await writeSettings({ theme: 'ocean', accent: '#123abc', autoImport: 'on', importHour: '7', importPages: '3', importSearch: 'test' }, file);
        assert.equal(saved.importHour, 7);
        assert.deepEqual(await readSettings(file), { ...saved, saved: true });
        await assert.rejects(writeSettings({ ...saved, theme: 'unknown' }, file), /tema/);
        assert.deepEqual(await readSettings(file), { ...saved, saved: true });
        assert.equal(validate({ ...saved, autoImport: undefined }).autoImport, false);
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});
