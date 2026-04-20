const axios = require('axios');
const path = require('path');

const REFLogger = require('./ref-logger');

async function sendRequest({url, accessToken, payload, type, isForm, contentType, suppressError, customHeaders}) {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);

    const timeoutMs = Number(process.env.HTTP_TIMEOUT_MS || 20000);
    const method = type || 'POST';

    let headers = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        if (isForm) {
            headers['Authorization'] = 'Basic ' + accessToken;
        } else {
            // TODO: check with Jon to see if he knows about token reuse
            // this seems to be happening ... seeing Bearer Bearer: abc123
            if (!accessToken.startsWith('Bearer')) {
                headers['Authorization'] = 'Bearer ' + accessToken;
            }
            else {
                headers['Authorization'] = accessToken;
            }
        }
    }

    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    if (customHeaders && typeof customHeaders === 'object') {
        headers = {
            ...headers,
            ...customHeaders
        };
    }

    try {
        let data = null;
        const requestConfig = {headers: headers, timeout: timeoutMs};

        if (method === 'DELETE') {
            data = await axios.delete(url, requestConfig);
        } else if (method === 'GET' || payload == null) {
            data = await axios.get(url, requestConfig);
        } else if (method === 'PATCH') {
            data = await axios.patch(url, JSON.stringify(payload), requestConfig);
        } else if (method === 'PUT') {
            data = await axios.put(url, JSON.stringify(payload), requestConfig);
        } else {
            if (isForm) {
                data = await axios.post(url, payload, requestConfig);
            } else {
                data = await axios.post(url, JSON.stringify(payload), requestConfig);
            }
        }

        return {
            statusCode: data.status,
            data: data.data,
            statusText: data.statusText
        };
    }
    catch (err){
        if (suppressError) {
            return {
                statusCode: err.response ? err.response.status : 500,
                data: err.response ? err.response.data : null,
                statusText: err.response ? err.response.statusText : 'unknown error'
            };
        }

        refLogger.error(err.message);
        throw err;
    }
}

module.exports.sendRequest = sendRequest;