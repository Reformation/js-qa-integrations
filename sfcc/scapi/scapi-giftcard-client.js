const path = require('path');

const REFLogger = require('../../util/ref-logger');

const ScapiEnvironment = require('./util/scapi-env');
const ScapiAuthorization = require('./util/scapi-auth');

const HttpRequestHelper = require('../../util/http-request-helper');

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
}

module.exports = ScapiGiftcardClient;
