// Shared integration clients — @reformation/qa-integrations

// SFCC (unified client wrapping OCAPI and SCAPI)
module.exports.SfccClient      = require('./sfcc/sfcc-client');

// Deposco
module.exports.DeposcoApiClient      = require('./deposco/deposco-api-client');
module.exports.DeposcoApiShipment    = require('./deposco/deposco-api-shipment');

// Legacy imports — for testing use only
module.exports.InventoryHelper             = require('./sfcc/ocapi/data-api/util/inventory-helper');
module.exports.OcapiHelper                 = require('./sfcc/ocapi/ocapi-helper');
module.exports.RefInventoryProductRecord   = require('./sfcc/ref-inventory-product-record');
