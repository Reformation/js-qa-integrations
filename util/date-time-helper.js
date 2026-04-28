const { DateTime } = require('luxon');
const REFLogger = require('./ref-logger');

class REFDateTimeHelper {
    constructor() {
        const path = require('path');
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    async isDateXDaysInFuture(zuluDatetimeStamp, days, timestampToCompare = DateTime.utc()) {
        const timezoneAwareZuluDate = this.toTimezoneAwareDate(zuluDatetimeStamp);

        // Stripping the time from the timestamp to compare
        const timeToCompareNoTimestamp = timestampToCompare.toISODate();

        // Calculate the expected future date (taking business days into account)
        const expectedFutureDatestamp = await this.addBusinessDays(timeToCompareNoTimestamp, days);
        this.refLogger.debug(`Expected future date [ ${expectedFutureDatestamp} ]`);

        return timezoneAwareZuluDate === expectedFutureDatestamp;
    }

    async  toTimezoneAwareDate(zuluDatetimeStamp) {
        this.refLogger.info(`Original zulu date string [ ${zuluDatetimeStamp} ]`);

        // Parse Zulu time string to DateTime object
        const zuluTimestamp = DateTime.fromISO(zuluDatetimeStamp, { zone: 'utc' });
        this.refLogger.debug(`Zulu timestamp [ ${zuluTimestamp} ]`);

        // Convert to system's local timezone
        const localTimestamp = zuluTimestamp.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        this.refLogger.debug(`Converted to local timezone [ ${localTimestamp} ]`);

        // Stripping the time for date comparison
        const zuluDateNoTimestamp = localTimestamp.toISODate();
        this.refLogger.info(`Zulu date string (timestamp stripped) USED FOR COMPARISON [ ${zuluDateNoTimestamp} ]`);

        return zuluDateNoTimestamp;
    }

    async getPromisedDeliveryDateDaysOffset(days, timeToCompareUtc = DateTime.utc(), isExpeditedShipment = false) {
        this.refLogger.debug(`Original days offset from shipping method [ ${days} ]`);
        let offsetInDays = days;

        if (isExpeditedShipment) {
            if (await this.isAfter1pmPST(timeToCompareUtc)) {
                this.refLogger.info('Incrementing business days offset by 1. The shipment IS EXPEDITED AND it is AFTER 1PM PST ...');
                offsetInDays += 1;
            }
        } else {
            if (await this.isAfter2pmPST(timeToCompareUtc)) {
                this.refLogger.info('Incrementing business days offset by 1. The shipment IS NOT EXPEDITED BUT it is AFTER 2PM PST ...');
                offsetInDays += 1;
            }
        }

        return offsetInDays;
    }

    async isAfter1pmPST(timeToCompareUtc = DateTime.utc()) {
        return await this.isAfterXHourPST(13, timeToCompareUtc);
    }

    async isAfter2pmPST(timeToCompareUtc = DateTime.utc()) {
        return await this.isAfterXHourPST(14, timeToCompareUtc);
    }

    async isAfterXHourPST(hour, timeToCompareUtc = DateTime.utc()) {
        const pstTime = timeToCompareUtc.setZone('America/Los_Angeles');
        const comparisonTime = pstTime.set({ hour, minute: 0, second: 0, millisecond: 0 });

        const isAfterXHour = pstTime > comparisonTime;

        this.refLogger.info(`Current Time in EST: ${this.getSystemTimeEST()}`);
        this.refLogger.info(`Current Time in PST: ${pstTime}`);
        this.refLogger.info(`Is it after ${hour}:00:00 PST? ${isAfterXHour ? 'Yes' : 'No'}`);

        return isAfterXHour;
    }

    async getSystemTimePST() {
        return DateTime.utc().setZone('America/Los_Angeles').toISO();
    }

    async getSystemTimeEST() {
        return DateTime.utc().setZone('America/New_York').toISO();
    }

    async addBusinessDays(date, days) {
        let result = DateTime.fromISO(date);
        let addedDays = 0;

        while (addedDays < days) {
            result = result.plus({ days: 1 });
            if (result.weekday < 6) { // Skip weekends
                addedDays++;
            }
        }

        return result.toISODate();
    }
}

module.exports = REFDateTimeHelper;
