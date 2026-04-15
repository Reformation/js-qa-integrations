const path = require('path');

const REFLogger = require('../../util/ref-logger');
const HttpRequestHelper = require('../../util/http-request-helper');

class DeposcoAuthorization {
    constructor(deposcoEnv) {
        this.deposcoEnv = deposcoEnv;
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    getBasicAuth(user, pass) {
        if (!user || !pass) {
            throw new Error('Username or password is missing');
        }

        let key = user + ":" + pass;
        return Buffer.from(key).toString('base64');
    }
    
    async getDataToken(username, password, endpoint, params = null, contentType = 'application/json') {

        this.refLogger.info('---------------- getAuthToken ----------------------');
        const basicAuth = this.getBasicAuth(username, password);
        
        try {
            const deposcoRequestTemplate = new HttpRequestHelper();
            var response = await deposcoRequestTemplate.performLookup({auth: basicAuth, endpoint, params});

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

module.exports = DeposcoAuthorization;