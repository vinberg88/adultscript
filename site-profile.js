const links = require('./links.json');

const names = new Map(links.map(([name, url]) => [new URL(url).hostname.replace(/^www\./, '').toLowerCase(), name.trim()]));

function siteForHost(host, env = process.env) {
    let domain;
    try { domain = new URL(`http://${host || 'localhost'}`).hostname.replace(/^www\./, '').toLowerCase(); }
    catch { domain = 'localhost'; }
    const fallback = domain === 'localhost' ? 'AdultScript' : domain.split('.')[0].replace(/(^|[-_])([a-z])/g, (_, separator, letter) => `${separator ? ' ' : ''}${letter.toUpperCase()}`);
    const name = String(env.SITE_NAME || '').trim().slice(0, 80) || names.get(domain) || fallback;
    const accent = /^#[0-9a-fA-F]{6}$/.test(env.SITE_ACCENT || '') ? env.SITE_ACCENT : '#ff9900';
    return { domain, name, accent };
}

module.exports = { siteForHost };
