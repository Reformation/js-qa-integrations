const path = require('path');
const REFLogger = require('./ref-logger');

class REFShippingHelper {
    constructor() {
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    getShipmentMapByShippingAttribute(shippingAttributeName, expectedShipmentAttributeValue, shipmentJson) {
        const loggerName = path.basename(__filename, path.extname(__filename));
        const refLogger = new REFLogger(loggerName);

        const shipmentMap = {};

        for (const shipment of shipmentJson) {
            refLogger.debug(`look up by attribute [ ${shippingAttributeName} ] ... `);
            const shipmentAttributeValue = shipment[shippingAttributeName];

            refLogger.debug(`shipment_type_list -> ${shipmentAttributeValue}`);
            refLogger.debug(`shipment_type -> ${expectedShipmentAttributeValue}`);

            if (shipmentAttributeValue === expectedShipmentAttributeValue) {
                if (!shipmentMap[shipmentAttributeValue]) {
                    shipmentMap[shipmentAttributeValue] = [];
                }

                refLogger.info(`SHIPMENT FOUND for ${shipmentAttributeValue} ...`);
                shipmentMap[expectedShipmentAttributeValue].push(shipment);
            } else {
                refLogger.debug(`Shipment type [ ${shipmentAttributeValue} ] is NOT being added to the Map ...`);
            }
        }

        refLogger.debug(`------ returned shipment -- shipment_attribute_value == ${expectedShipmentAttributeValue} -------`);
        refLogger.debug(shipmentMap);
        refLogger.debug('---------- After map returned ----------');
        const shipmentList = shipmentMap[expectedShipmentAttributeValue] || [];
        refLogger.debug('---------- After list returned ----------');
        refLogger.debug(shipmentList);
        return shipmentList;
    }
}

module.exports = REFShippingHelper;
