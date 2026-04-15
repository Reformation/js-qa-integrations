const SfccEnvironment = require('../../sfcc-env');

class ScapiEnvironment extends SfccEnvironment {
    constructor(envStr) {
        super(envStr);
        this.scapiClientId = '';
        this.scapiClientSecret = '';
        this.scapiOrgId = '';
    }

    setScapiEnvVars() {
        this.validateEnvStr();
        super.setEnvVars();

        const vars = this.loadEnvVars(['SCAPI_CLIENT_ID', 'SCAPI_CLIENT_SECRET', 'SCAPI_ORG_ID']);
        this.scapiClientId = vars.SCAPI_CLIENT_ID;
        this.scapiClientSecret = vars.SCAPI_CLIENT_SECRET;
        this.scapiOrgId = vars.SCAPI_ORG_ID;
    }
}

module.exports = ScapiEnvironment;
