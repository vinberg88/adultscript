const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'videos.json');
const LEGACY_FILE = path.join(__dirname, 'videos.json');

async function ensureVideoFile(file = DATA_FILE, legacyFile = file === DATA_FILE ? LEGACY_FILE : null) {
    if (await fs.pathExists(file)) return;
    await fs.ensureDir(path.dirname(file));
    if (legacyFile && await fs.pathExists(legacyFile)) {
        try {
            await fs.copy(legacyFile, file, { overwrite: false, errorOnExist: true });
            return;
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }
    try {
        await fs.writeFile(file, '[]\n', { flag: 'wx' });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

async function readVideos(file = DATA_FILE) {
    await ensureVideoFile(file);
    const videos = await fs.readJson(file);
    if (!Array.isArray(videos)) throw new Error('videos.json must contain an array');
    return videos;
}

async function writeVideos(videos, file = DATA_FILE) {
    if (!Array.isArray(videos)) throw new TypeError('videos must be an array');
    await fs.ensureDir(path.dirname(file));
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    try {
        await fs.writeJson(temporary, videos, { spaces: 2 });
        await fs.rename(temporary, file);
    } finally {
        await fs.remove(temporary);
    }
}

module.exports = { DATA_FILE, LEGACY_FILE, ensureVideoFile, readVideos, writeVideos };
