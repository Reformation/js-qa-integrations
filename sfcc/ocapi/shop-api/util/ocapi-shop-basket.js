const path = require('path');

const REFLogger = require('../../../../util/ref-logger');
const HttpRequestHelper = require('../../../../util/http-request-helper');

class OcapiShopBasket {
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
    }

    /**
     * Payload for adding a product to the basket
     * Endpoint: POST /baskets/{basket_id}/items
     */
    getBasketPayloadForProduct(productId, quantity) {
        return {
            'product_items' : [
                {
                    product_id: productId,
                    quantity: quantity
                }
            ]
        };
    }

    getAddProductToBasketPayload(productId, quantity) {
        return ([{
            product_id: productId,
            quantity: quantity
        }]);
    }


    /**
     * Payload for setting a shipping method
     * Endpoint: PUT /baskets/{basket_id}/shipments/{shipment_id}/shipping_method
     */
    getShippingMethodPayload(shippingMethodId) {
        return {
            id: shippingMethodId
        };
    }

    /**
     * Payload for adding a Payment Instrument (Credit Card)
     * Endpoint: POST /baskets/{basket_id}/payment_instruments
     */
    getPaymentInstrumentPayload(paymentData) {
        return {
            amount: paymentData.amount,
            payment_card: {
                number: paymentData.cardNumber,
                security_code: paymentData.cvv,
                holder: paymentData.holderName,
                card_type: paymentData.cardType,
                expiration_month: paymentData.expMonth,
                expiration_year: paymentData.expYear
            },
            payment_method_id: 'CREDIT_CARD'
        };
    }

    /**
     * Payload for updating shipping address
     * Endpoint: PUT /baskets/{basket_id}/shipments/{shipment_id}/shipping_address
     */
    getShippingAddressPayload(addressObj) {
        return {
            first_name: addressObj.firstName,
            last_name: addressObj.lastName,
            address1: addressObj.address1,
            address2: addressObj.address2 || '',
            city: addressObj.city,
            postal_code: addressObj.postalCode,
            state_code: addressObj.stateCode,
            country_code: addressObj.countryCode,
            phone: addressObj.phone
        };
    }

    /**
     * Payload for adding a message/note to the basket
     * Useful for gift messages or order notes
     */
    getBasketNotesPayload(noteText) {
        return {
            text: noteText
        };
    }
}

module.exports = OcapiShopBasket;