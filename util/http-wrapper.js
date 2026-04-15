const path = require('path');
const REFLogger = require('./ref-logger');
const requestHelper = require('./request-helper');

class HttpWrapper {
    constructor() {
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    // this is private.  Should only call the convenience methods below
    async #performRequest({requestType, endpoint, auth, paramsOrPayload, isForm, contentType}) {
        try {
            return await requestHelper.sendRequest({url:endpoint, accessToken:auth, payload:paramsOrPayload, type:requestType, isForm, contentType});
        } catch (error) {
            this.refLogger.error(`HTTP [ ${requestType} ] Error`);
            this.refLogger.error(error.message);
            throw error;
        }
    }

    async performGet({endpoint, auth, param, isForm = false, contentType = null}) {
        return await this.#performRequest({requestType:'GET', endpoint, auth, paramsOrPayload:param, isForm, contentType});
    }

    async performPost({endpoint, auth, payload, isForm = false, contentType = null}) {
        return await this.#performRequest({requestType:'POST', endpoint, auth, paramsOrPayload:payload, isForm, contentType});
    }

    async performPut({endpoint, auth, payload, isForm, contentType = null}) {
        return await this.#performRequest({requestType:'PUT', endpoint, auth, paramsOrPayload:payload, isForm, contentType});
    }

    async performDelete({endpoint, auth, params}) {
        return await this.#performRequest({requestType:'DELETE', endpoint, auth, paramsOrPayload:params});
    }

    async performPatch({ endpoint, auth, payload, params, isForm, contentType = null }) {
        if (payload) {
            return await this.#performRequest({ requestType: 'PATCH', endpoint, auth, paramsOrPayload: payload, isForm, contentType });
        } else if (params) {
            return await this.#performRequest({ requestType: 'PATCH', endpoint, auth, paramsOrPayload: params, isForm, contentType });
        } else {
            return await this.#performRequest({ requestType: 'PATCH', endpoint, auth, paramsOrPayload: null, isForm, contentType });
        }

    }

    async performPatch({endpoint, auth, payload, params, isForm, contentType = null}) {
        if (payload) {
            return this.#performRequest({requestType:'PATCH', endpoint, auth, paramsOrPayload:payload, isForm, contentType});
        } else if (params) {
            return this.#performRequest({requestType:'PATCH', endpoint, auth, paramsOrPayload:params, isForm, contentType});
        } else {
            return this.#performRequest({requestType:'PATCH', endpoint, auth, paramsOrPayload:null, isForm, contentType});
        }
        
    }
}

module.exports = HttpWrapper;
