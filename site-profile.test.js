const test = require('node:test');
const assert = require('node:assert/strict');
const { siteForHost } = require('./site-profile');

test('selects a site name from the domain list and keeps overrides safe', () => {
    assert.equal(siteForHost('www.swehub.com:443', {}).name, 'SweHub');
    assert.equal(siteForHost('snusk.eu', {}).name, 'Snusk');
    assert.deepEqual(siteForHost('porr.xxx', { SITE_NAME: 'Eget namn', SITE_ACCENT: '#123abc' }), {
        domain: 'porr.xxx', name: 'Eget namn', accent: '#123abc'
    });
    assert.equal(siteForHost('porr.xxx', { SITE_ACCENT: 'red; color: blue' }).accent, '#ff9900');
});
