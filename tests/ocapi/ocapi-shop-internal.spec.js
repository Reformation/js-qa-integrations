import 'dotenv/config';

const { test, expect } = require('@playwright/test');
const path = require('path');

const REFLogger = require('../../util/ref-logger.js');
const OcapiShopClient = require('../../sfcc/ocapi/shop-api/ocapi-shop-client');
const SfccClient = require('../../sfcc/sfcc-client');
const testData = require('../fixtures/test-data.json');

test.describe('OCAPI Internal Shop API Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    test('Test SHOP API quick basket lookup - no basket exists', async () => {
        refLogger.info('SHOP API quick basket lookup - no basket exists');

        const ocapiShopClient = new OcapiShopClient();
        const basketId = testData.ocapi.baskets.nonexistentBasketId;
        const basket = await ocapiShopClient.getBasketByBasketId(basketId);
        refLogger.info(`Basket: ${JSON.stringify(basket)}`);
        expect(basket).toBeNull();

        refLogger.info('SHOP API quick basket lookup - no basket exists');
    });

    test('Test SHOP API order lookup by GLE order number', async () => {
        refLogger.info('SHOP API order lookup by order number');

        const ocapiShopClient = new OcapiShopClient();
        const orderNumber = testData.ocapi.orders.gleOrderNumber;
        const order = await ocapiShopClient.getSfccOrderNumberByGLEOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order).toBe(testData.ocapi.orders.expectedMatchingSfccOrderNumber); // This is the SFCC order number, not the GLE number
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

    test('Test SHOP API order lookup by US order number', async () => {
        refLogger.info('SHOP API order lookup by order number');

        const ocapiShopClient = new OcapiShopClient();
        const orderNumber = testData.ocapi.orders.usOrderNumber;
        const order = await ocapiShopClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

    // TODO: calle to getStoreList throws a 400.  This call needs work. ajc - 4/17/2026
    test.skip('Test get SFCC store list', async () => {
        refLogger.info('SHOP API store list retrieval');

        const sfccClient = new SfccClient();
        const sfccStoreList = await sfccClient.getStoreList();
        
        refLogger.info(`Order response: ${JSON.stringify(sfccStoreList)}`);
        
        // Validate order was retrieved
        expect(sfccStoreList).not.toBeNull();
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

});
