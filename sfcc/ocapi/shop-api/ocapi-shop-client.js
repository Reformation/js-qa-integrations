const path = require('path');

const REFLogger = require('../../../util/ref-logger');
const HttpRequestHelper = require('../../../util/http-request-helper');
const OcapiShopEnvironment = require('./util/ocapi-shop-env');
const OcapiShopAuthorization = require('./util/ocapi-shop-auth');
const OcapiShopBasket = require('./util/ocapi-shop-basket');

class OcapiShopClient {
    constructor(env_str = process.env.ENV_HOST, apiVersion = 'v21_3', options = {}) {
        this.basketHelper = new OcapiShopBasket();
        this.env_str = env_str;
        this.apiVersion = apiVersion;

        this.ocapiShopEnv = new OcapiShopEnvironment(this.env_str);
        this.ocapiShopEnv.setOcapiEnvVars();

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        this.ocapiShopAuth = new OcapiShopAuthorization(this.ocapiShopEnv, options);
        this.httpRequestHelper = new HttpRequestHelper();

        const normalizedOptions = typeof options === 'boolean' ? { reuseBearerToken: options } : options;
        this.reuseBearerToken = Boolean(normalizedOptions.reuseBearerToken);

        const expirationBufferSeconds = Number.isFinite(normalizedOptions.expirationBufferSeconds)
            ? normalizedOptions.expirationBufferSeconds
            : 20;
        this.expirationBufferMs = expirationBufferSeconds * 1000;

        this.cachedBearerToken = null;
        this.cachedBearerTokenExpiresAtMs = 0;
    }

    async getBasketByBasketId(basketId) {
        this.refLogger.info(`Attempting to retrieve the SFCC basket via OCAPI for basket_id [ ${basketId} ]`);

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets/${basketId}`;

        return await this.httpRequestHelper.performLookup({ auth: bearerToken, endpoint });
    }

    async getOrderByOrderNumber(orderNumber) {
        this.refLogger.info(`Attempting to retrieve the SFCC order via OCAPI for order_number [ ${orderNumber} ]`);

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/orders/${orderNumber}`;

        return await this.httpRequestHelper.performLookup({ auth: bearerToken, endpoint });
    }

    async deleteBasket(basketId) {
        this.refLogger.info(`Attempting to delete SFCC basket via OCAPI for basket_id [ ${basketId} ]`);

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets/${basketId}`;
        this.refLogger.debug(`Endpoint for delete basket request: ${endpoint}`);

        return await this.httpRequestHelper.performDelete({ auth: bearerToken, endpoint });
    }

    async getSfccOrderNumberByGLEOrderNumber(orderNumber) {
        this.refLogger.info(`Attempting to retrieve the SFCC order via OCAPI for order_number [ ${orderNumber} ]`);

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/order_search`;

        const payload = {
            "query": {
                "text_query": {
                    "fields": ["c_geOrderNumber"],
                    "search_phrase": `${orderNumber}`
                }
            }
        };

        this.refLogger.debug(`OCAPI endpoint for order retrieval by GLE order number: ${endpoint}`);
        this.refLogger.debug(`OCAPI payload for order retrieval by GLE order number: ${JSON.stringify(payload)}`);

        const response = await this.httpRequestHelper.performPost({
            auth: bearerToken,
            endpoint,
            payload,
            isForm: false,
            contentType: 'application/json'
        });

        this.refLogger.info(`Order response: ${JSON.stringify(response)}`);

        // Extract order_no from response
        if (response?.data?.hits?.length > 0) {
            return response.data.hits[0].data.order_no;
        }

        this.refLogger.warn(`No SFCC order found for GLE order number: ${orderNumber}`);
        return null;
    }

    async getSfccStoreList() {
        this.refLogger.info('Attempting to retrieve the SFCC store list via OCAPI ...');

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/stores`;

        return await this.httpRequestHelper.performLookup({ auth: bearerToken, endpoint });
    }

    async createBasket(iPayload) {
        let payload = iPayload;
        if (!payload) {
            // we'll create a dummy payload
            payload = {
                "currency": "USD",
                "channel_type": "callcenter",
                "billing_address": {
                    "first_name": "Store",
                    "last_name": "Customer",
                    "city": "New York",
                    "state_code": "NY",
                    "address1": "39 Bond St.",
                    "country_code": "US",
                    "postal_code": "10012"
                },
                "product_items": [
                    {
                        "quantity": 1,
                        "product_id": "1310681WLW005"
                    }
                ],
                "gift_certificate_items": [],
                "c_storeID": "13"
            };
        }

        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        // log the endpoint for debugging purposes
        this.refLogger.debug(`OCAPI endpoint bearerToken for create basket request: ${bearerToken}`);
        const endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets`;
        this.refLogger.info(`OCAPI endpoint for create basket request: ${endpoint}`);

        return await this.httpRequestHelper.performPost({ auth: bearerToken, endpoint, payload, isForm: false, contentType: 'application/json' });
    }

    async getBasket(basketId, optionalQuery) {
        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        let endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets/${basketId}`;
        if (optionalQuery) {
            endpoint += `?${optionalQuery}`;
        }

        return await this.httpRequestHelper.performLookup({ auth: bearerToken, endpoint });
    }

    async forceBasketHubCodes(basketId, countryCode = 'US') {
        this.refLogger.info(`Attempting to force set hub codes on SFCC basket via OCAPI for basket_id [ ${basketId} ]`);
        const bearerToken = await this.ocapiShopAuth.getBearerToken();
        let endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets/${basketId}?setBasketHubCodes=true&countryCode=${countryCode}`;
        // Send an intentionally empty JSON body to trigger hub code recalculation.
        return await this.httpRequestHelper.performPatch({ auth: bearerToken, endpoint, payload: {}, isForm: false });
    }

    /**
     * Action: Add Product to Cart
     */
    async addProduct(basketId, productId, quantity = 1) {
        let endpoint = `${this.ocapiShopEnv.sfccHost}/s/reformation-us/dw/shop/${this.apiVersion}/baskets/${basketId}/items`;
        const payload = this.basketHelper.getAddProductToBasketPayload(productId, quantity);
        const bearerToken = await this.ocapiShopAuth.getBearerToken();

        return await this.httpRequestHelper.performPost({ auth: bearerToken, endpoint, payload: payload, isForm: false });

    }
}

module.exports = OcapiShopClient;
