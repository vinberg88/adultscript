const fs = require('fs');
const path = require('path');
const links = require('../links.json');

function csvCell(value) {
    const text = String(value ?? '');
    return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function siteRows(entries = links) {
    const seen = new Set();
    return entries.map(([name, rawUrl]) => {
        const url = new URL(rawUrl);
        if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
            throw new Error(`Ogiltig domänadress i links.json: ${rawUrl}`);
        }
        const domain = url.hostname.replace(/^www\./, '').toLowerCase();
        if (seen.has(domain)) throw new Error(`Dubblett i links.json: ${domain}`);
        seen.add(domain);
        return { domain, name: String(name).trim(), status: '', search: '', accent: '' };
    });
}

function renderCsv(rows) {
    const columns = ['domain', 'name', 'status', 'search', 'accent'];
    return '\uFEFF' + [columns.join(';'), ...rows.map(row => columns.map(key => csvCell(row[key])).join(';'))].join('\r\n') + '\r\n';
}

if (require.main === module) {
    const output = process.argv[2];
    if (!output) {
        console.error('Användning: node scripts/site-plan.js SÖKVÄG_TILL_CSV');
        process.exitCode = 2;
    } else {
        try {
            const rows = siteRows();
            fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
            fs.writeFileSync(output, renderCsv(rows), { flag: 'wx' });
            console.log(`Skapade plan för ${rows.length} unika domäner: ${path.resolve(output)}`);
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

module.exports = { siteRows, renderCsv };
