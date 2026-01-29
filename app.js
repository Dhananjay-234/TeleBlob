require('dotenv').config();
const express = require('express');
const { initializeFirebase } = require('./src/config/firebase');
const { config, validateConfig } = require('./src/config/env');
const apiRoutes = require('./src/routes/api');
const cacheService = require('./src/services/cacheService');

const app = express();

// CORS middleware - Allow all origins for testing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'TeleBlob',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// Initialize and start server
async function startServer() {
    try {
        console.log('🚀 Starting TeleBlob...\n');

        // Validate configuration
        validateConfig();
        console.log('✅ Configuration validated');

        // Initialize Firebase
        initializeFirebase();
        console.log('✅ Firebase initialized');

        // Clear expired cache on startup
        await cacheService.clearExpiredCache();

        // Start server
        const PORT = config.server.port;
        app.listen(PORT, () => {
            console.log(`\n✅ TeleBlob is running on port ${PORT}`);
            console.log(`📡 Health check: http://localhost:${PORT}/health`);
            console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
            console.log(`📥 Fetch endpoint: http://localhost:${PORT}/api/media/:id\n`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();
