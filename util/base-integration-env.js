const process = require('process');

const EnvVarLoader = require('./env-var-loader');

class BaseIntegrationEnv {
    constructor(envStr = process.env.ENV_HOST) {
        this.envStr = envStr;
    }

    validateEnvStr() {
        if (!this.envStr) {
            throw new Error(
                "ENV_STR cannot be empty. It must be in the following format [ 004, 008, 025, DEV, STG ... ]."
            );
        }
    }

    loadEnvVar(varName, category = null) {
        return EnvVarLoader.loadEnvVar(varName, this.envStr, category);
    }

    loadEnvVars(varNames) {
        return EnvVarLoader.loadEnvVars(varNames, this.envStr);
    }
}

module.exports = BaseIntegrationEnv;
