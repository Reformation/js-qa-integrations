import 'dotenv/config';

const path = require('path');
const assert = require('assert');

const REFLogger = require('../../../util/ref-logger.js');
const SfccClient = require('../../sfcc-client');


describe('SFCC Client Site Preferences Facade Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    test('Test SFCC Client site preference lookup - enablePDPSizePicker flag', async () => {
        refLogger.info('SFCC Client site preference lookup - enablePDPSizePicker flag');

        const sfccClient = new SfccClient();
        const enablePDPSizePicker = await sfccClient.getPDPSizePickerEnabled();
        refLogger.info(`Site Pref - enablePDPSizePicker: ${enablePDPSizePicker}`);
        assert(enablePDPSizePicker != null, '\'enablePDPSizePicker\' site preference inside \'PDP Configuration\' group should not be null!');
        // Uncomment one of the following assertions depending on your environment:
        // assert(enablePDPSizePicker === true, '\'enablePDPSizePicker\' should be \'true\' in this environment, but it\'s \'false\'!');
        // assert(enablePDPSizePicker === false, '\'enablePDPSizePicker\' should be \'false\' in this environment, but it\'s \'true\'!');

        refLogger.info('SFCC Client site preference lookup - enablePDPSizePicker flag');
    });
});
