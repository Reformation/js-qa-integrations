const axios = require('axios');

function getDataToken(clientId, clientSecret) {
    return new Promise(async (resolve, reject) => {
        try {
            let url = 'https://account.demandware.com/dwsso/oauth2/access_token?client_id=' + clientId;

            var base64Key = generateBase64(clientId, clientSecret);
            let headers = {
                'Authorization': 'Basic ' + base64Key,
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const data = {
                grant_type: 'client_credentials'
            }

            axios.post(url, data, { headers: headers }).then(result => {
                resolve(result.data.access_token);
            }).catch(err => {
                console.log(err.message);
                throw (err);
            });

        }
        catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function getShopToken(user, pass, clientSecret, authURL) {
    return new Promise(async (resolve, reject) => {
        try {
            let url = authURL;

            var base64Key = generateBase643Params(user, pass, clientSecret);
            let headers = {
                'Authorization': 'Basic ' + base64Key,
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const data = {
                grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
            }

            axios.post(url, data, { headers: headers }).then(result => {
                resolve(result.data.access_token);
            }).catch(err => {
                console.log(err.message);
                throw (err);
            });

        }
        catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function generateBase64(user, pass) {
    let key = user + ":" + pass;
    return Buffer.from(key).toString('base64');
}

function generateBase643Params(u1, p1, p2) {
    let key = u1 + ":" + p1 + ":" + p2;
    return Buffer.from(key).toString('base64');
}

module.exports.generateBase64 = generateBase64;
module.exports.getDataToken = getDataToken;
module.exports.getShopToken = getShopToken;
