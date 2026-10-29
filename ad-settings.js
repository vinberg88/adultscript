const fs = require('fs/promises');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'ads.json');

function validUrl(value, label) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.length > 2048) throw new Error(`${label} är för lång`);
    let parsed;
    try { parsed = new URL(text); } catch { throw new Error(`${label} måste vara en giltig HTTPS-adress`); }
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
        throw new Error(`${label} måste vara en giltig HTTPS-adress utan inloggningsuppgifter`);
    }
    return parsed.toString();
}

function validateSlot(input, label) {
    const imageUrl = validUrl(input?.imageUrl, `${label}: bildadressen`);
    const targetUrl = validUrl(input?.targetUrl, `${label}: klickadressen`);
    const alt = String(input?.alt || '').trim();
    if (alt.length > 120) throw new Error(`${label}: beskrivningen får vara högst 120 tecken`);
    const enabled = (input?.enabled === true || input?.enabled === 'on') && Boolean(imageUrl);
    return { imageUrl, targetUrl, alt, enabled };
}

function validate(input) {
    return {
        top: validateSlot(input?.top, 'Övre annonsen'),
        bottom: validateSlot(input?.bottom, 'Nedre annonsen')
    };
}

async function readAds(file = FILE) {
    try {
        return validate(JSON.parse(await fs.readFile(file, 'utf8')));
    } catch (error) {
        if (error.code === 'ENOENT') return validate({
            top: { imageUrl: process.env.AD_TOP_IMAGE_URL, targetUrl: process.env.AD_TOP_TARGET_URL, alt: process.env.AD_TOP_ALT, enabled: Boolean(process.env.AD_TOP_IMAGE_URL) },
            bottom: { imageUrl: process.env.AD_BOTTOM_IMAGE_URL, targetUrl: process.env.AD_BOTTOM_TARGET_URL, alt: process.env.AD_BOTTOM_ALT, enabled: Boolean(process.env.AD_BOTTOM_IMAGE_URL) }
        });
        throw error;
    }
}

async function writeAds(input, file = FILE) {
    const ads = validate(input);
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    try {
        await fs.writeFile(temporary, JSON.stringify(ads, null, 2), { flag: 'wx', mode: 0o600 });
        await fs.rename(temporary, file);
    } finally {
        await fs.rm(temporary, { force: true });
    }
    return ads;
}

module.exports = { FILE, readAds, writeAds, validate };
