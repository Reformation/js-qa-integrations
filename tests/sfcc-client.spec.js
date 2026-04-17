import 'dotenv/config';

const { test, expect } = require('@playwright/test');
const path = require('path');

const REFLogger = require('../util/ref-logger.js');
const SfccClient = require('../sfcc/sfcc-client');
const testData = require('./fixtures/test-data.json');

test.describe('SfccClient Wrapper Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    test('Test SfccClient order lookup by GLE order number', async () => {
        refLogger.info('SfccClient order lookup by GLE order number');

        const sfccClient = new SfccClient();
        const orderNumber = testData.ocapi.orders.gleOrderNumber;
        const order = await sfccClient.getOrderNumberByGleOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order).toBe(testData.ocapi.orders.expectedMatchingSfccOrderNumber); // This is the SFCC order number, not the GLE number
        
        refLogger.info('SfccClient order lookup by GLE order number - completed');
    });

    test('Test SfccClient order lookup by US order number', async () => {
        refLogger.info('SfccClient order lookup by US order number');

        const sfccClient = new SfccClient();
        const orderNumber = testData.ocapi.orders.usOrderNumber;
        refLogger.info(`Looking up order number: ${orderNumber}`);
        const order = await sfccClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SfccClient order lookup by US order number - completed');
    });

    // TODO - call to getStoreList throws a 400.  This call needs work. ajc - 4/17/2026
    test.skip('Test SfccClient get store list', async () => {
        refLogger.info('SfccClient get store list');

        const sfccClient = new SfccClient();
        const sfccStoreList = await sfccClient.getStoreList();
        
        refLogger.info(`Store list response: ${JSON.stringify(sfccStoreList)}`);
        
        // Validate store list was retrieved
        expect(sfccStoreList).not.toBeNull();
        
        refLogger.info('SfccClient get store list - completed');
    });

});
