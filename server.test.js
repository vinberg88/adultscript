const test = require('node:test');
const assert = require('node:assert/strict');
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
