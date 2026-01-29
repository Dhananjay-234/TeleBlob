const { getFirestore } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const COLLECTION_NAME = 'media';

/**
 * Save media metadata to Firestore
 * @param {Object} mediaData - Media metadata
 * @returns {Promise<string>} - Document ID
 */
async function saveMedia(mediaData) {
    const db = getFirestore();
    const mediaId = uuidv4();

    const docData = {
        id: mediaId,
        telegram_file_id: mediaData.telegramFileId,
        file_type: mediaData.fileType,
        original_name: mediaData.originalName,
        size: mediaData.size,
        created_at: new Date()
    };

    await db.collection(COLLECTION_NAME).doc(mediaId).set(docData);

    console.log(`✅ Saved media metadata: ${mediaId}`);
    return mediaId;
}

/**
 * Get media metadata by ID
 * @param {string} mediaId - Media ID
 * @returns {Promise<Object|null>} - Media metadata or null
 */
async function getMediaById(mediaId) {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(mediaId);
    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    return doc.data();
}

/**
 * Get all media (for admin purposes)
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} - Array of media metadata
 */
async function getAllMedia(limit = 100) {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();

    const media = [];
    snapshot.forEach(doc => {
        media.push(doc.data());
    });

    return media;
}

/**
 * Delete media metadata
 * @param {string} mediaId - Media ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMedia(mediaId) {
    const db = getFirestore();
    await db.collection(COLLECTION_NAME).doc(mediaId).delete();
    console.log(`🗑️  Deleted media metadata: ${mediaId}`);
    return true;
}

module.exports = {
    saveMedia,
    getMediaById,
    getAllMedia,
    deleteMedia
};
