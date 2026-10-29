const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { app } = require('./index');

test('installer is hidden until a long installation code is configured', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/install`);
        assert.equal(response.status, 404);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('installer requires its code, stores a password hash, and closes after setup', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'adultscript-install-'));
    const file = path.join(directory, 'site.json');
    process.env.SITE_CONFIG_FILE = file;
    process.env.INSTALL_TOKEN = '0123456789abcdef0123456789abcdef';
    process.env.ADMIN_PASSWORD = 'old-environment-password';
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const form = new URLSearchParams({
        token: process.env.INSTALL_TOKEN, adminUser: 'owner', password: 'a-long-test-password',
        confirmPassword: 'a-long-test-password', pages: '2', search: 'example'
    });
    try {
        assert.equal((await fetch(`${base}/install`)).status, 200);
        assert.equal((await fetch(`${base}/install`, { method: 'POST', body: form, headers: { origin: 'https://other.example' } })).status, 403);
        assert.equal((await fetch(`${base}/install`, {
            method: 'POST', body: JSON.stringify(Object.fromEntries(form)),
            headers: { origin: base, 'content-type': 'application/json' }
        })).status, 415);
        const wrong = new URLSearchParams(form);
        wrong.set('token', 'incorrect');
        assert.equal((await fetch(`${base}/install`, { method: 'POST', body: wrong, headers: { origin: base } })).status, 403);
        await assert.rejects(fs.access(file));

        const installed = await fetch(`${base}/install`, { method: 'POST', body: form, headers: { origin: base }, redirect: 'manual' });
        assert.equal(installed.status, 302);
        const saved = await fs.readFile(file, 'utf8');
        assert.doesNotMatch(saved, /a-long-test-password/);
        assert.equal(JSON.parse(saved).pornhubImportPages, 2);
        if (process.platform !== 'win32') assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
        assert.equal((await fetch(`${base}/install`)).status, 404);
        const authorization = `Basic ${Buffer.from('owner:a-long-test-password').toString('base64')}`;
        assert.equal((await fetch(`${base}/secret-admin-panel-777`, { headers: { authorization } })).status, 200);
        const oldAuthorization = `Basic ${Buffer.from('admin:old-environment-password').toString('base64')}`;
        assert.equal((await fetch(`${base}/secret-admin-panel-777`, { headers: { authorization: oldAuthorization } })).status, 401);
    } finally {
        await new Promise(resolve => server.close(resolve));
        await fs.rm(directory, { recursive: true, force: true });
        delete process.env.SITE_CONFIG_FILE;
        delete process.env.INSTALL_TOKEN;
        delete process.env.ADMIN_PASSWORD;
    }
});
