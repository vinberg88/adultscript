const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCategories, categoryCounts } = require('./categories');

test('uses only valid provider category slugs and counts each film once', () => {
    assert.deepEqual(normalizeCategories([{ category: 'Amateur' }, { category: 'amateur' }, { category: 'solo-female' }, { category: 'bad<script>' }]), ['amateur', 'solo-female']);
    const counts = categoryCounts([
        { categories: ['amateur', 'amateur', 'solo-female'] },
        { categories: [{ category: 'amateur' }] },
        { categories: [] }
    ]);
    assert.deepEqual(counts, [
        { slug: 'amateur', label: 'Amateur', count: 2 },
        { slug: 'solo-female', label: 'Solo Female', count: 1 }
    ]);
});
