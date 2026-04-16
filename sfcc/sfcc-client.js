const OcapiShopClient = require('./ocapi/shop-api/ocapi-shop-client');

class SfccClient {
    constructor(envStr = process.env.ENV_HOST, options = {}) {
        this.envStr = envStr;
        this.options = options;
        this.providerMap = {
            orders: options?.providerMap?.orders || 'ocapi',
            stores: options?.providerMap?.stores || 'ocapi'
        };

        this.ocapiShopClient = new OcapiShopClient(
            this.envStr,
            options.apiVersion || 'v21_3',
            options.ocapiOptions || {}
        );
    }

    #getProvider(capability) {
        return this.providerMap[capability] || 'ocapi';
    }

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

    async getStoreList() {
        const provider = this.#getProvider('stores');
        if (provider === 'ocapi') {
            return await this.ocapiShopClient.getSfccStoreList();
        }

        throw new Error(`Unsupported stores provider [ ${provider} ].`);
    }
}

module.exports = SfccClient;