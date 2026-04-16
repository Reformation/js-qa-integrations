require('dotenv').config({ override: true });

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
        const order = await sfccClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SfccClient order lookup by GLE order number - completed');
    });

    test('Test SfccClient order lookup by US order number', async () => {
        refLogger.info('SfccClient order lookup by US order number');

        const sfccClient = new SfccClient();
        const orderNumber = testData.ocapi.orders.usOrderNumber;
        const order = await sfccClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SfccClient order lookup by US order number - completed');
    });

    test('Test SfccClient get SFCC order number by GLE order number', async () => {
        refLogger.info('SfccClient get SFCC order number by GLE order number');

        const sfccClient = new SfccClient();
        const gleOrderNumber = testData.ocapi.orders.gleOrderNumber;
        const sfccOrderNumber = await sfccClient.getOrderNumberByGleOrderNumber(gleOrderNumber);
        
        refLogger.info(`SFCC order number response: ${JSON.stringify(sfccOrderNumber)}`);
        
        // Validate order number was retrieved
        expect(sfccOrderNumber).not.toBeNull();
        expect(sfccOrderNumber).toBe(testData.ocapi.orders.expectedSfccOrderNumber); // This is the SFCC order number, not the GLE number
        
        refLogger.info('SfccClient get SFCC order number by GLE order number - completed');
    });

    test('Test SfccClient get store list', async () => {
        refLogger.info('SfccClient get store list');

        const sfccClient = new SfccClient();
        const sfccStoreList = await sfccClient.getStoreList();
        
        refLogger.info(`Store list response: ${JSON.stringify(sfccStoreList)}`);
        
        // Validate store list was retrieved
        expect(sfccStoreList).not.toBeNull();
        
        refLogger.info('SfccClient get store list - completed');
    });

});
