const path = require('path');

const REFLogger = require('../../../util/ref-logger');
const HttpRequestHelper = require('../../../util/http-request-helper');

class ScapiAuthorization {
    constructor(scapiEnv) {
        this.scapiEnv = scapiEnv;
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    #getBase64Token(user, pass) {
        if (!user || !pass) {
            throw new Error('User or password is missing');
        }

        const key = user + ':' + pass;
        return Buffer.from(key).toString('base64');
    }

    async getScapiToken() {
        const endpoint = 'https://account.demandware.com/dwsso/oauth2/access_token';

        const scope = `SALESFORCE_COMMERCE_API:${this.scapiEnv.scapiInstanceId} c_scapi_dev_tools`;

        const payload = {
            grant_type: 'client_credentials',
            scope
        };

        const basicAuth = this.#getBase64Token(this.scapiEnv.scapiClientId, this.scapiEnv.scapiClientSecret);

        try {
            const httpRequestHelper = new HttpRequestHelper();
            const response = await httpRequestHelper.performPost({
                auth: basicAuth,
                endpoint,
                payload,
                isForm: true,
                contentType: 'application/x-www-form-urlencoded'
            });

            const responseJson = response.data;
            const accessToken = responseJson.access_token;

            if (!accessToken) {
                this.refLogger.error('---------------- ERROR getScapiToken RESPONSE ----------------------');
                this.refLogger.error(responseJson);
                throw new Error('Access token not found in the response');
            }

            return accessToken;
        } catch (error) {
            this.refLogger.error('---------------- ERROR getScapiToken GENERAL EXCEPTION ----------------------');
            this.refLogger.error(error.toString());
            throw error;
        }
    }
}

module.exports = ScapiAuthorization;
