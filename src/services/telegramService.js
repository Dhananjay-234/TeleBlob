const axios = require('axios');
const FormData = require('form-data');
const { config } = require('../config/env');

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Upload file to Telegram
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} - Telegram file_id
 */
async function uploadFile(fileBuffer, filename, mimeType) {
    const botToken = config.telegram.botToken;
    const chatId = config.telegram.chatId;

    // Determine the appropriate method based on MIME type
    let method = 'sendDocument';
    if (mimeType.startsWith('image/')) {
        method = 'sendPhoto';
    } else if (mimeType.startsWith('video/')) {
        method = 'sendVideo';
    }

    const url = `${TELEGRAM_API_BASE}/bot${botToken}/${method}`;

    const formData = new FormData();
    formData.append('chat_id', chatId);

    // Append file with appropriate field name
    const fieldName = method === 'sendPhoto' ? 'photo' : method === 'sendVideo' ? 'video' : 'document';
    formData.append(fieldName, fileBuffer, {
        filename: filename,
        contentType: mimeType
    });

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data.description}`);
        }

        // Extract file_id from response
        let fileId;
        if (method === 'sendPhoto') {
            // Photos return an array, get the largest size
            const photos = response.data.result.photo;
            fileId = photos[photos.length - 1].file_id;
        } else if (method === 'sendVideo') {
            fileId = response.data.result.video.file_id;
        } else {
            fileId = response.data.result.document.file_id;
        }

        console.log(`✅ Uploaded to Telegram: ${fileId}`);
        return fileId;
    } catch (error) {
        console.error('❌ Telegram upload error:', error.message);
        throw new Error(`Failed to upload to Telegram: ${error.message}`);
    }
}

/**
 * Get file download URL from Telegram
 * @param {string} fileId - Telegram file_id
 * @returns {Promise<string>} - Download URL
 */
async function getFileUrl(fileId) {
    const botToken = config.telegram.botToken;
    const url = `${TELEGRAM_API_BASE}/bot${botToken}/getFile?file_id=${fileId}`;

    try {
        const response = await axios.get(url);

        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data.description}`);
        }

        const filePath = response.data.result.file_path;
        const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${filePath}`;

        return downloadUrl;
    } catch (error) {
        console.error('❌ Telegram getFile error:', error.message);
        throw new Error(`Failed to get file from Telegram: ${error.message}`);
    }
}

/**
 * Download file from Telegram
 * @param {string} fileId - Telegram file_id
 * @returns {Promise<Buffer>} - File buffer
 */
async function downloadFile(fileId) {
    try {
        const downloadUrl = await getFileUrl(fileId);

        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer'
        });

        console.log(`✅ Downloaded from Telegram: ${fileId}`);
        return Buffer.from(response.data);
    } catch (error) {
        console.error('❌ Telegram download error:', error.message);
        throw new Error(`Failed to download from Telegram: ${error.message}`);
    }
}

module.exports = {
    uploadFile,
    getFileUrl,
    downloadFile
};
