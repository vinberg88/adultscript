const test = require('node:test');
const assert = require('node:assert/strict');
const { suggest } = require('./admin-ai');

test('AI suggestions send only aggregate counts and never write catalog data', async () => {
    let request;
    const fetchImpl = async (_url, options) => {
        request = options;
        return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: 'Kontrollera importen.' }] }] }) };
    };
    const result = await suggest('import', {
        site: { name: 'Test', domain: 'example.com' },
        videos: [{ title: 'Private title', source: 'Pornhub' }],
        settings: { autoImport: true, importHour: 0, importPages: 1 },
        fetchImpl,
        env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }
    });
    assert.equal(result, 'Kontrollera importen.');
    assert.doesNotMatch(request.body, /Private title|test-key/);
    assert.equal(JSON.parse(request.body).store, false);
    await assert.rejects(suggest('text', { site: {}, videos: [], settings: {}, env: {} }), /OPENAI_API_KEY/);
});
