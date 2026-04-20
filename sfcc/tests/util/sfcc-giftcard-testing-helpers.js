const OcapiDataClient = require('../../ocapi/data-api/ocapi-data-client');

/**
 * Test-only helpers for giftcard-related site preference lookups.
 * This class is intentionally scoped to tests/ and must NOT be used
 * from production client code (e.g. SfccClient).
 */
class SfccGiftcardTestingHelpers {
    constructor(envStr = process.env.ENV_HOST, apiVersion = 'v21_3') {
        this.ocapiDataClient = new OcapiDataClient(envStr, apiVersion);
    }

    async getSharedCreateEgcSitePrefToken() {
        return await this.ocapiDataClient.getCustomSitePreference_GiftCardTesting_testCreationEgcAuthToken();
    }
}

module.exports = SfccGiftcardTestingHelpers;
