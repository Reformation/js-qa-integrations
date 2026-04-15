const winston = require('winston');

class REFLogger {
  constructor(loggerName = 'default_logger', logLevel = 'info') {
    const label = loggerName;

    const customFormat = winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${label} - ${level.toUpperCase()} - ${message}`;
    });

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }),
        customFormat
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
    }

    debug(message) {
      this.logger.debug(this._format(message));
    }
  
    info(message) {
      this.logger.info(this._format(message));
    }
  
    warn(message) {
      this.logger.warn(this._format(message));
    }
  
    error(message) {
      this.logger.error(this._format(message));
    }
  
    critical(message) {
      this.logger.error(this._format(`CRITICAL: ${message}`));
    }
  
    _format(message) {
      return typeof message === 'object' ? JSON.stringify(message) : message;
    }
}

module.exports = REFLogger;