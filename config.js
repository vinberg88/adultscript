const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const SITE_FILE = path.join(__dirname, 'data', 'site.json');
const configPath = () => process.env.SITE_CONFIG_FILE || SITE_FILE;
function setupError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function readSiteConfig(file = configPath()) {
    let text;
    try { text = await fs.readFile(file, 'utf8'); }
    catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
    const config = JSON.parse(text);
    if (!config || typeof config.installedAt !== 'string' || typeof config.adminUser !== 'string' ||
        typeof config.passwordSalt !== 'string' || typeof config.passwordHash !== 'string') {
        throw new Error('Invalid site configuration');
    }
    return config;
}

function safeEqual(a, b) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyAdminPassword(password, config) {
    if (!config || typeof password !== 'string') return false;
    const expected = Buffer.from(config.passwordHash, 'hex');
    if (expected.length !== 64) return false;
    const actual = crypto.scryptSync(password, Buffer.from(config.passwordSalt, 'hex'), 64);
    return crypto.timingSafeEqual(actual, expected);
}

async function createSiteConfig(input, { file = configPath(), installToken = process.env.INSTALL_TOKEN } = {}) {
    if (!installToken || installToken.length < 32) throw setupError('Installationen är inte aktiverad', 404);
    if (!safeEqual(String(input.token || ''), installToken)) throw setupError('Fel installationskod', 403);
    if (await readSiteConfig(file)) throw setupError('Sajten är redan installerad', 409);

    const adminUser = String(input.adminUser || '').trim();
    const password = String(input.password || '');
    const search = String(input.search || '').trim();
    const pages = Number(input.pages);
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(adminUser)) throw setupError('Adminnamnet måste vara 3–32 tecken: bokstäver, siffror, _ eller -');
    if (password.length < 12 || password.length > 256) throw setupError('Adminlösenordet måste vara 12–256 tecken');
    if (password !== String(input.confirmPassword || '')) throw setupError('Lösenorden stämmer inte överens');
    if (!Number.isInteger(pages) || pages < 1 || pages > 5) throw setupError('Välj mellan 1 och 5 importsidor');
    if (search.length > 100) throw setupError('Sökordet är för långt');

    const salt = crypto.randomBytes(16);
    const config = {
        installedAt: new Date().toISOString(), adminUser,
        passwordSalt: salt.toString('hex'),
        passwordHash: crypto.scryptSync(password, salt, 64).toString('hex'),
        pornhubImportPages: pages, pornhubSearch: search
    };

    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const lockFile = `${file}.lock`;
    const lock = await fs.open(lockFile, 'wx', 0o600);
    const temporary = `${file}.${process.pid}.tmp`;
    try {
        if (await readSiteConfig(file)) throw setupError('Sajten är redan installerad', 409);
        await fs.writeFile(temporary, JSON.stringify(config, null, 2), { flag: 'wx', mode: 0o600 });
        await fs.rename(temporary, file);
        return { installedAt: config.installedAt, adminUser, pornhubImportPages: pages, pornhubSearch: search };
    } finally {
        await lock.close();
        await fs.rm(lockFile, { force: true });
        await fs.rm(temporary, { force: true });
    }
}

module.exports = { SITE_FILE, readSiteConfig, createSiteConfig, verifyAdminPassword, safeEqual };
