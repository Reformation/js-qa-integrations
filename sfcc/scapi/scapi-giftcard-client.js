const path = require('path');

const REFLogger = require('../../util/ref-logger');
const HttpRequestHelper = require('../../util/http-request-helper');
const ScapiEnvironment = require('./util/scapi-env');
const ScapiAuthorization = require('./util/scapi-auth');

class ScapiGiftcardClient {
    constructor(env_str = process.env.ENV_HOST) {
        this.env_str = env_str;

        this.scapiEnv = new ScapiEnvironment(this.env_str);
        this.scapiEnv.setScapiEnvVars();

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        this.refLogger.debug(`ScapiGiftcardClient initialized for environment ${this.env_str}`);

        this.scapiAuth = new ScapiAuthorization(this.scapiEnv);
        this.httpRequestHelper = new HttpRequestHelper();
    }

    async createTestGiftcard(amount, recipientEmail, recipientName, orderNumber) {
        const giftcardData = {
            amount,
            recipientEmail,
            recipientName,
            senderName: 'QA Automation',
            message: 'Test giftcard',
            orderNo: orderNumber
        };

        this.refLogger.info(`Attempting to create test giftcard via SCAPI with amount [ ${amount} ]`);

        try {
            const bearerToken = await this.scapiAuth.getScapiToken();
            const endpoint = `https://${this.scapiEnv.scapiShortCode}.api.commercecloud.salesforce.com/custom/create-test-giftcard/${this.scapiEnv.scapiApiVersion}/organizations/${this.scapiEnv.scapiOrgId}/createTestGiftcard?siteId=reformation-us`;

            this.refLogger.debug(`SCAPI endpoint for creating test giftcard: ${endpoint}`);
            this.refLogger.debug(`SCAPI payload for creating test giftcard: ${JSON.stringify(giftcardData)}`);

            const response = await this.httpRequestHelper.performPost({
                auth: bearerToken,
                endpoint,
                payload: giftcardData,
                isForm: false,
                contentType: 'application/json'
            });

            this.refLogger.info(`Test giftcard created successfully: ${JSON.stringify(response)}`);
            return response;
        } catch (error) {
            this.refLogger.error(`Error creating test giftcard: ${error?.message}`);
            throw error;
        }
    }
}

module.exports = ScapiGiftcardClient;
