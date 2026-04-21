// SitePreferencesService: Facade for custom site preference lookups
// Keeps OcapiDataClient hidden from consumers

const OcapiDataClient = require('../../ocapi/data-api/ocapi-data-client');

class SitePreferencesService {
    constructor(envStr, apiVersion, ocapiOptions, providerResolver) {
        this.envStr = envStr;
        this.apiVersion = apiVersion;
        this.ocapiOptions = ocapiOptions;
        this.providerResolver = providerResolver;
        this._ocapiDataClient = null;
    }

    // Lazily instantiated so the constructor never throws in envless contexts
    // (e.g. unit tests that validate logic before any network call is made).
    get ocapiDataClient() {
        if (!this._ocapiDataClient) {
            this._ocapiDataClient = new OcapiDataClient(
                this.envStr,
                this.apiVersion,
                this.ocapiOptions,
                this.providerResolver
            );
        }
        return this._ocapiDataClient;
    }

    async getPDPSizePickerEnabled() {
        return this.ocapiDataClient.getCustomSitePreference_PDP_Configuration_enablePDPSizePicker();
    }

    async getGiftCardTestingToken() {
        return this.ocapiDataClient.getCustomSitePreference_GiftCardTesting_testCreationEgcAuthToken();
    }

    async getCustomSitePreferenceByGroupAndId(groupName, preferenceId) {
        return this.ocapiDataClient.getCustomSitePreferenceByGroupAndId(groupName, preferenceId);
    }
}

module.exports = SitePreferencesService;
