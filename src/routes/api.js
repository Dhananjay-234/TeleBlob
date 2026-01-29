const express = require('express');
const multer = require('multer');
const mediaController = require('../controllers/mediaController');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit (Telegram's limit is 50MB for bots)
    }
});

/**
 * @route POST /api/upload
 * @desc Upload a media file
 * @access Public
 */
router.post('/upload', upload.single('file'), mediaController.uploadMedia);

/**
 * @route GET /api/media
 * @desc List all media (admin)
 * @access Public
 */
router.get('/media', mediaController.listMedia);

/**
 * @route GET /api/media/:id/info
 * @desc Get media metadata
 * @access Public
 */
router.get('/media/:id/info', mediaController.getMediaInfo);

/**
 * @route GET /api/media/:id
 * @desc Fetch media file
 * @access Public
 */
router.get('/media/:id', mediaController.fetchMedia);

module.exports = router;
