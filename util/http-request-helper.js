const path = require('path');
 
const REFLogger = require('./ref-logger');
const HttpWrapper = require('./http-wrapper');

class HttpRequestHelper {
    constructor() {
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
        this.httpWrapper = new HttpWrapper();
    }

    getIdentifierFromPath(path) {
        return path
            .split('?')[0]
            .split('#')[0]
            .split('/')
            .filter(Boolean)
            .pop();
    }


    async performLookup({auth, endpoint, params, isForm}) {
        // TODO: make this more dynamic
        // pulls the last parameter off the endpoint and assumes that it's an ID
        const identifier = this.getIdentifierFromPath(endpoint);

        try {
            const response = await this.httpWrapper.performGet({endpoint, auth, params, isForm});
            this.refLogger.debug(`GET Response: ${JSON.stringify(response)}`);

            // Check the response status code and return the user data if successful
            if (this.isSuccess(response.statusCode)){
                this.refLogger.info(`Successfully looked up object [ ${identifier} ] (return code: ${response.statusCode})`);
                this.refLogger.debug(`Response Data: ${JSON.stringify(response)}`);

                if (response.data) {
                    this.refLogger.debug(`Returned a data attribute from the response ...`);
                    this.refLogger.debug(`Response Data: ${JSON.stringify(response.data)}`);
                    return response.data;
                } else {
                    this.refLogger.debug(`No data attribute was returned on the response ... returning the full response object ...`);
                    this.refLogger.debug(`Response Data: ${JSON.stringify(response)}`);
                    return response;
                }
            } else {
                throw new Error(`Failed to lookup object [ ${identifier} ] (return code: ${response.statusCode})`);
            }
        } catch (error) {
            this.handleError(error, 'performLookup');
        }
    }

    async performPut({auth, endpoint, payload, params, isForm}) {
        try {
            const response = await this.httpWrapper.performPut({endpoint, auth, payload, params, isForm});
            this.refLogger.debug(`PUT Response: ${JSON.stringify(response)}`);

            // Check the response status code and return the user data if successful
            if (this.isSuccess(response.statusCode)){
                this.refLogger.debug(`PUT Successful - Return Code [ ${response.statusCode} ]`);
                return response;
            } else {
                this.refLogger.error(`PUT Failed - Return Code [ ${response.statusCode} ]`);
                throw new Error(`PUT Failed - Return Code [ ${response.statusCode} ]`);
            }
        } catch (error) {
            this.handleError(error, 'performPut');
        }
    }
    
    async performPatch({auth, endpoint, payload, params, isForm}) {
        try {
            const response = await this.httpWrapper.performPatch({endpoint, auth, payload, params, isForm});
            this.refLogger.debug(`PATCH Response: ${JSON.stringify(response)}`);

            // Check the response status code and return the user data if successful
            if (this.isSuccess(response.statusCode)){
                this.refLogger.debug(`PATCH Successful - Return Code [ ${response.statusCode} ]`);
                return response;
            } else {
                this.refLogger.error(`PATCH Failed - Return Code [ ${response.statusCode} ]`);
                throw new Error(`PATCH Failed - Return Code [ ${response.statusCode} ]`);
            }
        } catch (error) {
            this.handleError(error, 'performPatch');
        }
    }

    async performPost({auth, endpoint, payload, isForm, contentType}) {
        try {
            const response = await this.httpWrapper.performPost({endpoint, auth, payload, isForm, contentType});
            this.refLogger.debug(`POST Response: ${JSON.stringify(response)}`);

            // Check the response status code and return the user data if successful
            if (this.isSuccess(response.statusCode)) {
                this.refLogger.debug(`POST Successful - Return Code [ ${response.statusCode} ]`);
                return response;
            } else {
                this.refLogger.error(`POST Failed - Return Code [ ${response.statusCode} ]`);
                throw new Error(`POST Failed - Return Code [ ${response.statusCode} ]`);
            }
        } catch (error) {
            this.handleError(error, 'performPost');

        }
    }

    async performDelete({auth, endpoint, params}) {
        // TODO: make this more dynamic
        // pulls the last parameter off the endpoint and assumes that it's an ID
        const identifier = this.getIdentifierFromPath(endpoint);

        try {
            const response = await this.httpWrapper.performDelete({endpoint, auth, params});

            // Check the response status code and return the user data if successful
            if (this.isSuccess(response.statusCode)) {
                this.refLogger.info(`Successfully deleted object[ ${identifier} ] (return code: ${response.statusCode})`);
                return response;
            } else {
                this.refLogger.debug(response);
                throw new Error(`Failed to delete object [ ${identifier} ] (return code: ${response.statusCode})`);
            }
        } catch (error) {
            this.handleError(error, 'performDelete');
        }
    }

    isSuccess(statusCode) {
        return statusCode >= 200 && statusCode <= 299;
    }

    handleError(error, context, identifier = null) {
    if (error?.message.includes('521')) {
        this.refLogger.info('Status Code 521 indicates that you may need to start up your test server!');
    } else {
        const msg = identifier 
            ? `Error during ${context} for [ ${identifier} ]: ${error.message}` 
            : `Error in ${context}: ${error.message}`;
        this.refLogger.error(msg);
    }
    throw error;
}

}

module.exports = HttpRequestHelper;