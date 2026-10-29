const test = require('node:test');
const assert = require('node:assert/strict');
const { siteRows, renderCsv } = require('./site-plan');

test('prepares every unique link domain without putting secrets in the plan', () => {
    const rows = siteRows();
    assert.equal(rows.length, 64);
    assert.equal(new Set(rows.map(row => row.domain)).size, 64);
    assert.equal(rows.find(row => row.domain === 'swehub.com').name, 'SweHub');
    const csv = renderCsv(rows);
    assert.match(csv, /^\uFEFFdomain;name;status;search;accent\r\n/);
    assert.doesNotMatch(csv, /password|token|secret/i);
    assert.throws(() => siteRows([['A', 'https://a.example'], ['B', 'https://www.a.example']]), /Dubblett/);
});
