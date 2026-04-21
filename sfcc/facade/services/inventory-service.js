const OcapiDataClient = require('../../ocapi/data-api/ocapi-data-client');
const RefInventoryProductRecord = require('../../ref-inventory-product-record');

class InventoryService {
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
        return this.providerResolver(capability) || 'ocapi';
    }

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

    async initializeAllInventoryForSku(sku, inventoryData) {
        if (typeof sku !== 'string' || !sku.trim()) {
            throw new Error('sku is required');
        }

        if (!Array.isArray(inventoryData)) {
            throw new Error('inventoryData must be an array');
        }

        const normalizedSku = sku.trim().toUpperCase();

        for (const inventory of inventoryData) {
            const inventoryList = inventory?.inventory_list_id;
            const inStockQuantity = inventory?.quantity;
            const perpetual = Boolean(inventory?.perpetual);

            if (!inventoryList) {
                throw new Error('inventory.inventory_list_id is required');
            }

            if (typeof inStockQuantity !== 'number' || !Number.isFinite(inStockQuantity)) {
                throw new Error('inventory.quantity must be a finite number');
            }

            const productInventoryData = {
                allocation: {
                    amount: inStockQuantity,
                },
                product_id: normalizedSku,
                perpetual_flag: perpetual,
                c_perpetualForStoreInventory: perpetual,
                inventory_turnover: 0,
                c_damaged: 0,
                c_floor: 0,
                c_missing: 0,
                c_reserve: 0,
                c_return: 0,
                c_refOnOrder: 0,
                c_refTurnover: 0
            };

            const inventoryRecord = new RefInventoryProductRecord(productInventoryData);
            await this.putInventory(inventoryRecord, inventoryList);
        }
    }
}

module.exports = InventoryService;
