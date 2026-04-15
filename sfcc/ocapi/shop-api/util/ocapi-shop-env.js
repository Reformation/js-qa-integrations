const process = require('process');
const SfccEnvironment = require('../../../sfcc-env');

class OcapiShopEnvironment extends SfccEnvironment {
    constructor(envStr = process.env.ENV_HOST) {
        super(envStr);
        this.envStr = envStr;
        this.clientId = '';
        this.clientSecret = '';
        this.dataToken = '';
        this.ocapiUsername = '';
        this.ocapiTokenPassword = '';
    }

    setOcapiEnvVars() {
        if (!this.envStr) {
            throw new Error("ENV_STR cannot be empty. It must be in the following format [ 004, 008, 025, DEV, STG ... ].");
        }

        super.setEnvVars();

        const clientIdKey = `CLIENT_ID_${this.envStr.toUpperCase()}`;
        const clientSecretKey = `CLIENT_SECRET_${this.envStr.toUpperCase()}`;
        const ocapiUsernameKey = `OCAPI_USERNAME_${this.envStr.toUpperCase()}`;
        const ocapiTokenPasswordKey = `OCAPI_TOKEN_${this.envStr.toUpperCase()}`;

        if (!process.env[clientIdKey]) {
            throw new Error("ENVIRONMENT is not set up correctly. You're missing the following configurations [ CLIENT_ID_XXX ].");
        }
        this.clientId = process.env[clientIdKey];

        if (!process.env[clientSecretKey]) {
            throw new Error("ENVIRONMENT is not set up correctly. You're missing the following configurations [ CLIENT_SECRET_XXX ].");
        }
        this.clientSecret = process.env[clientSecretKey];

        if (!process.env[ocapiUsernameKey]) {
            throw new Error("ENVIRONMENT is not set up correctly. You're missing the following configurations [ OCAPI_USERNAME_XXX ].");
        }
        this.ocapiUsername = process.env[ocapiUsernameKey];

        if (!process.env[ocapiTokenPasswordKey]) {
            throw new Error("ENVIRONMENT is not set up correctly. You're missing the following configurations [ OCAPI_TOKEN_XXX ].");
        }
        this.ocapiTokenPassword = process.env[ocapiTokenPasswordKey];
    }
}

module.exports = OcapiShopEnvironment;