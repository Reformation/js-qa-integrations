const ScapiGiftcardClient = require('../../scapi/scapi-giftcard-client');

class GiftcardsService {
    constructor({ envStr, providerResolver }) {
        this.envStr = envStr;
        this.providerResolver = providerResolver;
        this._scapiGiftcardClient = null;
    }

    // Lazily instantiated so the constructor never throws in envless contexts
    // (e.g. unit tests that validate logic before any network call is made).
    get scapiGiftcardClient() {
        if (!this._scapiGiftcardClient) {
            this._scapiGiftcardClient = new ScapiGiftcardClient(this.envStr);
        }
        return this._scapiGiftcardClient;
    }

    #getProvider(capability) {
        return this.providerResolver(capability) || 'ocapi';
    }

    async createTestGiftcard(amount, recipientEmail, recipientName, orderNumber, sharedCreateEgcSitePrefToken) {
        const provider = this.#getProvider('giftcards');
        if (provider === 'scapi') {
            return await this.scapiGiftcardClient.createTestGiftcard(
                amount,
                recipientEmail,
                recipientName,
                orderNumber,
                sharedCreateEgcSitePrefToken
            );
        }

        throw new Error(`Unsupported giftcards provider [ ${provider} ].`);
    }
}

module.exports = GiftcardsService;
