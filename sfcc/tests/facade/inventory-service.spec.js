const assert = require('assert');
const InventoryService = require('../../facade/services/inventory-service');

// InventoryService has real input validation logic that runs before any network call.
// These tests exercise that logic directly — no mocks needed.
function makeService() {
    return new InventoryService({
        envStr: null,
        apiVersion: 'v21_3',
        providerResolver: () => 'ocapi'
    });
}

describe('InventoryService - initializeAllInventoryForSku input validation', () => {

    test('throws when sku is missing', async () => {
        const service = makeService();
        try {
            await service.initializeAllInventoryForSku('', []);
            assert.fail('Expected error');
        } catch (err) {
            assert.strictEqual(err.message, 'sku is required');
        }
    });

    test('throws when inventoryData is not an array', async () => {
        const service = makeService();
        try {
            await service.initializeAllInventoryForSku('SKU-001', null);
            assert.fail('Expected error');
        } catch (err) {
            assert.strictEqual(err.message, 'inventoryData must be an array');
        }
    });

    test('throws when inventory_list_id is missing', async () => {
        const service = makeService();
        try {
            await service.initializeAllInventoryForSku('SKU-001', [{ quantity: 5 }]);
            assert.fail('Expected error');
        } catch (err) {
            assert.strictEqual(err.message, 'inventory.inventory_list_id is required');
        }
    });

    test('throws when quantity is not a number', async () => {
        const service = makeService();
        try {
            await service.initializeAllInventoryForSku('SKU-001', [{ inventory_list_id: 'ref-web-inventory', quantity: 'lots' }]);
            assert.fail('Expected error');
        } catch (err) {
            assert.strictEqual(err.message, 'inventory.quantity must be a finite number');
        }
    });
});
