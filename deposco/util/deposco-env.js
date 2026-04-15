const BaseIntegrationEnv = require('../../util/base-integration-env');

class DeposcoEnvironment extends BaseIntegrationEnv {
    constructor(envStr) {
        super(envStr);
        this.username = '';
        this.password = '';
        this.deposcoHost = '';
    }

    setDeposcoEnvVars() {
        this.validateEnvStr();

        const vars = this.loadEnvVars(['DEPOSCO_USERNAME', 'DEPOSCO_PASSWORD', 'DEPOSCO_HOST']);
        this.username = vars.DEPOSCO_USERNAME;
        this.password = vars.DEPOSCO_PASSWORD;
        this.deposcoHost = vars.DEPOSCO_HOST;
    }
}

module.exports = DeposcoEnvironment;