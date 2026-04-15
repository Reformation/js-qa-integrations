const BaseIntegrationEnv = require('../util/base-integration-env');

class SfccEnvironment extends BaseIntegrationEnv {
    constructor(envStr) {
        super(envStr);
        this.sfccHost = '';
        this.sfccInstanceType = '';
    }

    setEnvVars() {
        this.validateEnvStr();

        this.sfccHost = this.loadEnvVar('SFCC_HOST', 'SFCC_HOST_XXX');

        if (this.envStr.toUpperCase() === 'DEV') {
            this.sfccInstanceType = 'development';
        } else if (this.envStr.toUpperCase() === 'STG') {
            this.sfccInstanceType = 'staging';
        } else {
            this.sfccInstanceType = 'sandbox';  // NO TESTING RUNS AGAINST PROD (7/2025)
        }
    }
}

module.exports = SfccEnvironment;