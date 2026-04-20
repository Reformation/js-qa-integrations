import 'dotenv/config';

const path = require('path');
const assert = require('assert');

const REFLogger = require('../../../util/ref-logger.js');
const SfccClient = require('../../sfcc-client.js');
const testData = require('../fixtures/test-data.json');
const SfccGiftcardTestingHelpers = require('../util/sfcc-giftcard-testing-helpers');

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

        refLogger.info(`Order response: ${JSON.stringify(order)}`);

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

        refLogger.info(`Order response: ${JSON.stringify(order)}`);

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

        refLogger.info(`Basket: ${JSON.stringify(basket)}`);
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
        const giftcardTestingHelpers = new SfccGiftcardTestingHelpers();
        const sharedCreateEgcSitePrefToken = await giftcardTestingHelpers.getSharedCreateEgcSitePrefToken();
        const response = await sfccClient.createTestGiftcard(
            25,
            'test@thereformation.com',
            'Test User',
            'QA-12345',
            sharedCreateEgcSitePrefToken
        );

        refLogger.info(`Create giftcard response: ${JSON.stringify(response)}`);
        expect(response).not.toBeNull();

        refLogger.info('SfccClient create test giftcard - completed');
    });

});
