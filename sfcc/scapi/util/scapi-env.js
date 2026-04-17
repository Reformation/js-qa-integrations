const SfccEnvironment = require('../../sfcc-env');

class ScapiEnvironment extends SfccEnvironment {
    constructor(envStr) {
        super(envStr);
        this.scapiClientId = '';
        this.scapiClientSecret = '';
        this.scapiOrgId = '';
        this.scapiInstanceId = '';
        this.scapiShortCode = '';
        this.scapiApiVersion = '';
    }

    setScapiEnvVars() {
        this.validateEnvStr();
        super.setEnvVars();

        const vars = this.loadEnvVars(['SCAPI_CLIENT_ID', 'SCAPI_CLIENT_SECRET', 'SCAPI_ORG_ID', 'SCAPI_INSTANCE_ID', 'SCAPI_SHORT_CODE', 'SCAPI_API_VERSION']);
        this.scapiClientId = vars.SCAPI_CLIENT_ID;
        this.scapiClientSecret = vars.SCAPI_CLIENT_SECRET;
        this.scapiOrgId = vars.SCAPI_ORG_ID;
        this.scapiInstanceId = vars.SCAPI_INSTANCE_ID;
        this.scapiShortCode = vars.SCAPI_SHORT_CODE;
        this.scapiApiVersion = vars.SCAPI_API_VERSION || 'v1';
    }
}

module.exports = ScapiEnvironment;
