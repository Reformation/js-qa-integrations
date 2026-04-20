import 'dotenv/config';

const path = require('path');
const process = require('process');

const REFLogger = require('../../util/ref-logger.js');
const DeposcoApiClient = require('../deposco-api-client');


describe('Deposco Internal Tests', () => {
    let loggerName = path.basename(__filename, path.extname(__filename));
    let refLogger = new REFLogger(loggerName);
    let deposcoApiClient;
    
    const TEST_DATA = {
        expectedOrderNumber: 'SD00078359',
        expectedOrderType: 'Sales Order',
        expectedSku: '1313801BLK0XS',
        testFacilities: ['VRN', 'CVH', 'BRD'],
        singleFacility: 'VRN',
        adjustment: {
            itemNumber: '1300744BLK008',
            locationNumber: 'VRN--22-08-04-08',
            quantity: 1,
            adjustmentDelta: 'add',
            packType: 'Each',
            reasonCode: 'CA'
        },
        // Test data for default parameters
        defaultAdjustment: {
            itemNumber: '1300744BLK008',
            locationNumber: 'GENERAL',
            quantity: 1
        }
    };

    // Setup before all tests
    beforeAll(async () => {
        refLogger.info('Initializing test suite with test data');
        refLogger.info(`Test Order Number: ${TEST_DATA.expectedOrderNumber}`);
        refLogger.info(`Test SKU: ${TEST_DATA.expectedSku}`);
        refLogger.info(`Test Facilities: ${TEST_DATA.testFacilities.join(', ')}`);
        refLogger.info(`Test Adjustment Item: ${TEST_DATA.adjustment.itemNumber}`);
        refLogger.info(`Default Adjustment Location: ${TEST_DATA.defaultAdjustment.locationNumber}`);
    });

    // Setup before each test
    beforeEach(async () => {
        deposcoApiClient = new DeposcoApiClient(process.env.ENV_HOST);
        refLogger.info('DeposcoApiClient initialized for test');
    });

    // Optional: Cleanup after each test
    afterEach(async () => {
        // Add any cleanup logic here if needed
        refLogger.info('Test completed');
    });

    test('Test get order status', async () => {
        refLogger.info('Test get order status');

        try {
            const orderStatus = await deposcoApiClient.getOrderStatus(TEST_DATA.expectedOrderNumber);
            
            refLogger.info(`Order Response: ${JSON.stringify(orderStatus, null, 2)}`);
            
            expect(orderStatus).toBeDefined();
            expect(orderStatus).not.toBeNull();

            // Validate order number
            const orderNumber = orderStatus.number || orderStatus.orderNumber;
            if (orderNumber) {
                expect(orderNumber).toBe(TEST_DATA.expectedOrderNumber);
                refLogger.info(`✓ Order number validation passed: ${orderNumber}`);
            }

            // Validate order type
            const orderType = orderStatus.type || orderStatus.orderType;
            if (orderType) {
                expect(orderType).toBe(TEST_DATA.expectedOrderType);
                refLogger.info(`✓ Order type validation passed: ${orderType}`);
            }

            refLogger.info('✓ All order status validations passed');

        } catch (error) {
            refLogger.error(`Test failed with error: ${error.message}`);
            throw error;
        }

        refLogger.info('Test get order status completed successfully');
    });

    test('Test get Inventory SKU Item with default facilities', async () => {
        refLogger.info('Test get Inventory SKU status with default facilities');

        try {
            const inventoryStatus = await deposcoApiClient.getAvailabilitySku(TEST_DATA.expectedSku);
            
            refLogger.info(`Get Inventory SKU Response (default facilities): ${JSON.stringify(inventoryStatus, null, 2)}`);
            
            expect(inventoryStatus).toBeDefined();
            expect(inventoryStatus).not.toBeNull();
            expect(typeof inventoryStatus).toBe('object');

            // Validate response has content
            const responseKeys = Object.keys(inventoryStatus);
            expect(responseKeys.length).toBeGreaterThan(0);

            // Validate array response structure
            if (Array.isArray(inventoryStatus)) {
                inventoryStatus.forEach(inventoryItem => {
                    // Validate SKU match
                    const skuValue = inventoryItem.sku || inventoryItem.itemNumber;
                    if (skuValue) {
                        expect(skuValue).toBe(TEST_DATA.expectedSku);
                        refLogger.info(`✓ SKU validation passed: ${skuValue}`);
                    }

                    // Validate facility
                    const facilityValue = inventoryItem.facility || inventoryItem.facilityNumber;
                    if (facilityValue) {
                        expect(TEST_DATA.testFacilities).toContain(facilityValue);
                        refLogger.info(`✓ Facility validation passed: ${facilityValue}`);
                    }

                    // Validate quantity fields
                    ['quantity', 'totalOnHandQty', 'available', 'totalAtp'].forEach(field => {
                        if (inventoryItem[field] !== undefined) {
                            expect(typeof inventoryItem[field]).toBe('number');
                            expect(inventoryItem[field]).toBeGreaterThanOrEqual(0);
                            refLogger.info(`✓ ${field} validation passed: ${inventoryItem[field]}`);
                        }
                    });
                });
            }

            refLogger.info('✓ All inventory SKU validations passed');

        } catch (error) {
            refLogger.error(`Test failed with error: ${error.message}`);
            throw error;
        }

        refLogger.info('Test get Inventory SKU Item with default facilities completed successfully');
    });

    test('Test adjustment inventory for SKU', async () => {
        refLogger.info('Test adjust inventory for SKU');

        try {
            const { itemNumber, locationNumber, quantity, adjustmentDelta, packType, reasonCode } = TEST_DATA.adjustment;
            
            const adjustmentResponse = await deposcoApiClient.adjustInventorySku(
                itemNumber, 
                locationNumber, 
                quantity, 
                adjustmentDelta, 
                packType, 
                reasonCode
            );
            
            refLogger.info(`Adjustment Response: ${JSON.stringify(adjustmentResponse, null, 2)}`);
            
            expect(adjustmentResponse).toBeDefined();
            expect(adjustmentResponse).not.toBeNull();

            expect(adjustmentResponse.statusCode).toBe(200);
            expect(adjustmentResponse.data.status).toBe('SUCCESS');
            
            const requestObj = adjustmentResponse.data.requestObj[0];
            expect(requestObj.itemNumber).toBe(TEST_DATA.adjustment.itemNumber);
            expect(requestObj.locationNumber).toBe(TEST_DATA.adjustment.locationNumber);
            expect(requestObj.quantity).toBe(TEST_DATA.adjustment.quantity.toString());
            expect(requestObj.adjustmentDelta).toBe(TEST_DATA.adjustment.adjustmentDelta);
            expect(requestObj.packType).toBe(TEST_DATA.adjustment.packType);
            expect(requestObj.reasonCode).toBe(TEST_DATA.adjustment.reasonCode);
            
            const responseMsg = adjustmentResponse.data.responseMsg[0];
            expect(responseMsg).toContain(TEST_DATA.adjustment.itemNumber);
            expect(responseMsg).toContain(TEST_DATA.adjustment.quantity.toString());

            refLogger.info('✓ All inventory adjustment validations passed');

        } catch (error) {
            refLogger.error(`Test failed with error: ${error.message}`);
            throw error;
        }

        refLogger.info('Test adjustment inventory for SKU completed successfully');
    });

});
