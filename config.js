// Configuration management for the bot
const config = {
    bot: {
        host: process.env.MC_SERVER_HOST || 'cip-network.aternos.me',
        username: process.env.MC_USERNAME || 'AFK_Bot_' + Math.floor(Math.random() * 1000),
        auth: 'offline',
        version: '1.19.2',  // Try an older, stable version
        checkTimeoutInterval: 60000, // Connection check interval
        reconnectDelay: 5000, // Delay between reconnection attempts
        hideErrors: false, // Show all errors for debugging
        skinPath: './skins/custom.png', // Path to the bot's skin file
        // Add connection specific settings
        connect_timeout: 30000,  // Increase connection timeout
        clientToken: undefined,  // Explicitly set for offline mode
        keepAlive: true,        // Enable keep-alive packets
    },
    survival: {
        minHealth: 10,
        jumpInterval: 30000,
        lookInterval: 15000,
    }
};

module.exports = config;