const telegramService = require('../services/telegramService');
const mediaRepository = require('../services/mediaRepository');
const cacheService = require('../services/cacheService');

/**
 * Upload media file
 * POST /api/upload
 */
async function uploadMedia(req, res) {
    try {
        console.log('📨 Upload request received');

        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const file = req.file;
        console.log(`📄 File received: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`);

        // Validate file type (images and videos only)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime'];
        if (!allowedTypes.includes(file.mimetype)) {
            console.log(`❌ Invalid file type: ${file.mimetype}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid file type. Only images and videos are allowed.'
            });
        }

        console.log(`📤 Uploading to Telegram: ${file.originalname} (${file.size} bytes)`);

        // Upload to Telegram
        const telegramFileId = await telegramService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        console.log(`✅ Telegram upload successful. File ID: ${telegramFileId}`);

        // Save metadata to Firestore
        console.log('💾 Saving metadata to Firestore...');
        const mediaId = await mediaRepository.saveMedia({
            telegramFileId: telegramFileId,
            fileType: file.mimetype,
            originalName: file.originalname,
            size: file.size
        });

        console.log(`✅ Metadata saved. Media ID: ${mediaId}`);

        res.status(201).json({
            success: true,
            data: {
                media_id: mediaId,
                file_type: file.mimetype,
                size: file.size,
                original_name: file.originalname
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to upload file',
            message: error.message
        });
    }
}

/**
 * Fetch media file
 * GET /api/media/:id
 */
async function fetchMedia(req, res) {
    try {
        const mediaId = req.params.id;

        // Get metadata from Firestore
        const metadata = await mediaRepository.getMediaById(mediaId);

        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: 'Media not found'
            });
        }

        // Check cache first
        let fileBuffer = await cacheService.getCachedFile(mediaId);

        if (!fileBuffer) {
            // Cache miss - download from Telegram
            console.log(`📥 Downloading from Telegram: ${mediaId}`);
            fileBuffer = await telegramService.downloadFile(metadata.telegram_file_id);

            // Cache the file
            await cacheService.cacheFile(mediaId, fileBuffer);
        }

        // Set appropriate headers
        res.setHeader('Content-Type', metadata.file_type);
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${metadata.original_name}"`);

        // Send file
        res.send(fileBuffer);

    } catch (error) {
        console.error('❌ Fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch file',
            message: error.message
        });
    }
}

/**
 * Get media metadata
 * GET /api/media/:id/info
 */
async function getMediaInfo(req, res) {
    try {
        const mediaId = req.params.id;
        const metadata = await mediaRepository.getMediaById(mediaId);

        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: 'Media not found'
            });
        }

        // Don't expose telegram_file_id
        const { telegram_file_id, ...publicMetadata } = metadata;

        res.json({
            success: true,
            data: publicMetadata
        });

    } catch (error) {
        console.error('❌ Get info error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get media info',
            message: error.message
        });
    }
}

/**
 * List all media (admin endpoint)
 * GET /api/media
 */
async function listMedia(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const media = await mediaRepository.getAllMedia(limit);

        // Don't expose telegram_file_id
        const publicMedia = media.map(({ telegram_file_id, ...rest }) => rest);

        res.json({
            success: true,
            count: publicMedia.length,
            data: publicMedia
        });

    } catch (error) {
        console.error('❌ List media error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list media',
            message: error.message
        });
    }
}

module.exports = {
    uploadMedia,
    fetchMedia,
    getMediaInfo,
    listMedia
};
