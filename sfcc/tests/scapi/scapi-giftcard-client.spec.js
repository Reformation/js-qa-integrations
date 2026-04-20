import 'dotenv/config';

const path = require('path');
const assert = require('assert');

const REFLogger = require('../../../util/ref-logger.js');
const EnvVarLoader = require('../../../util/env-var-loader');
const SfccClient = require('../../sfcc-client');
const ScapiGiftcardClient = require('../../scapi/scapi-giftcard-client');

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

describe('SCAPI Giftcard Client Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);

    // ---------------------------------------------------------------------------
    // Test giftcard creation with valid token
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with valid token', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with valid token');

        const sharedCreateEgcSitePrefToken = getRequiredSharedCreateEgcSitePrefToken();

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
            assert.strictEqual(error?.message, 'testCreationEgcAuthToken value is required to create a test giftcard');
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
            assert.strictEqual(error?.message, 'testCreationEgcAuthToken value is required to create a test giftcard');
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
            assert.strictEqual(error?.message, 'testCreationEgcAuthToken value is required to create a test giftcard');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with undefined token - completed');
    });

    // ---------------------------------------------------------------------------
    // Test site preference retrieval for giftcard testing config
    // ---------------------------------------------------------------------------
    test('Test caller-provided giftcard auth token - should not be null', async () => {
        refLogger.info('Caller-provided giftcard auth token should not be null');

        const sharedCreateEgcSitePrefToken = getRequiredSharedCreateEgcSitePrefToken();

        assert(sharedCreateEgcSitePrefToken != null, 'sharedCreateEgcSitePrefToken site preference should not be null');
        assert(sharedCreateEgcSitePrefToken !== '', 'sharedCreateEgcSitePrefToken site preference should not be empty');

        refLogger.info('Caller-provided giftcard auth token check - completed');
    });

    // ---------------------------------------------------------------------------
    // Input validation tests
    // ---------------------------------------------------------------------------
    test('Test ScapiGiftcardClient create test giftcard with invalid amount - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with invalid amount');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                0,
                'test@thereformation.com',
                'Test User',
                'QA-12345',
                'dummy-token'
            );
            expect.fail('Expected error to be thrown for invalid amount');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert.strictEqual(error?.message, 'amount must be a positive number');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with invalid amount - completed');
    });

    test('Test ScapiGiftcardClient create test giftcard with missing recipientEmail - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with missing recipientEmail');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                '   ',
                'Test User',
                'QA-12345',
                'dummy-token'
            );
            expect.fail('Expected error to be thrown for missing recipientEmail');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert.strictEqual(error?.message, 'recipientEmail is required');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with missing recipientEmail - completed');
    });

    test('Test ScapiGiftcardClient create test giftcard with invalid recipientEmail format - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with invalid recipientEmail format');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                'not-an-email',
                'Test User',
                'QA-12345',
                'dummy-token'
            );
            expect.fail('Expected error to be thrown for invalid recipientEmail format');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert.strictEqual(error?.message, 'recipientEmail must be a valid email address');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with invalid recipientEmail format - completed');
    });

    test('Test ScapiGiftcardClient create test giftcard with missing recipientName - should fail', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with missing recipientName');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        try {
            await scapiGiftcardClient.createTestGiftcard(
                25,
                'test@thereformation.com',
                ' ',
                'QA-12345',
                'dummy-token'
            );
            expect.fail('Expected error to be thrown for missing recipientName');
        } catch (error) {
            refLogger.info(`Expected error caught: ${error?.message}`);
            assert.strictEqual(error?.message, 'recipientName is required');
        }

        refLogger.info('ScapiGiftcardClient create test giftcard with missing recipientName - completed');
    });

    test('Test ScapiGiftcardClient create test giftcard with missing orderNumber - should pass validation', async () => {
        refLogger.info('ScapiGiftcardClient create test giftcard with missing orderNumber should pass validation');

        const scapiGiftcardClient = new ScapiGiftcardClient();

        scapiGiftcardClient.scapiAuth.getScapiToken = async () => 'mock-token';
        scapiGiftcardClient.httpRequestHelper.performPost = async ({payload}) => payload;

        const response = await scapiGiftcardClient.createTestGiftcard(
            25,
            'test@thereformation.com',
            'Test User',
            '',
            'dummy-token'
        );

        assert.strictEqual(Object.prototype.hasOwnProperty.call(response, 'orderNo'), false);

        refLogger.info('ScapiGiftcardClient create test giftcard with missing orderNumber should pass validation - completed');
    });

});
