const path = require('path');

const REFLogger = require('../util/ref-logger');
const HttpRequestHelper = require('../util/http-request-helper');
const DeposcoEnvironment = require('./util/deposco-env');
const DeposcoAuthorization = require('./util/deposco-auth');
const XmlResponseParser = require('./util/xml-response-parser');

class DeposcoApiShipment {
    constructor(env_str = process.env.ENV_HOST) {
        this.env_str = env_str;
        this.apiVersion = process.env.DEPOSCO_API_VERSION || 'v2';

        this.deposcoEnv = new DeposcoEnvironment();
        this.deposcoEnv.setDeposcoEnvVars(env_str);
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        this.xmlParser = new XmlResponseParser();

        this.deposcoAuth = new DeposcoAuthorization(this.deposcoEnv);

        this.httpRequestHelper = new HttpRequestHelper();

        // Cache for basic auth token to avoid regenerating
        this._basicAuthToken = null;

        this.refLogger.debug(`DeposcoApiShipment initialized for environment ${env_str}`);
    }
    getBasicAuthToken() {
        if (!this._basicAuthToken) {
            this._basicAuthToken = this.deposcoAuth.getBasicAuth(
                this.deposcoEnv.username, 
                this.deposcoEnv.password
            );
        }
        return this._basicAuthToken;
    }

    clearAuthToken() {
        this._basicAuthToken = null;
    }

    async createShipment(orderNumber, itemNumber, quantity = '1', shipVia = 'Standard', facility = 'VRN', pickLocation = '26-25-03-02', trackingNumber = null) {
        try {
            const finalTrackingNumber = trackingNumber || this.generateRandomTrackingNumber();

            this.refLogger.info(`Attempting to ship order [${orderNumber}] with SKU [${itemNumber}] from facility [${facility}]`);

            const basicAuthToken = this.getBasicAuthToken();

            const now = new Date();
            const actualShipDate = now.toISOString().slice(0, 19);

            const shipmentData = {
                "shipment": [
                    {
                        "facility": facility,
                        "shipVia": shipVia,
                        "shipmentStatus": "Shipped",
                        "actualShipDate": actualShipDate,
                        "orders": {
                            "order": {
                                "orderNumber": orderNumber,
                                "orderType": "Sales Order",
                                "lines": {
                                    "line": [
                                        {
                                            "itemNumber": itemNumber,
                                            "shippedPackQuantity": quantity,
                                            "pack": {
                                                "type": "Each",
                                                "quantity": quantity
                                            },
                                            "container": {
                                                "number": `${orderNumber}-${facility}-1`,
                                                "lpn": `${orderNumber}-${facility}-1`,
                                                "trackingNumber": finalTrackingNumber,
                                                "dimension": {
                                                    "length": "6",
                                                    "width": "6",
                                                    "height": "4",
                                                    "units": "Inch"
                                                },
                                                "weight": {
                                                    "weight": "2",
                                                    "units": "Pound"
                                                }
                                            },
                                            "pickDetails": {
                                                "pickDetail": [
                                                    {
                                                        "pickLocation": pickLocation,
                                                        "pickQuantity": quantity,
                                                        "packPicked": {
                                                            "type": "Each",
                                                            "quantity": quantity
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            };

            const endpoint = `${this.deposcoEnv.deposcoHost}/integration/REF/shipments/REF?createAndCloseShipmentWithPickDetails=true`;

            this.refLogger.info(`Sending PUT request to endpoint: ${endpoint}`);
            this.refLogger.debug(`Shipment Payload: ${JSON.stringify(shipmentData, null, 2)}`);

            const response = await this.httpRequestHelper.performPut({
                endpoint, 
                auth: basicAuthToken, 
                payload: shipmentData, 
                isForm: true
            });

            this.refLogger.debug(`Raw response received: ${JSON.stringify(response, null, 2)}`);

            const parsedResponse = await this.parseApiResponse(response);
            
            this.refLogger.debug(`Parsed response: ${JSON.stringify(parsedResponse, null, 2)}`);

            if (!parsedResponse.success) {
                this.refLogger.error(`Shipment failed for order ${orderNumber}: ${parsedResponse.error}`);
                return {
                    success: false,
                    status: response.statusCode || response.status,
                    statusText: response.statusText,
                    error: parsedResponse.error,
                    orderNumber,
                    trackingNumber: finalTrackingNumber,
                    rawResponse: response.data
                };
            }

            const shipmentId = parsedResponse.shipmentId || parsedResponse.entity;
            const description = parsedResponse.description;
            
            this.refLogger.info(`Successfully created shipment for order ${orderNumber} with tracking ${finalTrackingNumber}${shipmentId ? ` (Shipment ID: ${shipmentId})` : ''}`);
            
            return {
                success: true,
                status: response.statusCode || response.status || 201,
                orderNumber,
                trackingNumber: finalTrackingNumber,
                shipmentId: shipmentId,
                description: description,
                response: parsedResponse,
                rawResponse: response.data
            };

        } catch (error) {
            const errorMessage = this.extractErrorMessageFromError(error);
            this.refLogger.error(`Error creating shipment for order ${orderNumber}: ${errorMessage}`);
            
            return {
                success: false,
                status: this.getStatusCodeFromError(error),
                error: errorMessage,
                orderNumber,
                trackingNumber: trackingNumber || this.generateRandomTrackingNumber()
            };
        }
    }

    async parseApiResponse(response) {
        try {
            if (!response || !response.data) {
                throw new Error('No response data received');
            }

            let responseData = response.data;
            
            if (typeof responseData === 'string') {
                const parsedResponse = await this.xmlParser.parseResponse(responseData);
                
                const validation = this.xmlParser.validateResponse(parsedResponse);
                if (!validation.isValid) {
                    this.refLogger.warn(`Response validation warnings: ${validation.warnings.join(', ')}`);
                    this.refLogger.error(`Response validation errors: ${validation.errors.join(', ')}`);
                }
                
                return parsedResponse;
            }
            
            if (typeof responseData === 'object') {

                if (response.statusCode === 207 && responseData.response) {
                    const status = responseData.response.status;
                    const isSuccess = this.xmlParser.isSuccessStatus(status);
                    
                    return {
                        success: isSuccess,
                        status: status,
                        entity: responseData.response.entity,
                        description: responseData.response.description,
                        message: responseData.response.message,
                        shipmentId: responseData.response.entity,
                        error: isSuccess ? null : (responseData.response.description || responseData.response.message || 'Unknown error'),
                        format: 'json',
                        rawData: responseData
                    };
                }
                
                return {
                    success: true,
                    data: responseData,
                    format: 'json',
                    rawData: responseData
                };
            }
            
            throw new Error('Unsupported response format');
            
        } catch (error) {
            this.refLogger.error(`Error parsing API response: ${error.message}`);
            return {
                success: false,
                error: `Response parsing failed: ${error.message}`,
                rawData: response.data
            };
        }
    }

    handleHttpError(error, context, identifier = null) {
        if (error?.message?.includes('404')) {
            const msg = identifier 
                ? `${context}: ${identifier} not found (404)`
                : `${context}: Resource not found (404)`;
            throw new Error(msg);
        } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
            throw new Error(`${context}: Authentication/Authorization failed`);
        } else if (error?.message?.includes('500')) {
            throw new Error(`${context}: Internal server error`);
        } else if (error?.message?.includes('521')) {
            throw new Error(`${context}: Test server may need to be started (521)`);
        }
        throw error;
    }

    generateRandomTrackingNumber() {
        const trackingNumber = Math.floor(Math.random() * 900000000000) + 100000000000;
        return trackingNumber.toString();
    }

    extractErrorMessageFromError(error) {
        if (error.response) {
            return this.extractErrorMessage(error.response);
        }
        return error.message || 'Unknown error occurred';
    }

    getStatusCodeFromError(error) {
        if (error.response) {
            return error.response.status;
        }
        if (error.message?.includes('404')) return 404;
        if (error.message?.includes('401') || error.message?.includes('403')) return 401;
        if (error.message?.includes('500')) return 500;
        if (error.message?.includes('521')) return 521;
        return 400; // Default to bad request
    }

    /**
     * Cleanup method to properly dispose of resources
     * Call this when the instance is no longer needed
     */
    dispose() {
        // Clear cached auth token
        this._basicAuthToken = null;
        
        // If any of the dependencies have cleanup methods, call them
        if (this.httpRequestHelper && typeof this.httpRequestHelper.dispose === 'function') {
            this.httpRequestHelper.dispose();
        }
        
        if (this.xmlParser && typeof this.xmlParser.dispose === 'function') {
            this.xmlParser.dispose();
        }
        
        if (this.refLogger && typeof this.refLogger.dispose === 'function') {
            this.refLogger.dispose();
        }
        
        this.refLogger.debug('DeposcoApiShipment instance disposed');
    }
}

module.exports = DeposcoApiShipment;