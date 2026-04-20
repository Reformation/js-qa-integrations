import 'dotenv/config';

const path = require('path');
const assert = require('assert');

const REFLogger = require('../../../util/ref-logger.js');
const SfccClient = require('../../sfcc-client');
const ScapiGiftcardClient = require('../../scapi/scapi-giftcard-client');
const SfccGiftcardTestingHelpers = require('../util/sfcc-giftcard-testing-helpers');

describe('SCAPI Giftcard Client Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    // ---------------------------------------------------------------------------
    // Test giftcard creation with valid token
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with valid token', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with valid token');

        const sfccClient = new SfccClient();
        const giftcardTestingHelpers = new SfccGiftcardTestingHelpers();
        const sharedCreateEgcSitePrefToken = await giftcardTestingHelpers.getSharedCreateEgcSitePrefToken();
        
        refLogger.info(`EGC auth token: ${sharedCreateEgcSitePrefToken}`);
        assert(sharedCreateEgcSitePrefToken != null, 'sharedCreateEgcSitePrefToken should not be null');

        const scapiGiftcardClient = new ScapiGiftcardClient();
        const response = await scapiGiftcardClient.createTestGiftcard(
            25,
            'test@thereformation.com',
            'Test User',
            'QA-12345',
            sharedCreateEgcSitePrefToken
        );

        refLogger.info(`Create giftcard response: ${JSON.stringify(response)}`);
        expect(response).not.toBeNull();

        refLogger.info('ScapiGiftcardClient create test giftcard with valid token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test giftcard creation with null token
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with null token - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with null token');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                'test@thereformation.com',
                'Test User',
                'QA-12345',
                null
            );
            expect.fail('Expected error to be thrown for null token');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert(error?.message.includes('sharedCreateEgcSitePrefToken is required'), 'Error message should mention required token');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with null token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test giftcard creation with empty token
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with empty token - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with empty token');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                'test@thereformation.com',
                'Test User',
                'QA-12345',
                ''
            );
            expect.fail('Expected error to be thrown for empty token');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert(error?.message.includes('sharedCreateEgcSitePrefToken is required'), 'Error message should mention required token');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with empty token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test giftcard creation with undefined token
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with undefined token - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with undefined token');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                'test@thereformation.com',
                'Test User',
                'QA-12345',
                undefined
            );
            expect.fail('Expected error to be thrown for undefined token');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert(error?.message.includes('sharedCreateEgcSitePrefToken is required'), 'Error message should mention required token');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with undefined token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test SfccClient wrapper - caller retrieves and passes token
    // ---------------------------------------------------------------------------
    test('Test SfccClient wrapper create test giftcard - caller passes token', async () => {
        refLogger.info('SfccClient wrapper create test giftcard - caller passes token');

        const sfccClient = new SfccClient();
        const giftcardTestingHelpers = new SfccGiftcardTestingHelpers();
        const sharedCreateEgcSitePrefToken = await giftcardTestingHelpers.getSharedCreateEgcSitePrefToken();
        const response = await sfccClient.createTestGiftcard(
            50,
            'wrapper-test@thereformation.com',
            'Wrapper Test User',
            'QA-67890',
            sharedCreateEgcSitePrefToken
        );

        refLogger.info(`Create giftcard response: ${JSON.stringify(response)}`);
        expect(response).not.toBeNull();

        refLogger.info('SfccClient wrapper create test giftcard - caller passes token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test site preference retrieval for giftcard testing config
    // ---------------------------------------------------------------------------
    test('Test SfccClient get giftcard testing auth token - should not be null', async () => {
        refLogger.info('SfccClient get giftcard testing auth token');

        const giftcardTestingHelpers = new SfccGiftcardTestingHelpers();
        const sharedCreateEgcSitePrefToken = await giftcardTestingHelpers.getSharedCreateEgcSitePrefToken();

        refLogger.info(`EGC auth token: ${sharedCreateEgcSitePrefToken}`);
        assert(sharedCreateEgcSitePrefToken != null, 'sharedCreateEgcSitePrefToken site preference should not be null');
        assert(sharedCreateEgcSitePrefToken !== '', 'sharedCreateEgcSitePrefToken site preference should not be empty');

        refLogger.info('SfccClient get giftcard testing auth token - completed');
    });

});
