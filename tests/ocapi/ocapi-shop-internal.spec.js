const { test, expect } = require('@playwright/test');
const path = require('path');
const assert = require('assert');

const REFLogger = require('../../util/ref-logger.js');

const OcapiShopClient = require('../../sfcc/ocapi/shop-api/ocapi-shop-client');

test.describe('OCAPI Internal Shop API Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    test('Test SHOP API quick basket lookup - no basket exists', async () => {
        refLogger.info('SHOP API quick basket lookup - no basket exists');

        const ocapiShopClient = new OcapiShopClient();
        const basketId = '1234567890';
        const basket = await ocapiShopClient.getBasketByBasketId(basketId);
        refLogger.info(`Basket: ${JSON.stringify(basket)}`);
        expect(basket).toBeNull();

        refLogger.info('SHOP API quick basket lookup - no basket exists');
    });

    test('Test SHOP API order lookup by GLE order number', async () => {
        refLogger.info('SHOP API order lookup by order number');

        const ocapiShopClient = new OcapiShopClient();
        const orderNumber = 'GE10832129972CA';
        const order = await ocapiShopClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

    test('Test SHOP API order lookup by US order number', async () => {
        refLogger.info('SHOP API order lookup by order number');

        const ocapiShopClient = new OcapiShopClient();
        const orderNumber = 'SD00118128';
        const order = await ocapiShopClient.getOrderByOrderNumber(orderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(order)}`);
        
        // Validate order was retrieved
        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });


    test('Test get SFCC order number by GLE order number', async () => {
        refLogger.info('SHOP API order lookup by order number');

        const ocapiShopClient = new OcapiShopClient();
        const gleOrderNumber = 'GE10832129972CA';
        const sfccOrderNumber = await ocapiShopClient.getSfccOrderNumberByGLEOrderNumber(gleOrderNumber);
        
        refLogger.info(`Order response: ${JSON.stringify(sfccOrderNumber)}`);
        
        // Validate order was retrieved
        expect(sfccOrderNumber).not.toBeNull();
        expect(sfccOrderNumber).toBe('SD00118126'); // This is the SFCC order number, not the GLE number
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

    test('Test get SFCC store list', async () => {
        refLogger.info('SHOP API store list retrieval');

        const ocapiShopClient = new OcapiShopClient();
        const sfccStoreList = await ocapiShopClient.getSfccStoreList();
        
        refLogger.info(`Order response: ${JSON.stringify(sfccStoreList)}`);
        
        // Validate order was retrieved
        expect(sfccStoreList).not.toBeNull();
        
        refLogger.info('SHOP API order lookup by order number - completed');
    });

});
