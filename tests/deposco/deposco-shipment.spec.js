import 'dotenv/config';

const { test, expect } = require('@playwright/test');
const path = require('path');
const process = require('process');

const REFLogger = require('../../util/ref-logger.js');
const DeposcoApiShipment = require('../../deposco/deposco-api-shipment');

test.describe('Test Deposco Order Sales Shipment', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);
    let deposcoApiShipment;
    
    test.beforeEach(async () => {
        deposcoApiShipment = new DeposcoApiShipment(process.env.ENV_HOST);
        refLogger.info('DeposcoApiShipment initialized for test');
    });

    test.afterEach(async () => {
        refLogger.info('Test completed');
    });

    test('Test ship order basic successful', async () => {

        const TEST_DATA = {
            shipment: {
                orderNumber: 'SD00085836',
                itemNumber: '1313793IVO006',
                quantity: '1',
                facility: 'VRN',
                location: '26-25-03-02'
            }
        };

        refLogger.info('Initializing shipment test suite with test data');
        refLogger.info(`Test Order Number: ${TEST_DATA.shipment.orderNumber}`);
        refLogger.info(`Test SKU: ${TEST_DATA.shipment.itemNumber}`);
        refLogger.info(`Test Facility: ${TEST_DATA.shipment.facility}`);
        refLogger.info(`Test Location: ${TEST_DATA.shipment.location}`);
        refLogger.info('Test ship order started');

        try {
            const shipmentResponse = await deposcoApiShipment.createShipment(
                TEST_DATA.shipment.orderNumber,
                TEST_DATA.shipment.itemNumber
            );
            
            refLogger.info(`Shipment Response: ${JSON.stringify(shipmentResponse, null, 2)}`);
            
            expect(shipmentResponse).toBeDefined();
            expect(shipmentResponse).not.toBeNull();
            expect(typeof shipmentResponse).toBe('object');

    
            expect(shipmentResponse.statusCode).toBeDefined();
            if (shipmentResponse.statusCode !== 207) {
                refLogger.info(`Status code validation failed: Expected 207, got ${shipmentResponse.statusCode}`);
                throw new Error(`Expected status code 207, but received ${shipmentResponse.statusCode}`);
            }
            refLogger.info(`✓ Status code validation passed: ${shipmentResponse.statusCode}`);

            if (!shipmentResponse.data) {
                refLogger.info('Data validation failed: Response data is missing or undefined');
                throw new Error('Response data is missing or undefined');
            }
            refLogger.info('✓ Response data validation passed');

            if (shipmentResponse.data.response && shipmentResponse.data.response.status) {
                const responseStatus = shipmentResponse.data.response.status;
                
                if (responseStatus.includes('400') || responseStatus.includes('500')) {
                    const errorDescription = shipmentResponse.data.response.description || 'No description provided';
                    const errorMessage = shipmentResponse.data.response.errors?.message || 'No error message provided';
                    
                    refLogger.info(`Shipment operation failed with nested error status: ${responseStatus}`);
                    refLogger.info(`Error description: ${errorDescription}`);
                    refLogger.info(`Error message: ${errorMessage}`);
                    
                    throw new Error(`Shipment failed: ${responseStatus} - ${errorDescription}`);
                }
            }

            if (shipmentResponse.status === 400 || shipmentResponse.status === 500) {
                refLogger.info(`Top-level error status validation failed: Received error status ${shipmentResponse.status}`);
                throw new Error(`Received error status: ${shipmentResponse.status}`);
            }

            if (shipmentResponse.response === 400 || shipmentResponse.response === 500) {
                refLogger.info(`Top-level error response validation failed: Received error response ${shipmentResponse.response}`);
                throw new Error(`Received error response: ${shipmentResponse.response}`);
            }

            refLogger.info('✓ All shipment validations passed');

        } catch (error) {
            refLogger.error(`Test failed with error: ${error.message}`);

            throw error;
        }

        refLogger.info('Test ship order with default parameters completed successfully');
    });
});
