const mineflayer = require('mineflayer');
const config = require('./config');
const logger = require('./logger');
const CommandHandler = require('./commands');
const fs = require('fs');

class MinecraftBot {
    constructor() {
        this.bot = null;
        this.commandHandler = null;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.isConnecting = false;
    }

    createBot() {
        if (this.isConnecting) {
            logger.warn('Connection attempt already in progress, skipping');
            return;
        }

        try {
            this.isConnecting = true;
            logger.info(`Attempting to connect to ${config.bot.host}:${config.bot.port} as ${config.bot.username}`);
            logger.info(`Using Minecraft version: ${config.bot.version || 'auto-detect'}`);

            // Check if skin file exists
            const skinOptions = {};
            if (fs.existsSync(config.bot.skinPath)) {
                skinOptions.skinPath = config.bot.skinPath;
                logger.info('Loading custom skin from: ' + config.bot.skinPath);
            } else {
                logger.warn('Skin file not found, using default skin');
            }

            // Create bot with enhanced options
            this.bot = mineflayer.createBot({
                ...config.bot,
                ...skinOptions,
                logErrors: true,
                verbose: true
            });

            this.commandHandler = new CommandHandler(this.bot);
            this.setupEventHandlers();
        } catch (err) {
            logger.error('Failed to create bot instance:', err);
            this.isConnecting = false;
            this.handleReconnect();
        }
    }

    setupEventHandlers() {
        // Connection events with enhanced logging
        this.bot.on('login', () => {
            logger.info('Successfully logged in to the server');
            logger.info(`Protocol version: ${this.bot.protocolVersion}`);
            logger.info(`Game version: ${this.bot.version}`);
            this.isConnecting = false;
        });

        this.bot.on('connect', () => {
            logger.info('TCP Connection established, attempting server handshake');
        });

        this.bot.on('serverAuth', () => {
            logger.info('Server authentication completed');
        });

        // Enhanced error logging
        this.bot.on('error', (err) => {
            logger.error('Bot encountered error:', err);
            logger.error(`Error details: ${err.message}`);
            if (err.code) {
                logger.error(`Error code: ${err.code}`);
            }
            // Log additional connection details
            if (this.bot.protocolVersion) {
                logger.info(`Protocol version in use: ${this.bot.protocolVersion}`);
            }
            if (this.bot.version) {
                logger.info(`Minecraft version: ${this.bot.version}`);
            }
            this.isConnecting = false;
            this.handleReconnect();
        });

        // Detailed kick logging
        this.bot.on('kicked', (reason, loggedIn) => {
            logger.warn(`Bot was kicked from server: ${reason}`);
            logger.warn(`Login status when kicked: ${loggedIn}`);
            try {
                const kickReason = JSON.parse(reason);
                logger.warn('Kick reason details:', kickReason);
            } catch (e) {
                logger.warn('Raw kick reason:', reason);
            }
            this.isConnecting = false;
            this.handleReconnect();
        });

        this.bot.on('spawn', () => {
            logger.info('Bot successfully spawned in game');
            logger.info(`Connected as ${this.bot.username} to ${config.bot.host}:${config.bot.port}`);
            this.connectionAttempts = 0;
            this.setupSurvivalBehaviors();

            // Set creative mode after 5 seconds
            setTimeout(() => {
                logger.info('Attempting to set gamemode to creative');
                this.bot.chat('/gamemode creative');
            }, 5000);
        });

        this.bot.on('end', (reason) => {
            logger.info(`Bot connection ended. Reason: ${reason || 'unknown'}`);
            this.handleReconnect();
        });

        // Chat handling
        this.bot.on('chat', (username, message) => {
            logger.info(`Chat message from ${username}: ${message}`);
            this.commandHandler.handleCommand(username, message);
        });

        // Health monitoring
        this.bot.on('health', () => {
            this.handleHealth();
        });

        // Regular connection check
        setInterval(() => this.checkConnection(), config.bot.checkTimeoutInterval);
    }

    setupSurvivalBehaviors() {
        logger.info('Setting up survival behaviors');
        // Anti-AFK measures
        setInterval(() => {
            this.bot.setControlState('jump', true);
            setTimeout(() => this.bot.setControlState('jump', false), 100);
        }, config.survival.jumpInterval);

        // Random looking around
        setInterval(() => {
            const yaw = Math.random() * Math.PI * 2;
            const pitch = Math.random() * Math.PI - (Math.PI / 2);
            this.bot.look(yaw, pitch, true);
        }, config.survival.lookInterval);
    }

    handleHealth() {
        if (this.bot.health < config.survival.minHealth) {
            logger.warn(`Low health detected: ${this.bot.health}`);
            this.tryToEat();
        }
    }

    async tryToEat() {
        const foods = this.bot.inventory.items().filter(item =>
            item.name.includes('apple') ||
            item.name.includes('bread') ||
            item.name.includes('potato') ||
            item.name.includes('carrot')
        );

        for (const food of foods) {
            try {
                await this.bot.equip(food, 'hand');
                await this.bot.consume();
                logger.info(`Successfully consumed ${food.name}`);
                break;
            } catch (err) {
                logger.error(`Failed to consume ${food.name}:`, err);
            }
        }
    }

    handleReconnect() {
        this.connectionAttempts++;
        if (this.connectionAttempts <= this.maxReconnectAttempts) {
            const delay = Math.min(30000, this.connectionAttempts * config.bot.reconnectDelay); // Cap at 30 seconds
            logger.info(`Attempting to reconnect (${this.connectionAttempts}/${this.maxReconnectAttempts}) in ${delay/1000} seconds`);
            setTimeout(() => this.createBot(), delay);
        } else {
            logger.error('Max reconnection attempts reached. Shutting down.');
            process.exit(1);
        }
    }

    checkConnection() {
        if (!this.bot.entity) {
            logger.warn('Connection check failed - no entity');
            this.handleReconnect();
        }
    }
}

// Start the bot
const mcBot = new MinecraftBot();
mcBot.createBot();

// Handle process termination
process.on('SIGINT', () => {
    logger.info('Bot shutting down...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});