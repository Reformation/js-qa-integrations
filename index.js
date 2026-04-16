// Shared integration clients — @reformation/qa-integrations

// SFCC (unified client wrapping OCAPI and SCAPI)
module.exports.SfccClient      = require('./sfcc/sfcc-client');

// Deposco
module.exports.DeposcoApiClient      = require('./deposco/deposco-api-client');
module.exports.DeposcoApiShipment    = require('./deposco/deposco-api-shipment');
