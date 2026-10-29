const test = require('node:test');
const assert = require('node:assert/strict');
const { siteForHost, siteWithSettings } = require('./site-profile');

test('selects a site name from the domain list and keeps overrides safe', () => {
    assert.equal(siteForHost('www.swehub.com:443', {}).name, 'SweHub');
    assert.equal(siteForHost('snusk.eu', {}).name, 'Snusk');
    assert.deepEqual(siteForHost('porr.xxx', { SITE_NAME: 'Eget namn', SITE_ACCENT: '#123abc' }), {
        domain: 'porr.xxx', name: 'Eget namn', accent: '#123abc'
    });
    assert.equal(siteForHost('porr.xxx', { SITE_ACCENT: 'red; color: blue' }).accent, '#ff9900');
});

test('saved appearance changes the public site while an unsaved setting keeps its domain accent', () => {
    const site = siteForHost('kungligporr.eu', { SITE_ACCENT: '#123abc' });
    assert.deepEqual(siteWithSettings(site, { theme: 'forest', accent: '#abcdef', saved: true }), {
        ...site, theme: 'forest', accent: '#abcdef'
    });
    assert.equal(siteWithSettings(site, { theme: 'midnight', accent: '#ff9900', saved: false }).accent, '#123abc');
});
