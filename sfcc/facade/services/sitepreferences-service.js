const OcapiDataClient = require('../../ocapi/data-api/ocapi-data-client');

class SitePreferencesService {
    constructor({ envStr, apiVersion, providerResolver }) {
        this.envStr = envStr;
        this.apiVersion = apiVersion;
        this.providerResolver = providerResolver;
        this._ocapiDataClient = null;
    }

    // Lazily instantiated so the constructor never throws in envless contexts
    // (e.g. unit tests that validate logic before any network call is made).
    get ocapiDataClient() {
        if (!this._ocapiDataClient) {
            this._ocapiDataClient = new OcapiDataClient(this.envStr, this.apiVersion);
        }
        return this._ocapiDataClient;
    }

    #getProvider(capability) {
        return this.providerResolver ? this.providerResolver(capability) : 'ocapi';
    }

    async getPDPSizePickerEnabled() {
        const provider = this.#getProvider('data');
        if (provider === 'ocapi') {
            return await this.ocapiDataClient.getCustomSitePreference_PDP_Configuration_enablePDPSizePicker();
        }
        throw new Error(`Unsupported data provider [ ${provider} ].`);
    }

    async getGiftCardTestingToken() {
        const provider = this.#getProvider('data');
        if (provider === 'ocapi') {
            return await this.ocapiDataClient.getCustomSitePreference_GiftCardTesting_testCreationEgcAuthToken();
        }
        throw new Error(`Unsupported data provider [ ${provider} ].`);
    }

    async getCustomSitePreferenceByGroupAndId(groupName, preferenceId) {
        const provider = this.#getProvider('data');
        if (provider === 'ocapi') {
            return await this.ocapiDataClient.getCustomSitePreferenceByGroupAndId(groupName, preferenceId);
        }
        throw new Error(`Unsupported data provider [ ${provider} ].`);
    }
}

module.exports = SitePreferencesService;
