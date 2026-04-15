const path = require('path');

const REFLogger = require('../../../../util/ref-logger');
const HttpRequestHelper = require('../../../../util/http-request-helper');

class OcapiDataAuthorization {
    constructor(ocapiDataEnv) {
        this.ocapiDataEnv = ocapiDataEnv;
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }
    
    getBase64Token(user, pass) {
        if (!user || !pass) {
            throw new Error('User or password is missing');
        }

        let key = user + ":" + pass;
        return Buffer.from(key).toString('base64');
    }

    async getDataToken() {
        const endpoint = 'https://account.demandware.com/dwsso/oauth2/access_token';

        const payload = { 
            grant_type: 'client_credentials'
        }

        const basicAuth = this.getBase64Token(this.ocapiDataEnv.clientId, this.ocapiDataEnv.clientSecret);

        try {
            const ocapiRequestTemplate = new HttpRequestHelper();
            var response = await ocapiRequestTemplate.performPost({auth:basicAuth, endpoint, payload, isForm:true, contentType:'application/x-www-form-urlencoded'});
            const responseJson = response.data;
            const dataToken = responseJson.access_token;

            if (!dataToken) {
                this.refLogger.error('---------------- ERROR getDataToken RESPONSE ----------------------');
                this.refLogger.error(responseJson);
                throw new Error('Access token not found in the response');
            }

            return dataToken;
        } catch (error) {
                this.refLogger.error('---------------- ERROR getDataToken GENERAL EXCEPTION ----------------------');
                this.refLogger.error(error.toString());
                throw error;
        }
    }
}

module.exports = OcapiDataAuthorization;
