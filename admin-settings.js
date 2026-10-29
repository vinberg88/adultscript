const fs = require('fs/promises');
const path = require('path');
const { readSiteConfig } = require('./config');

const FILE = path.join(__dirname, 'data', 'admin-settings.json');
const THEMES = ['midnight', 'ocean', 'forest', 'sunset'];
const defaults = Object.freeze({ theme: 'midnight', accent: '#ff9900', autoImport: true, importHour: 0, importPages: 1, importSearch: '' });

function validate(input) {
    const theme = String(input.theme || '');
    const accent = String(input.accent || '');
    const hour = Number(input.importHour);
    const pages = Number(input.importPages);
    const search = String(input.importSearch || '').trim();
    if (!THEMES.includes(theme)) throw new Error('Välj ett giltigt tema');
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) throw new Error('Färgen måste vara #RRGGBB');
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Välj en timme mellan 0 och 23');
    if (!Number.isInteger(pages) || pages < 1 || pages > 5) throw new Error('Välj 1–5 importsidor');
    if (search.length > 100) throw new Error('Sökordet får vara högst 100 tecken');
    return { theme, accent, autoImport: input.autoImport === true || input.autoImport === 'on', importHour: hour, importPages: pages, importSearch: search };
}

async function readSettings(file = FILE) {
    try {
        const saved = JSON.parse(await fs.readFile(file, 'utf8'));
        return { ...validate(saved), saved: true };
    } catch (error) {
        if (error.code === 'ENOENT') {
            const config = await readSiteConfig();
            const pages = Number(config?.pornhubImportPages ?? process.env.PORN_HUB_IMPORT_PAGES ?? 1);
            const search = String(config?.pornhubSearch ?? process.env.PORN_HUB_SEARCH ?? '').slice(0, 100);
            return { ...defaults, importPages: Number.isInteger(pages) && pages >= 1 && pages <= 5 ? pages : 1, importSearch: search, saved: false };
        }
        throw error;
    }
}

async function writeSettings(input, file = FILE) {
    const settings = validate(input);
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    try {
        await fs.writeFile(temporary, JSON.stringify(settings, null, 2), { flag: 'wx', mode: 0o600 });
        await fs.rename(temporary, file);
    } finally {
        await fs.rm(temporary, { force: true });
    }
    return settings;
}

module.exports = { FILE, THEMES, defaults, validate, readSettings, writeSettings };
