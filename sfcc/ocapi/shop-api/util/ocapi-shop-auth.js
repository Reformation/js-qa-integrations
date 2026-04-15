const path = require('path');

const REFLogger = require('../../../../util/ref-logger');
const HttpRequestHelper = require('../../../../util/http-request-helper');

class OcapiShopAuthorization {
    constructor(ocapiShopEnv, options = {}) {
        this.ocapiShopEnv = ocapiShopEnv;
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        const normalizedOptions = typeof options === 'boolean' ? { reuseBearerToken: options } : options;
        this.reuseBearerToken = Boolean(normalizedOptions.reuseBearerToken);

        const expirationBufferSeconds = Number.isFinite(normalizedOptions.expirationBufferSeconds)
            ? normalizedOptions.expirationBufferSeconds
            : 20;
        this.expirationBufferMs = expirationBufferSeconds * 1000;

        this.cachedBearerToken = null;
        this.cachedBearerTokenExpiresAtMs = 0;
    }

    async getBearerToken() {
        if (!this.reuseBearerToken) {
            return await this.#getSfccBearerToken();
        }

        if (this.#isCachedBearerTokenValid()) {
            return this.cachedBearerToken;
        }

        const tokenResponse = await this.#getSfccBearerToken({ includeExpiration: true });
        this.cachedBearerToken = tokenResponse.authorizationHeader;
        this.cachedBearerTokenExpiresAtMs = tokenResponse.expiresAtMs;

        return this.cachedBearerToken;
    }

    #getSfccBase64CombinedToken() {
        const combinedKey = `${this.ocapiShopEnv.ocapiUsername}:${this.ocapiShopEnv.ocapiTokenPassword}:${this.ocapiShopEnv.clientSecret}`;
        const base64CombinedKeyString = Buffer.from(combinedKey, 'ascii').toString('base64');
        return base64CombinedKeyString;
    }

    #isCachedBearerTokenValid() {
        if (!this.cachedBearerToken || !this.cachedBearerTokenExpiresAtMs) {
            return false;
        }

        return Date.now() < (this.cachedBearerTokenExpiresAtMs - this.expirationBufferMs);
    }    

    async #getSfccBearerToken(options = {}) {
        const { includeExpiration = false } = options;
        const endpoint = `${this.ocapiShopEnv.sfccHost}/dw/oauth2/access_token?client_id=${this.ocapiShopEnv.clientId}`;

        const payload = {
            grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
        }

        try {
            const combinedBase64Token = this.#getSfccBase64CombinedToken();

            const httpRequestHelper = new HttpRequestHelper();
            var response = await httpRequestHelper.performPost({auth:combinedBase64Token, endpoint, payload, isForm:true, contentType:'application/x-www-form-urlencoded'});

            const responseJson = response.data;

            if (responseJson.access_token) {
                this.refLogger.info('Successfully retrieved the OCAPI bearer access_token ...');
                const authorizationHeader = `${responseJson.token_type} ${responseJson.access_token}`;

                if (includeExpiration) {
                    const expiresInSeconds = Number.parseInt(responseJson.expires_in, 10);
                    const safeExpiresInSeconds = Number.isFinite(expiresInSeconds) ? expiresInSeconds : 0;

                    return {
                        authorizationHeader,
                        expiresInSeconds: safeExpiresInSeconds,
                        expiresAtMs: Date.now() + (safeExpiresInSeconds * 1000)
                    };
                }

                return authorizationHeader;
            } else {
                this.refLogger.error('---------------- ERROR getSfccBearerToken RESPONSE ----------------------');
                this.refLogger.error(responseJson);
                throw new Error('Failed to retrieve OCAPI bearer token. Response does not contain access_token.');
            }
        } catch (error) {
            this.refLogger.error('Error while fetching bearer token:', error.message);
            throw new Error(`Error while fetching bearer token: ${error.message}`);
        }
    }
}

module.exports = OcapiShopAuthorization;