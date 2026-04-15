const axios = require('axios')
const path = require('path');   
const REFLogger = require('./ref-logger');

function sendRequest({url, accessToken, payload, type, isForm, contentType, suppressError}) {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);    

    return new Promise(async (resolve, reject) => {
        try {
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

            let data = null;
            if (type == 'DELETE') {
                data = await axios.delete(url, {headers: headers});
            } else if (type == 'GET' || payload == null) {
                data = await axios.get(url, {headers: headers});
            } else if (type == 'PATCH') {
                data = await axios.patch(url, JSON.stringify(payload), {headers: headers});
            } else if (type == 'PUT') {
                data = await axios.put(url, JSON.stringify(payload), {headers: headers});
            } else {

                if (isForm) {
                    data = await axios.post(url, payload, {headers: headers});
                } else {
                    data = await axios.post(url, JSON.stringify(payload), {headers: headers});
                }
            }

            // console.log(data);

            resolve({
                statusCode: data.status,
                data: data.data,
                statusText: data.statusText
            });
        }
        catch (err){
            if (suppressError) {
                resolve({
                    statusCode: err.response ? err.response.status : 500,
                    data: err.response ? err.response.data : null,
                    statusText: err.response ? err.response.statusText : 'unknown error'
                });
            } else {
                console.log(err.message);
                reject(err);
    
            }
        }
    });
}

module.exports.sendRequest = sendRequest;