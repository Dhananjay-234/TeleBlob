const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { config } = require('../config/env');

const CACHE_DIR = config.cache.dir;
const CACHE_TTL_MS = config.cache.ttlSeconds * 1000;

// Ensure cache directory exists
fs.ensureDirSync(CACHE_DIR);

/**
 * Generate cache key from media ID
 * @param {string} mediaId - Media ID
 * @returns {string} - Cache file path
 */
function getCachePath(mediaId) {
    const hash = crypto.createHash('md5').update(mediaId).digest('hex');
    return path.join(CACHE_DIR, hash);
}

/**
 * Check if cached file exists and is valid
 * @param {string} mediaId - Media ID
 * @returns {Promise<boolean>} - True if cache is valid
 */
async function isCacheValid(mediaId) {
    const cachePath = getCachePath(mediaId);

    try {
        const stats = await fs.stat(cachePath);
        const age = Date.now() - stats.mtimeMs;

        if (age < CACHE_TTL_MS) {
            return true;
        } else {
            // Cache expired, delete it
            await fs.remove(cachePath);
            return false;
        }
    } catch (error) {
        // File doesn't exist
        return false;
    }
}

/**
 * Get cached file
 * @param {string} mediaId - Media ID
 * @returns {Promise<Buffer|null>} - File buffer or null if not cached
 */
async function getCachedFile(mediaId) {
    const cachePath = getCachePath(mediaId);

    if (await isCacheValid(mediaId)) {
        console.log(`📦 Cache HIT: ${mediaId}`);
        return await fs.readFile(cachePath);
    }

    console.log(`📭 Cache MISS: ${mediaId}`);
    return null;
}

/**
 * Save file to cache
 * @param {string} mediaId - Media ID
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Promise<void>}
 */
async function cacheFile(mediaId, fileBuffer) {
    const cachePath = getCachePath(mediaId);
    await fs.writeFile(cachePath, fileBuffer);
    console.log(`💾 Cached file: ${mediaId}`);
}

/**
 * Clear expired cache files
 * @returns {Promise<number>} - Number of files deleted
 */
async function clearExpiredCache() {
    const files = await fs.readdir(CACHE_DIR);
    let deletedCount = 0;

    for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtimeMs;

        if (age >= CACHE_TTL_MS) {
            await fs.remove(filePath);
            deletedCount++;
        }
    }

    if (deletedCount > 0) {
        console.log(`🧹 Cleared ${deletedCount} expired cache files`);
    }

    return deletedCount;
}

/**
 * Clear all cache
 * @returns {Promise<void>}
 */
async function clearAllCache() {
    await fs.emptyDir(CACHE_DIR);
    console.log('🧹 Cleared all cache');
}

module.exports = {
    getCachedFile,
    cacheFile,
    isCacheValid,
    clearExpiredCache,
    clearAllCache
};
