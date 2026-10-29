const test = require('node:test');
const assert = require('node:assert/strict');
const { paginate } = require('./pagination');

test('splits a sorted catalog into pages of 100 without losing items', () => {
    const catalog = Array.from({ length: 205 }, (_, id) => ({ id }));
    const first = paginate(catalog, '1');
    const second = paginate(catalog, '2');
    const third = paginate(catalog, '3');
    assert.equal(first.videos.length, 100);
    assert.equal(second.videos.length, 100);
    assert.equal(third.videos.length, 5);
    assert.deepEqual([...first.videos, ...second.videos, ...third.videos], catalog);
    assert.deepEqual(second.pagination, { page: 2, totalPages: 3, total: 205, from: 101, to: 200, pages: [1, 2, 3] });
    assert.equal(paginate(catalog, '999').pagination.page, 3);
    assert.equal(paginate(catalog, '-1').pagination.page, 1);
    assert.equal(paginate([], '2').pagination.totalPages, 1);
});
