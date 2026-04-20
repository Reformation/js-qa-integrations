const OcapiShopClient = require('./ocapi/shop-api/ocapi-shop-client');
const OcapiDataClient = require('./ocapi/data-api/ocapi-data-client');
const ScapiGiftcardClient = require('./scapi/scapi-giftcard-client');

class SfccClient {
    constructor(envStr = process.env.ENV_HOST, options = {}) {
        this.envStr = envStr;
        this.options = options;
        this.providerMap = {
            orders: options?.providerMap?.orders || 'ocapi',
            stores: options?.providerMap?.stores || 'ocapi',
            baskets: options?.providerMap?.baskets || 'ocapi',
            data: options?.providerMap?.data || 'ocapi',
            giftcards: options?.providerMap?.giftcards || 'scapi'
        };

        this.ocapiShopClient = new OcapiShopClient(
            this.envStr,
            options.apiVersion || 'v21_3',
            options.ocapiOptions || {}
        );

        this.ocapiDataClient = new OcapiDataClient(
            this.envStr,
            options.apiVersion || 'v21_3'
        );

        this.scapiGiftcardClient = new ScapiGiftcardClient(
            this.envStr
        );
    }

    #getProvider(capability) {
        return this.providerMap[capability] || 'ocapi';
    }

    // Order methods
    async getOrderByOrderNumber(orderNumber) {
        const provider = this.#getProvider('orders');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getOrderByOrderNumber(orderNumber);
        }

        throw new Error(`Unsupported orders provider [ ${provider} ].`);
    }

    async getOrderNumberByGleOrderNumber(gleOrderNumber) {
        const provider = this.#getProvider('orders');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getSfccOrderNumberByGLEOrderNumber(gleOrderNumber);
        }

        throw new Error(`Unsupported orders provider [ ${provider} ].`);
    }

    // Store methods
    async getStoreList() {
        const provider = this.#getProvider('stores');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getSfccStoreList();
        }

        throw new Error(`Unsupported stores provider [ ${provider} ].`);
    }

    // Basket methods
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

    // Data API methods
    async getInventoryForSku(sku, inventoryList = 'ref-web-inventory') {
        const provider = this.#getProvider('data');
        if (provider === 'ocapi') {
            return await this.ocapiDataClient.getInventoryForSku(sku, inventoryList);
        }

        throw new Error(`Unsupported data provider [ ${provider} ].`);
    }

    async putInventory(inventoryRecord, inventoryList = 'ref-web-inventory') {
        const provider = this.#getProvider('data');
        if (provider === 'ocapi') {
            return await this.ocapiDataClient.putInventory(inventoryRecord, inventoryList);
        }

        throw new Error(`Unsupported data provider [ ${provider} ].`);
    }

    // Giftcard methods (SCAPI)
    async createTestGiftcard(amount, recipientEmail, recipientName, orderNumber, sharedCreateEgcSitePrefToken) {
        const provider = this.#getProvider('giftcards');
        if (provider === 'scapi') {
            return await this.scapiGiftcardClient.createTestGiftcard(amount, recipientEmail, recipientName, orderNumber, sharedCreateEgcSitePrefToken);
        }

        throw new Error(`Unsupported giftcards provider [ ${provider} ].`);
    }
}

module.exports = SfccClient;