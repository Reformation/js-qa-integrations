const { test, expect } = require('@playwright/test');
const path = require('path');
const assert = require('assert');

const REFLogger = require('../../util/ref-logger.js');
const OcapiDataClient = require('../../sfcc/ocapi/data-api/ocapi-data-client');


test.describe('OCAPI Internal Data API Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    test('Test DATA API quick inventory lookup - no inventory exists', async () => {
        refLogger.info('DATA API quick inventory lookup - no inventory exists');

        const ocapiDataClient = new OcapiDataClient();
        const sku = '1313793IVO008';
        const inventory = await ocapiDataClient.getInventoryForSku(sku);
        refLogger.debug(`Inventory Record: ${JSON.stringify(inventory)}`);
        expect(inventory).not.toBeNull();

        refLogger.info('DATA API quick inventory lookup - no inventory exists');
    });    

    test('Test DATA API site preference lookup - enablePDPSizePicker flag', async () => {
        refLogger.info('DATA API site preference lookup - enablePDPSizePicker flag');

        const ocapiDataClient = new OcapiDataClient();
        const enablePDPSizePicker = await ocapiDataClient.getCustomSitePreference_PDP_Configuration_enablePDPSizePicker();
        refLogger.info(`Site Pref - enablePDPSizePicker: ${enablePDPSizePicker}`);
        assert(enablePDPSizePicker != null, '\'enablePDPSizePicker\' site preference inside \'PDP Configuration\' group should not be null!');  // if this asseretion fails, you may need to do a data deploy.  enablePDPSizePicker doesn't exist in ReformationCustom
        
        // this gets toggled depending on the environment, uncomment the one that you need, depending on the scenario.
        // assert(enablePDPSizePicker === true, '\'enablePDPSizePicker\' should be \'true\' in this environment, but it\'s \'false\'!');  // if this assertion fails, you may need to do a data deploy.  enablePDPSizePicker is set to false in ReformationCustom
        //assert(enablePDPSizePicker === false, '\'enablePDPSizePicker\' should be \'false\' in this environment, but it\'s \'true\'!');
        
        refLogger.info('DATA API site preference lookup - enablePDPSizePicker flag');
    });

    test('Test DATA API site preference lookup - junk values', async () => {
        refLogger.info('DATA API site preference lookup - junk values');

        const ocapiDataClient = new OcapiDataClient();
        const junkPrefValue = await ocapiDataClient.getCustomSitePreferenceByGroupAndId('sfsdfsdfa', 'dfshdfhhgfshdg');
        refLogger.info(`Site Pref - junkPrefValue: ${junkPrefValue}`);
        expect(junkPrefValue).toBeNull();

        refLogger.info('DATA API site preference lookup - junk values');
    });

});
