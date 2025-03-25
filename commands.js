const logger = require('./logger');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commands = {
            'ping': this.handlePing.bind(this),
            'status': this.handleStatus.bind(this),
            'help': this.handleHelp.bind(this),
            'time': this.handleTime.bind(this)
        };
    }

    handleCommand(username, message) {
        if (username === this.bot.username) return;
        
        const command = message.toLowerCase().trim();
        
        for (const [trigger, handler] of Object.entries(this.commands)) {
            if (command.includes(trigger)) {
                handler(username);
                break;
            }
        }
    }

    handlePing(username) {
        this.bot.chat(`${username}, pong!`);
    }

    handleStatus(username) {
        const health = Math.round(this.bot.health);
        const food = Math.round(this.bot.food);
        this.bot.chat(`Health: ${health}/20, Food: ${food}/20`);
    }

    handleHelp(username) {
        this.bot.chat('Available commands: ping, status, time, help');
    }

    handleTime() {
        const time = this.bot.time.timeOfDay;
        const isDay = time < 13000 || time > 23000;
        this.bot.chat(`Current time: ${time} (${isDay ? 'Day' : 'Night'})`);
    }
}

module.exports = CommandHandler;
