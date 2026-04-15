const path = require('path');

const REFLogger = require('../../../util/ref-logger');

const OcapiDataEnvironment = require('../data-api/util/ocapi-data-env');
const OcapiDataAuthorization = require('../data-api/util/ocapi-data-auth');

const HttpRequestHelper = require('../../../util/http-request-helper');

class OcapiDataClient {
    constructor(env_str = process.env.ENV_HOST, apiVersion = 'v21_3') {
        this.env_str = env_str;
        this.apiVersion = apiVersion;

        this.ocapiDataEnv = new OcapiDataEnvironment(this.env_str);
        this.ocapiDataEnv.setOcapiEnvVars();

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        this.refLogger.debug(`OcapiDataClient initialized for environment ${ this.env_str}`);

        this.ocapiDataAuth = new OcapiDataAuthorization(this.ocapiDataEnv);
        this.httpRequestHelper = new HttpRequestHelper();
    }

    async getInventoryForSku(sku, inventoryList = "ref-web-inventory") {
        this.refLogger.info(` Attempting to retrieve inventory for sku >> ${sku} >> from inventoryList >> ${inventoryList} `);

        const dataToken = await this.ocapiDataAuth.getDataToken();
        const endpoint = this.#constructInventoryListUrl(sku, inventoryList);

        return await this.httpRequestHelper.performLookup({auth:dataToken, endpoint});
    }

    async putInventory (inventoryRecord, inventoryList = "ref-web-inventory") {
        this.refLogger.info(`Setting Inventory data for Inventory List >> ${JSON.stringify(inventoryList)} >> SKU: ${inventoryRecord.product_id} >> quantity: ${inventoryRecord.allocation} ...`);

        if (inventoryRecord.pre_order_back_order_allocation) {
            this.refLogger.info(`Preorder information >> allocation:  ${inventoryRecord.pre_order_back_order_allocation} >> inStockDate: ${inventoryRecord.in_stock_date}`);
        }

        const dataToken = await this.ocapiDataAuth.getDataToken();
        const endpoint = this.#constructInventoryListUrl(inventoryRecord.product_id, inventoryList);

        return await this.httpRequestHelper.performPut({auth:dataToken, endpoint, payload:inventoryRecord.json});
    }

    async getCustomSitePreferenceByGroupAndId(groupName, preferenceId) {
        this.refLogger.info(`Attempting to retrieve SFCC site preference [ ${preferenceId} ] from site preference group [ ${groupName} ] via OCAPI ...`);     

        const dataToken = await this.ocapiDataAuth.getDataToken();
        const endpoint = `${this.ocapiDataEnv.sfccHost}/s/-/dw/data/${this.apiVersion}/site_preferences/preference_groups/${groupName}/${this.ocapiDataEnv.sfccInstanceType}/preferences/${preferenceId}?mask_passwords=true`;
        this.refLogger.debug(`Endpoint for retrieving SFCC custom site preferences: ${endpoint}`);

        let sitePrefObject = null;
        try {
             sitePrefObject = await this.httpRequestHelper.performLookup({auth:dataToken, endpoint});
             this.refLogger.info(`${groupName}.${preferenceId} returned a valid response ...`);
        } catch (error) {
            this.refLogger.error(`Error retrieving site preference [ ${preferenceId} ] from group [ ${groupName} ]: ${error?.message}`);
            throw error;
        }

        return sitePrefObject;
    }

    async getCustomSitePreference_PDP_Configuration_enablePDPSizePicker() {
        const sitePref = await this.getCustomSitePreferenceByGroupAndId('PDP Configuration', 'enablePDPSizePicker');
        this.refLogger.debug(`Site Preference - enablePDPSizePicker: ${JSON.stringify(sitePref)}`);
        const sitePreferenceExists = sitePref?.id === 'enablePDPSizePicker' && sitePref?.site_values?.['reformation-us'] !== undefined;
        
        return sitePreferenceExists ? sitePref.site_values['reformation-us']: null;
    }

    #constructInventoryListUrl(sku, inventoryList = "ref-web-inventory") {
        return `${this.ocapiDataEnv.sfccHost}/s/-/dw/data/${this.apiVersion}/inventory_lists/${inventoryList}/product_inventory_records/${sku}`;
    }
}

module.exports = OcapiDataClient;
