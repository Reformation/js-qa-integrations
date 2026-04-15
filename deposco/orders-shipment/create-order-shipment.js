const fsSync = require('fs');
const path = require('path');

const REFLogger = require('../../util/ref-logger.js');
const DeposcoApiShipment = require('../deposco-api-shipment.js');
const DeposcoApiClient = require('../deposco-api-client.js');
const CsvReader = require('../util/csv-reader.js');

class OrderShipmentProcessor {
    constructor(env = process.env.ENV_HOST) {
        this.env = env;
        this.logger = new REFLogger(path.basename(__filename, '.js'));
        this.deposcoShipment = new DeposcoApiShipment(env);
        this.deposcoClient = new DeposcoApiClient(env);
        this.csvReader = new CsvReader(env);
        this.logger.debug(`Initialized for environment ${env}`);
    }

    async createSalesOrderShipment(orderNumber) {
        try {
            this.logger.info(`Preparing shipment payload for order: ${orderNumber}`);
            
            const orderData = await this.getOrderStatusAndSetupData(orderNumber);
            const shipmentResponse = await this.performDeposcoCreateShipment(orderData);
            
            return this.createShipmentResponse(shipmentResponse, orderNumber);

        } catch (error) {
            this.logger.error(`Error processing order ${orderNumber}: ${error.message}`);
            return this.createShipmentErrorResponse(orderNumber, error);
        }
    }

    async getOrderStatusAndSetupData(orderNumber) {
        const orderResponse = await this.getOrderStatusFromDeposco(orderNumber);
        const orderData = this.extractOrderDataFromResponse(orderResponse.data);
        this.validateOrderDataForShipment(orderData);
        return orderData;
    }

    async getOrderStatusFromDeposco(orderNumber) {
        const orderStatusResponse = await this.deposcoClient.getOrderStatus(orderNumber);
        
        if (!orderStatusResponse) {
            throw new Error(`No response received for order ${orderNumber}`);
        }

        if (!orderStatusResponse.success) {
            throw new Error(`Failed to retrieve order ${orderNumber}: ${orderStatusResponse.message} (Status: ${orderStatusResponse.statusCode})`);
        }

        return orderStatusResponse;
    }

    validateOrderDataForShipment(orderData) {
        if (!orderData) {
            throw new Error(`No valid order data extracted for order ${orderData?.number || 'unknown'}`);
        }

        const errors = [];
        const requiredFields = {
            'number': 'Order number',
            'itemNumber': 'Item number', 
            'quantity': 'Quantity',
            'shipVia': 'Ship via method',
            'facility': 'Facility code'
        };

        Object.entries(requiredFields).forEach(([field, description]) => {
            if (!orderData[field] || (typeof orderData[field] === 'string' && orderData[field].trim() === '')) {
                errors.push(`Missing ${description}`);
            }
        });

        if (orderData.quantity && isNaN(Number(orderData.quantity))) {
            errors.push('Quantity must be numeric');
        }

        const supportedFacilities = ['VRN', 'BRD', 'CVH'];
        if (orderData.facility && !supportedFacilities.includes(orderData.facility)) {
            errors.push(`Unsupported facility: ${orderData.facility}. Supported: ${supportedFacilities.join(', ')}`);
        }

        if (errors.length > 0) {
            throw new Error(`Order validation failed for ${orderData.number}: ${errors.join(', ')}`);
        }

        this.logger.info(`✓ Order validation passed - Facility: ${orderData.facility}, Item: ${orderData.itemNumber}, Qty: ${orderData.quantity}`);
    }

    constructShipmentPayload(orderData) {
        const pickLocation = this.getPickLocationForFacility(orderData.facility);
        
        return {
            orderNumber: orderData.number,
            itemNumber: orderData.itemNumber,
            quantity: parseInt(orderData.quantity, 10),
            shipVia: orderData.shipVia,
            facility: orderData.facility,
            pickLocation: pickLocation,
            lineNumber: orderData.lineNumber,
            trackingNumber: this.generateTrackingNumber(),
            timestamp: new Date().toISOString()
        };
    }

    async performDeposcoCreateShipment(orderData) {
        const shipmentPayload = this.constructShipmentPayload(orderData);
        
        this.logger.debug(`Shipment payload constructed: ${JSON.stringify(shipmentPayload)}`);
        
        return await this.deposcoShipment.createShipment(
            shipmentPayload.orderNumber,
            shipmentPayload.itemNumber,
            shipmentPayload.quantity,
            shipmentPayload.shipVia,
            shipmentPayload.facility,
            shipmentPayload.pickLocation
        );
    }

    getErrorStatusCode(error) {
        if (error.response?.status) {
            return error.response.status;
        }
        if (error.message?.includes('404')) return 404;
        if (error.message?.includes('401')) return 401;
        if (error.message?.includes('403')) return 403;
        if (error.message?.includes('500')) return 500;
        return 400;
    }

    generateTrackingNumber() {
        return Math.floor(Math.random() * 900000000000) + 100000000000;
    }

    async processSalesOrdersShipment(inputFile) {
        this.logger.info(`Starting shipment processing from input file: ${inputFile}`);

        try {
            const orderNumbers = await this.extractOrderNumbersFromFile(inputFile);
            
            if (!orderNumbers || orderNumbers.length === 0) {
                this.logger.info('No orders found for shipment processing');
                return [];
            }

            return await this.processMultipleOrdersForShipment(orderNumbers);

        } catch (error) {
            this.logger.error(`Error in processSalesOrdersShipment: ${error.message}`);
            throw error;
        }
    }

    async processMultipleOrdersForShipment(orderNumbers) {
        const shipmentResults = [];
        
        for (const orderNumber of orderNumbers) {
            try {
                const shipmentResponse = await this.createSalesOrderShipment(orderNumber);
                shipmentResults.push({
                    orderNumber,
                    status: 'success',
                    response: shipmentResponse
                });
            } catch (error) {
                this.logger.error(`Failed to ship order ${orderNumber}: ${error.message}`);
                shipmentResults.push({
                    orderNumber,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return shipmentResults;
    }

    extractOrderDataFromResponse(responseData) {
        try {
            if (!responseData) {
                throw new Error('No response data provided');
            }

            const order = this.normalizeOrderResponse(responseData);
            this.validateOrderStructure(order);
            
            const orderLines = this.extractOrderLines(order);
            const firstLine = orderLines[0];
            const packQuantity = firstLine.pack?.quantity || '1';

            return {
                facility: order.facility,
                number: order.number,
                status: order.status,
                shipVia: order.shipVia,
                lineNumber: firstLine.lineNumber,
                itemNumber: firstLine.itemNumber,
                quantity: packQuantity
            };

        } catch (error) {
            this.logger.error(`Failed to extract order data: ${error.message}`);
            throw error;
        }
    }

    normalizeOrderResponse(responseData) {
        const order = responseData.order ? 
            (Array.isArray(responseData.order) ? responseData.order[0] : responseData.order) : 
            responseData;

        if (!order) {
            throw new Error('No order data found in response');
        }

        return order;
    }

    validateOrderStructure(order) {
        const requiredFields = ['facility', 'number', 'status', 'shipVia', 'orderLines'];
        const missingFields = requiredFields.filter(field => !order[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required order fields: ${missingFields.join(', ')}`);
        }
    }

    extractOrderLines(order) {
        const orderLines = order.orderLines?.orderLine;
        
        if (!Array.isArray(orderLines) || orderLines.length === 0) {
            throw new Error('No valid order lines found');
        }

        return orderLines;
    }

    getPickLocationForFacility(facility) {
        const pickLocations = {
            'VRN': '26-25-03-02',
            'BRD': '01-01-01-02',
            'CVH': 'GENERAL'
        };
        return pickLocations[facility] || 'GENERAL';
    }
    
    async extractOrderNumbersFromFile(inputFile) {
        try {
            let fullFilePath = null;
            
            if (path.isAbsolute(inputFile)) {
                fullFilePath = inputFile;
            } 
            else {
                try {
                    fullFilePath = this.csvReader.returnPathFile(inputFile);
                } catch (error) {
                    this.logger.warn(`CSV helper path resolution failed: ${error.message}`);
                }
            }
            
            if (!fullFilePath || !fsSync.existsSync(fullFilePath)) {
                const alternativePaths = [
                    path.resolve(inputFile),
                    path.resolve(path.basename(inputFile)),
                    path.resolve('output-data', path.basename(inputFile)),
                    path.resolve('data', path.basename(inputFile)),
                    path.resolve('csv', path.basename(inputFile))
                ];
                
                for (const altPath of alternativePaths) {
                    if (fsSync.existsSync(altPath)) {
                        fullFilePath = altPath;
                        this.logger.info(`Found file using alternative path: ${fullFilePath}`);
                        break;
                    }
                }
            }
            
            if (!fullFilePath || !fsSync.existsSync(fullFilePath)) {
                const searchedPaths = [
                    inputFile,
                    path.resolve(inputFile),
                    path.resolve(path.basename(inputFile))
                ];
                
                try {
                    searchedPaths.push(this.csvReader.returnPathFile(inputFile));
                } catch (e) {
                }
                
                throw new Error(`Input file not found. Searched in:\n${searchedPaths.map(p => `  - ${p}`).join('\n')}`);
            }
    
            this.logger.info(`Reading CSV file from: ${fullFilePath}`);
            const csvData = await this.csvReader.readCsvFile(fullFilePath);
            const results = this.processOrderRecords(csvData);
                
            this.logProcessingResults(results);
                
            return results.validOrderNumbers;
    
        } catch (error) {
            this.logger.error(`Error processing order file: ${error.message}`);
            throw error;
        }
    }

    processOrderRecords(csvData) {
        const results = {
            validOrderNumbers: [],
            skippedCount: 0,
            validCount: 0
        };

        csvData.forEach((record, index) => {
            if (!this.isValidRecord(record)) {
                this.logger.warn(`Skipping invalid record at row ${index + 1}: missing required fields`);
                results.skippedCount++;
                return;
            }

            const recordDateTime = this.parseRecordDateTime(record);
            
            if (!recordDateTime) {
                this.logger.info(`Order ${record.order_number} skipped - invalid date/time format`);
                results.skippedCount++;
                return;
            }

            results.validOrderNumbers.push(record.order_number);
            results.validCount++;
        });

        return results;
    }

    isValidRecord(record) {
        const requiredFields = ['order_number', 'created_date', 'created_time'];
        return requiredFields.every(field => 
            record[field] && 
            typeof record[field] === 'string' && 
            record[field].trim() !== ''
        );
    }

    parseRecordDateTime(record) {
        try {
            const dateStr = record.created_date.trim();
            const timeStr = record.created_time.trim();
            
            const dateTimeStr = `${dateStr}T${timeStr}Z`;
            const parsedDate = new Date(dateTimeStr);
            
            if (isNaN(parsedDate.getTime())) {
                return null;
            }
            
            return parsedDate;
        } catch (error) {
            return null;
        }
    }

    createShipmentResponse(shipmentResponse, orderNumber) {
        if (!shipmentResponse) {
            throw new Error(`No shipment response received for order ${orderNumber}`);
        }

        const baseResponse = {
            orderNumber,
            statusCode: shipmentResponse.status || shipmentResponse.statusCode,
            trackingNumber: shipmentResponse.trackingNumber
        };

        if (!shipmentResponse.success) {
            this.logger.error(`Shipment failed for order ${orderNumber}: ${shipmentResponse.error}`);
            return {
                ...baseResponse,
                status: 'failed',
                error: shipmentResponse.error || 'Unknown shipment error',
                shipmentId: null
            };
        }

        this.logger.info(`✓ Successfully shipped order ${orderNumber} with tracking ${shipmentResponse.trackingNumber}`);
        return {
            ...baseResponse,
            status: 'success',
            shipmentId: shipmentResponse.shipmentId,
            description: shipmentResponse.description,
            apiResponse: shipmentResponse.response
        };
    }

    createShipmentErrorResponse(orderNumber, error) {
        return {
            orderNumber,
            status: 'failed',
            error: error.message,
            statusCode: this.getErrorStatusCode(error),
            trackingNumber: null,
            shipmentId: null,
            timestamp: new Date().toISOString()
        };
    }

    logProcessingResults(results) {
        if (results.validOrderNumbers.length > 0) {
            this.logger.info(`Found ${results.validOrderNumbers.length} valid orders to process: [${results.validOrderNumbers.join(', ')}]`);
        } else {
            this.logger.info('No valid orders found for processing');
        }
    }
}

module.exports = OrderShipmentProcessor;