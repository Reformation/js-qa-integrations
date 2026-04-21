const InventoryService = require('./facade/services/inventory-service');
const OrdersService = require('./facade/services/orders-service');
const BasketsService = require('./facade/services/baskets-service');
const StoresService = require('./facade/services/stores-service');
const GiftcardsService = require('./facade/services/giftcards-service');

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

        const serviceConfig = {
            envStr: this.envStr,
            apiVersion: options.apiVersion || 'v21_3',
            ocapiOptions: options.ocapiOptions || {},
            providerResolver: (capability) => this.#getProvider(capability)
        };

        this.ordersService = new OrdersService(serviceConfig);
        this.storesService = new StoresService(serviceConfig);
        this.basketsService = new BasketsService(serviceConfig);
        this.inventoryService = new InventoryService(serviceConfig);
        this.giftcardsService = new GiftcardsService(serviceConfig);
    }

    #getProvider(capability) {
        return this.providerMap[capability] || 'ocapi';
    }

    // Order methods
    async getOrderByOrderNumber(orderNumber) {
        return await this.ordersService.getOrderByOrderNumber(orderNumber);
    }

    async getOrderNumberByGleOrderNumber(gleOrderNumber) {
        return await this.ordersService.getOrderNumberByGleOrderNumber(gleOrderNumber);
    }

    // Store methods
    async getStoreList() {
        return await this.storesService.getStoreList();
    }

    // Basket methods
    async getBasketByBasketId(basketId) {
        return await this.basketsService.getBasketByBasketId(basketId);
    }

    async deleteBasket(basketId) {
        return await this.basketsService.deleteBasket(basketId);
    }

    async createBasket(payload) {
        return await this.basketsService.createBasket(payload);
    }

    async getBasket(basketId, optionalQuery) {
        return await this.basketsService.getBasket(basketId, optionalQuery);
    }

    async forceBasketHubCodes(basketId, countryCode = 'US') {
        return await this.basketsService.forceBasketHubCodes(basketId, countryCode);
    }

    async addProduct(basketId, productId, quantity = 1) {
        return await this.basketsService.addProduct(basketId, productId, quantity);
    }

    // Data API methods
    async getInventoryForSku(sku, inventoryList = 'ref-web-inventory') {
        return await this.inventoryService.getInventoryForSku(sku, inventoryList);
    }

    async putInventory(inventoryRecord, inventoryList = 'ref-web-inventory') {
        return await this.inventoryService.putInventory(inventoryRecord, inventoryList);
    }

    async initializeAllInventoryForSku(sku, inventoryData) {
        return await this.inventoryService.initializeAllInventoryForSku(sku, inventoryData);
    }

    // Giftcard methods (SCAPI)
    async createTestGiftcard(amount, recipientEmail, recipientName, orderNumber, sharedCreateEgcSitePrefToken) {
        return await this.giftcardsService.createTestGiftcard(
            amount,
            recipientEmail,
            recipientName,
            orderNumber,
            sharedCreateEgcSitePrefToken
        );
    }
}

module.exports = SfccClient;