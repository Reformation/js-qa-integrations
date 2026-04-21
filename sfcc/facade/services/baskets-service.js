const OcapiShopClient = require('../../ocapi/shop-api/ocapi-shop-client');

class BasketsService {
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

    async getBasketByBasketId(basketId) {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getBasketByBasketId(basketId);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }

    async deleteBasket(basketId) {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.deleteBasket(basketId);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }

    async createBasket(payload) {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.createBasket(payload);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }

    async getBasket(basketId, optionalQuery) {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getBasket(basketId, optionalQuery);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }

    async forceBasketHubCodes(basketId, countryCode = 'US') {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.forceBasketHubCodes(basketId, countryCode);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }

    async addProduct(basketId, productId, quantity = 1) {
        const provider = this.#getProvider('baskets');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.addProduct(basketId, productId, quantity);
        }

        throw new Error(`Unsupported baskets provider [ ${provider} ].`);
    }
}

module.exports = BasketsService;
