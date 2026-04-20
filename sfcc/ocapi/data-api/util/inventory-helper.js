const path = require('path');

var ocapiDataPath = 'dw/data/v23_1/';

const REFLogger = require('../../../../util/ref-logger.js');
const RefInventoryProductRecord = require('../../../ref-inventory-product-record.js');
const requestHelper = require('../../../../util/request-helper.js');

const OcapiDataClient = require('../ocapi-data-client.js');

function getInventoryLists(sfccEnv, dataToken,) {
    console.log('inside getInventoryLists');
    return new Promise(async (resolve, reject) => {
        try {
            resolve();
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });

};

function getProductInventoryRecord(sfccEnv, dataToken, clientId, inventoryListId, productId) {
    console.log('inside getProductInventoryRecord');
    return new Promise(async (resolve, reject) => {
        try {
            let record = null;

            console.log('product_id : ' + productId);
            let url = sfccEnv + '/s/-/' + ocapiDataPath + 'inventory_lists/' + inventoryListId + '/product_inventory_records/' + productId  + '?client_id=' + clientId;
            console.log(url);
            let payload = null;
            const contentType = 'application/json';
            let method = 'GET';
            const isForm = null;            
            const responseData = await requestHelper.sendRequest(url, dataToken, payload, method, isForm, contentType, true);
            if (responseData.statusCode == 200) {
                record = new RefInventoryProductRecord(responseData.data);
            }

            resolve(record);
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function createOrUpdateProductRecord(sfccEnv, dataToken, clientId, record, mode) {
    console.log('inside getProductInventoryRecord');
    return new Promise(async (resolve, reject) => {
        try {
            let productId = record.product_id.toUpperCase(); // ensure product_id is uppercase
            let inventoryListId = record.inventory_list_id;
            let returnRecord = null;
            console.log('product_id : ' + record.productId);
            let url = sfccEnv + '/s/-/' + ocapiDataPath + 'inventory_lists/' + inventoryListId + '/product_inventory_records/' + productId  + '?client_id=' + clientId;
            console.log(url);
            let method = 'POST';
            if (mode == 'update') {
                method = 'PATCH';
            }

            let payload = record.json; // this is the object to be sent to the API


            const contentType = 'application/json';

            const isForm = null;            
            const responseData = await requestHelper.sendRequest(url, dataToken, payload, method, isForm, contentType, true);
            if (responseData.statusCode == 200) {
                returnRecord = new RefInventoryProductRecord(responseData.data);
            }

            resolve(returnRecord);
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function setupInventory(sfccEnv, dataToken, clientId, iInventoryData) {
    console.log('inside setupInventory');
    return new Promise(async (resolve, reject) => {
        try {
            // duplicate incoming parameter without destroying it
            let inventoryData = JSON.parse(JSON.stringify(iInventoryData));

            while (inventoryData.length) {
                let inventory = inventoryData.shift();

                let inventoryRecord = await getProductInventoryRecord(sfccEnv, dataToken, clientId, inventory.inventory_list_id, inventory.product_id);
                if (!inventoryRecord) {
                    // create inventory record
                    console.log(inventory.product_id + ' does not exist, creating new inventory record');
                    await createOrUpdateProductRecord(sfccEnv, dataToken, clientId, inventory, 'create');
                } else {
                    // update inventory record
                    console.log(inventory.product_id + ' exists, updating inventory record');
                    await createOrUpdateProductRecord(sfccEnv, dataToken, clientId, inventory, 'update');
                }
            }


            resolve();

        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
};

async function initializeAllInventoryForSku(sku, inventoryData) {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);

    refLogger.info('Batch Inventory load ...');
  
    try {
        let inventoryList = JSON.parse(JSON.stringify(inventoryData));
        let i = 0
        while (inventoryList.length) {
            let inventory = inventoryList.shift();
            refLogger.debug(`Inventory record ${i++} : ${JSON.stringify(inventory)}`);
            refLogger.debug(`Inventory list id: ${inventory.inventory_list_id}`);
            refLogger.debug(`Inventory sku: ${sku}`);
            refLogger.debug(`Inventory quantity: ${inventory.quantity}`);
            refLogger.debug(`Inventory perpetual: ${inventory.perpetual}`);
            await createInventoryForSku({sku, inStockQuantity: inventory.quantity, inventoryList: inventory.inventory_list_id, perpetual: inventory.perpetual}); 
        }

        refLogger.info('-------- Done adding inventory records to SFCC ...');
    }
    catch (err) {
        refLogger.error('Error in inventory setup');
        refLogger.error(err.message);
        refLogger.error('Inventory data -> ' + JSON.stringify(inventoryData));
        throw err;
    }
}
    

async function createPreorderForSku({sku, preorderAllocation = 5, inStockDate = null}) {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);
    refLogger.debug('inside createPreorderForSku');

    // Setup In Stock Date
    if (!inStockDate) {
        const now = new Date();
        const future = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days in the future
        inStockDate = future.toISOString();
        refLogger.debug(`Preorder ship date: ${inStockDate}`);
    }

    refLogger.info(`Preorder allocation: ${preorderAllocation}`);
    refLogger.info(`Preorder SKU: ${sku}`);

    await createInventoryForSku({sku, inStockQuantity: 0, inventoryList: 'ref-web-inventory', preorderAllocation, inStockDate}); 
    refLogger.debug("-------- Done adding preorder record to 'ref-web-inventory' ...");

    await createInventoryForSku({sku, inStockQuantity: 0, inventoryList: 'ref-vrn-inventory', preorderAllocation, inStockDate}); 
    refLogger.debug("-------- Done adding preorder record to 'ref-vrn-inventory' ...");
}

async function createInventoryForSku({sku, inStockQuantity, inventoryList = 'ref-web-inventory', perpetual = false, preorderAllocation = 0, inStockDate = null}){
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);
    refLogger.debug('inside createInventoryForSku');

    try {
        const productInventoryData = {
            allocation: {
                amount: inStockQuantity,
            },
            product_id: sku,
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

        if (preorderAllocation) {
            productInventoryData.pre_order_back_order_allocation = preorderAllocation;
            productInventoryData.pre_order_back_order_handling = "preorder";
            productInventoryData.in_stock_date =  inStockDate;
        }

        const inventoryRecord = new RefInventoryProductRecord(productInventoryData);
        refLogger.debug(inventoryRecord);

        const ocapiDataClient = new OcapiDataClient();
        const response = await ocapiDataClient.putInventory(inventoryRecord, inventoryList);

        refLogger.debug(response);

    } catch (err) {
        refLogger.error(err.message);
        err.customErrorMessage = `Error creating inventory for SKU: ${sku} in inventory list: ${inventoryList}`;
        throw err;
    }
}

export { 
    getInventoryLists, 
    setupInventory, 
    initializeAllInventoryForSku, 
    createInventoryForSku, 
    createPreorderForSku
};
