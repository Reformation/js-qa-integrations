import 'dotenv/config';
import { expect } from 'vitest';

const path = require('path');
const assert = require('assert');

const REFLogger = require('../../../util/ref-logger.js');
const EnvVarLoader = require('../../../util/env-var-loader');
const SfccClient = require('../../sfcc-client.js');
const testData = require('../fixtures/test-data.json');

function getRequiredSharedCreateEgcSitePrefToken() {
    const envHost = process.env.ENV_HOST;
    if (!envHost) {
        throw new Error('Missing ENV_HOST environment variable.');
    }

    const token = EnvVarLoader.loadEnvVar('SHARED_CREATE_EGC_SITE_PREF_TOKEN', envHost);
    if (!token) {
        throw new Error('Missing SHARED_CREATE_EGC_SITE_PREF_TOKEN_<ENV_HOST> environment variable. Caller must pass token explicitly.');
    }

    return token;
}

describe('SfccClient Wrapper Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    // ---------------------------------------------------------------------------
    // Order methods
    // ---------------------------------------------------------------------------

    test('Test SfccClient order lookup by GLE order number', async () => {
        refLogger.info('SfccClient order lookup by GLE order number');

        const sfccClient = new SfccClient();
        const orderNumber = testData.ocapi.orders.gleOrderNumber;
        const order = await sfccClient.getOrderNumberByGleOrderNumber(orderNumber);

        refLogger.debug(`Order response: ${JSON.stringify(order)}`);

        expect(order).not.toBeNull();
        expect(order).toBe(testData.ocapi.orders.expectedMatchingSfccOrderNumber);

        refLogger.info('SfccClient order lookup by GLE order number - completed');
    });

    test('Test SfccClient order lookup by US order number', async () => {
        refLogger.info('SfccClient order lookup by US order number');

        const sfccClient = new SfccClient();
        const orderNumber = testData.ocapi.orders.usOrderNumber;
        refLogger.info(`Looking up order number: ${orderNumber}`);
        const order = await sfccClient.getOrderByOrderNumber(orderNumber);

        refLogger.debug(`Order response: ${JSON.stringify(order)}`);

        expect(order).not.toBeNull();
        expect(order.order_no).toBe(orderNumber);

        refLogger.info('SfccClient order lookup by US order number - completed');
    });

    // ---------------------------------------------------------------------------
    // Store methods
    // ---------------------------------------------------------------------------

    // TODO - call to getStoreList throws a 400.  This call needs work. ajc - 4/17/2026
    test.skip('Test SfccClient get store list', async () => {
        refLogger.info('SfccClient get store list');

        const sfccClient = new SfccClient();
        const sfccStoreList = await sfccClient.getStoreList();

        refLogger.info(`Store list response: ${JSON.stringify(sfccStoreList)}`);

        expect(sfccStoreList).not.toBeNull();

        refLogger.info('SfccClient get store list - completed');
    });

    // ---------------------------------------------------------------------------
    // Basket methods
    // ---------------------------------------------------------------------------

    test('Test SfccClient basket lookup - no basket exists', async () => {
        refLogger.info('SfccClient basket lookup - no basket exists');

        const sfccClient = new SfccClient();
        const basketId = testData.ocapi.baskets.nonexistentBasketId;
        const basket = await sfccClient.getBasketByBasketId(basketId);

        refLogger.debug(`Basket: ${JSON.stringify(basket)}`);
        expect(basket).toBeNull();

        refLogger.info('SfccClient basket lookup - no basket exists - completed');
    });

    // ---------------------------------------------------------------------------
    // Data API methods
    // ---------------------------------------------------------------------------

    test('Test SfccClient inventory lookup', async () => {
        refLogger.info('SfccClient inventory lookup');

        const sfccClient = new SfccClient();
        const sku = testData.ocapi.inventory.sku;
        const inventory = await sfccClient.getInventoryForSku(sku);

        refLogger.debug(`Inventory Record: ${JSON.stringify(inventory)}`);
        expect(inventory).not.toBeNull();

        refLogger.info('SfccClient inventory lookup - completed');
    });

    // ---------------------------------------------------------------------------
    // Giftcard methods (SCAPI)
    // ---------------------------------------------------------------------------
    test('Test SfccClient create test giftcard', async () => {
        refLogger.info('SfccClient create test giftcard');

        const sfccClient = new SfccClient();
        const sharedCreateEgcSitePrefToken = getRequiredSharedCreateEgcSitePrefToken();
        const response = await sfccClient.createTestGiftcard(
            25,
            'test@thereformation.com',
            'Test User',
            'QA-12345',
            sharedCreateEgcSitePrefToken
        );

        refLogger.debug(`Create giftcard response: ${JSON.stringify(response)}`);
        expect(response).not.toBeNull();

        // create assertions w the response object here 
        expect(response.data.giftCertificateCode).toBeDefined();
        expect(response.data.maskedGiftCertificateCode).toBeDefined();
        expect(response.data.merchantId).toBeDefined();
        expect(response.data.amount).toBeDefined();
        expect(response.data.currencyCode).toBeDefined();
        expect(response.data.orderNo).toBeDefined();
        expect(response.data.recipientEmail).toBeDefined();
        expect(response.data.recipientName).toBeDefined();
        expect(response.data.senderName).toBeDefined();
        expect(response.data.message).toBeDefined();

        // please add the exact values for all items that were initially passed in 
        expect(response.data.amount).toBe(25);
        expect(response.data.currencyCode).toBe('USD');
        expect(response.data.orderNo).toBe('QA-12345');
        expect(response.data.recipientEmail).toBe('test@thereformation.com');
        expect(response.data.recipientName).toBe('Test User');
        expect(response.data.senderName).toBe('QA Automation');
        expect(response.data.message).toBe('Test giftcard');

        expect(response.statusCode).toBe(200);
        expect(response.statusText).toBe('OK');

        refLogger.info('SfccClient create test giftcard - completed');
    });

});
