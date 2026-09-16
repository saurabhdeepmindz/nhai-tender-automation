const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'frontend.log') })
  ],
});

module.exports = logger;