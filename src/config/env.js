require('dotenv').config();

const config = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    server: {
        port: process.env.PORT || 3000
    },
    cache: {
        dir: process.env.CACHE_DIR || './cache',
        ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10)
    }
};

// Validate required configuration
function validateConfig() {
    const errors = [];

    if (!config.telegram.botToken) {
        errors.push('TELEGRAM_BOT_TOKEN is required');
    }

    if (!config.telegram.chatId) {
        errors.push('TELEGRAM_CHAT_ID is required');
    }

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(err => console.error(`   - ${err}`));
        throw new Error('Missing required configuration');
    }
}

module.exports = {
    config,
    validateConfig
};
