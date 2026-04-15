const path = require('path');
const REFLogger = require('../util/ref-logger');
const DeposcoEnvironment = require('./util/deposco-env');
const DeposcoAuthorization = require('./util//deposco-auth');
const HttpRequestHelper = require('../util/http-request-helper');

class DeposcoApiClient {
    constructor(env_str = process.env.ENV_HOST) {
        this.env_str = env_str;
        this.apiVersion = process.env.DEPOSCO_API_VERSION || 'v2';

        this.deposcoEnv = new DeposcoEnvironment();
        this.deposcoEnv.setDeposcoEnvVars(env_str);

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);

        this.refLogger.debug(`DeposcoApiClient initialized for environment ${env_str}`);
    }

    validateRequired(params, requiredFields) {
        const missing = requiredFields.filter(field => !params[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required parameters: ${missing.join(', ')}`);
        }
    }

    validateOrderNumber(orderNumber) {
        if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim() === '') {
            throw new Error('Order number must be a non-empty string');
        }
    }

    validateItemNumber(itemNumber) {
        if (!itemNumber || typeof itemNumber !== 'string' || itemNumber.trim() === '') {
            throw new Error('Item number must be a non-empty string');
        }
    }

    validateQuantity(quantity) {
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) {
            throw new Error('Quantity must be a non-negative number');
        }
        return numQuantity;
    }

    handleApiError(error, operation, identifier = null, logContext = null) {
    
        const logMessage = identifier 
            ? `Failed ${operation} for ${identifier}: ${error.message}`
            : `Failed ${operation}: ${error.message}`;
        
        if (logContext) {
            this.refLogger.error(`${logContext} - ${logMessage}`);
        } else {
            this.refLogger.error(logMessage);
        }

        // Determine status code based on error message
        let statusCode = 500; // Default to internal server error
        let userMessage = error.message;

        if (error?.message?.includes('404')) {
            statusCode = 404;
            userMessage = identifier 
                ? `${operation}: ${identifier} not found (404)`
                : `${operation}: Resource not found (404)`;
        } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
            statusCode = 401;
            userMessage = `${operation}: Authentication/Authorization failed`;
        } else if (error?.message?.includes('500')) {
            statusCode = 500;
            userMessage = `${operation}: Internal server error`;
        } else if (error?.message?.includes('521')) {
            statusCode = 521;
            userMessage = `${operation}: Test server may need to be started (521)`;
        }

        return {
            success: false,
            statusCode: statusCode,
            data: null,
            message: userMessage
        };
    }

    createSuccessResponse(data, operation, identifier = null, statusCode = 200) {
        const message = identifier 
            ? `Successfully ${operation} for ${identifier}`
            : `Successfully ${operation}`;

        return {
            success: true,
            statusCode: statusCode,
            data: data,
            message: message
        };
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
    
    async getOrderStatus(orderNumber) {
        try {
            this.validateOrderNumber(orderNumber);
            
            this.refLogger.info(`Attempting to retrieve order_number [ ${orderNumber} ]`);

            this.deposcoAuth = new DeposcoAuthorization(this.deposcoEnv);
            const basicAuthToken = this.deposcoAuth.getBasicAuth(this.deposcoEnv.username, this.deposcoEnv.password);

            const endpoint = `${this.deposcoEnv.deposcoHost}/integration/REF/orders/Sales Order/${orderNumber}`;
        
            const httpRequestHelper = new HttpRequestHelper();
            
            const result = await httpRequestHelper.performLookup({auth:basicAuthToken, endpoint, params:null, isForm:true});
            
            return this.createSuccessResponse(
                result?.data || result,
                'retrieved order status',
                orderNumber,
                result?.statusCode || 200
            );

        } catch (error) {
            return this.handleApiError(
                error,
                'order status retrieval',
                orderNumber,
                `Order Status Operation`
            );
        }
    }

    async getAvailabilitySku(itemNumber, facilityNumbers = ['VRN', 'BRD', 'CVH']) {
        try {
            this.validateItemNumber(itemNumber);
            
            if (!Array.isArray(facilityNumbers) && typeof facilityNumbers !== 'string') {
                throw new Error('Facility numbers must be an array or string');
            }

            this.refLogger.info(`Attempting to retrieve inventory for SKU item [ ${itemNumber} ] at facilities [ ${facilityNumbers} ]`);         

            this.deposcoAuth = new DeposcoAuthorization(this.deposcoEnv);
            const basicAuthToken = this.deposcoAuth.getBasicAuth(this.deposcoEnv.username, this.deposcoEnv.password);

            const facilityNumbersArray = Array.isArray(facilityNumbers) ? facilityNumbers : [facilityNumbers];
            const facilityNumbersParam = facilityNumbersArray.join(',');
    
            const measures = 'totalOnHandQty,totalAtp,committed,damaged';
            const endpoint = `${this.deposcoEnv.deposcoHost}/integration/REF/enterpriseinventory/availability?facilityNumbers=${facilityNumbersParam}&measures=${measures}&itemNumbers=${itemNumber}`;
        
            const httpRequestHelper = new HttpRequestHelper();

            const result = await httpRequestHelper.performLookup({auth:basicAuthToken, endpoint, params:null, isForm:true});
            this.refLogger.info(`Successfully retrieved SKU Item [ ${itemNumber} ] from facilities [ ${facilityNumbersParam} ]`);
            
            return this.createSuccessResponse(
                result?.data || result,
                `retrieved availability for SKU ${itemNumber} from facilities ${facilityNumbersParam}`,
                null,
                result?.statusCode || 200
            );

        } catch (error) {
            return this.handleApiError(
                error,
                'SKU availability retrieval',
                `SKU Item [ ${itemNumber} ]`,
                'SKU Availability Operation'
            );
        }
    }

    async adjustInventorySku(itemNumber, locationNumber, quantity, adjustmentDelta = 'add', packType = 'Each', reasonCode = 'CA') {
        try {
            this.validateRequired(
                { itemNumber, locationNumber }, 
                ['itemNumber', 'locationNumber']
            );
            
            const validatedQuantity = this.validateQuantity(quantity);
            
            if (!locationNumber || typeof locationNumber !== 'string' || locationNumber.trim() === '') {
                throw new Error('Location number must be a non-empty string');
            }
            
            const validAdjustmentDeltas = ['add', 'subtract', 'set'];
            if (!validAdjustmentDeltas.includes(adjustmentDelta)) {
                throw new Error(`Adjustment delta must be one of: ${validAdjustmentDeltas.join(', ')}`);
            }

            this.refLogger.info(`Attempting to adjust inventory for SKU: Item [${itemNumber}], Location [${locationNumber}], Quantity [${validatedQuantity}]`);

            this.deposcoAuth = new DeposcoAuthorization(this.deposcoEnv);
            const basicAuthToken = this.deposcoAuth.getBasicAuth(this.deposcoEnv.username, this.deposcoEnv.password);

            const adjustmentData = {adjustmentDelta, itemNumber, locationNumber, packType, quantity: validatedQuantity.toString(), reasonCode};

            const requestPayload = [adjustmentData];
        
            const endpoint = `${this.deposcoEnv.deposcoHost}/integration/REF/ctrl/postAdjustmentAPI`;

            const httpRequestHelper = new HttpRequestHelper();

            const result = await httpRequestHelper.performPost({auth: basicAuthToken, endpoint, payload: requestPayload,isForm: true});
            
            this.refLogger.info(`Successfully processed inventory adjustment for item [${itemNumber}]`);
            
            return this.createSuccessResponse(
                result?.data || result,
                `adjusted inventory for item ${itemNumber} at location ${locationNumber}`,
                null,
                result?.statusCode || 200
            );

        } catch (error) {
            return this.handleApiError(
                error,
                'inventory adjustment',
                `item [${itemNumber}]`,
                'Inventory Adjustment Operation'
            );
        }
    }
}

module.exports = DeposcoApiClient;