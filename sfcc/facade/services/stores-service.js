const OcapiShopClient = require('../../ocapi/shop-api/ocapi-shop-client');

class StoresService {
    constructor({ envStr, apiVersion, ocapiOptions, providerResolver }) {
        this.envStr = envStr;
        this.apiVersion = apiVersion;
        this.ocapiOptions = ocapiOptions || {};
        this.providerResolver = providerResolver;
        this._ocapiShopClient = null;
    }

    // Lazily instantiated so the constructor never throws in envless contexts
    // (e.g. unit tests that validate logic before any network call is made).
    get ocapiShopClient() {
        if (!this._ocapiShopClient) {
            this._ocapiShopClient = new OcapiShopClient(this.envStr, this.apiVersion, this.ocapiOptions);
        }
        return this._ocapiShopClient;
    }

    #getProvider(capability) {
        return this.providerResolver(capability) || 'ocapi';
    }

    async getStoreList() {
        const provider = this.#getProvider('stores');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getSfccStoreList();
        }

        throw new Error(`Unsupported stores provider [ ${provider} ].`);
    }
}

module.exports = StoresService;
