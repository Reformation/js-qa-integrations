const REFLogger = require('./ref-logger');
const path = require('path');

class Timer {
    constructor() {
      this.timers = new Map();

      const loggerName = path.basename(__filename, path.extname(__filename));
      this.refLogger = new REFLogger(loggerName);
    }

    start(label = 'default') {
      this.timers.set(label, process.hrtime());
      this.refLogger.debug(`[Timer] Started: ${label}`);
    }

    end(label = 'default') {
      const startTime = this.timers.get(label);
      if (!startTime) {
        this.refLogger.warn(`[Timer] No timer found for label: ${label}`);
        return;
      }

      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to ms
      this.refLogger.debug(`[Timer] Ended: ${label} took ${duration.toFixed(2)} ms`);

      this.timers.delete(label);
      return duration;
    }

    reset(label = 'default') {
      this.timers.delete(label);
    }
  }

  module.exports = Timer;
