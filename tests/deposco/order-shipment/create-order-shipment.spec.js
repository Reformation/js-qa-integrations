const { test, expect } = require('@playwright/test');
const path = require('path');

const OrderShipmentProcessor = require('../../../deposco/orders-shipment/create-order-shipment');
const REFLogger = require('../../../util/ref-logger.js');

test.describe('Single Order Shipment Processing', () => {
    let logger;
    let orderShipmentProcessor;
    
    test.beforeEach(async () => {
        logger = new REFLogger('Running order-shipment-processor-test');
        orderShipmentProcessor = new OrderShipmentProcessor(process.env.ENV_HOST);

    });
    
    test('should process successful order shipment', async () => {
        const result = await orderShipmentProcessor.createSalesOrderShipment('SD00090237');
        expect(result.status).toBe('success'); // This should be 'success' for valid orders not yet shipped 
        expect(result.orderNumber).toBe('SD00090237');
    });


    test('should construct shipment payload correctly', async () => {
        const mockOrderData = {
            number: 'SS00256061',
            itemNumber: 'ITEM123',
            quantity: '5',
            shipVia: 'UPS',
            facility: 'VRN',
            lineNumber: '1'
        };

        const payload = orderShipmentProcessor.constructShipmentPayload(mockOrderData);
        
        expect(payload).toHaveProperty('orderNumber', 'SS00256061');
        expect(payload).toHaveProperty('itemNumber', 'ITEM123');
        expect(payload).toHaveProperty('quantity', 5);
        expect(payload).toHaveProperty('shipVia', 'UPS');
        expect(payload).toHaveProperty('facility', 'VRN');
        expect(payload).toHaveProperty('pickLocation', '26-25-03-02');
        expect(payload).toHaveProperty('lineNumber', '1');
        expect(payload).toHaveProperty('timestamp');
        expect(typeof payload.quantity).toBe('number');
    });

    test('should get correct pick location for facility', async () => {
        expect(orderShipmentProcessor.getPickLocationForFacility('VRN')).toBe('26-25-03-02');
        expect(orderShipmentProcessor.getPickLocationForFacility('BRD')).toBe('01-01-01-02');
        expect(orderShipmentProcessor.getPickLocationForFacility('CVH')).toBe('GENERAL');
        expect(orderShipmentProcessor.getPickLocationForFacility('UNKNOWN')).toBe('GENERAL');
    });

    test('should validate order data for shipment', async () => {
        const invalidOrderData = {
            number: '',
            itemNumber: 'ITEM123',
            quantity: 'invalid',
            shipVia: 'UPS',
            facility: 'INVALID'
        };

        expect(() => orderShipmentProcessor.validateOrderDataForShipment(invalidOrderData))
            .toThrow('Order validation failed');
    });

    test('should build create shipment response correctly', async () => {
        const mockShipmentResponse = {
            success: true,
            status: 200,
            trackingNumber: 'TRK123456',
            shipmentId: 'SHP789',
            description: 'Shipment created successfully',
            response: { data: 'mock' }
        };

        const result = orderShipmentProcessor.createShipmentResponse(mockShipmentResponse, 'SS00256061');
        
        expect(result.status).toBe('success');
        expect(result.orderNumber).toBe('SS00256061');
        expect(result.trackingNumber).toBe('TRK123456');
        expect(result.shipmentId).toBe('SHP789');
        expect(result.description).toBe('Shipment created successfully');
    });

    test('should build error response correctly', async () => {
        const mockError = new Error('Test error');
        mockError.response = { status: 400 };

        const result = orderShipmentProcessor.createShipmentErrorResponse('SS00256061', mockError);
        
        expect(result.status).toBe('failed');
        expect(result.orderNumber).toBe('SS00256061');
        expect(result.error).toBe('Test error');
        expect(result.statusCode).toBe(400);
        expect(result.trackingNumber).toBe(null);
        expect(result.shipmentId).toBe(null);
        expect(result).toHaveProperty('timestamp');
    });
});
