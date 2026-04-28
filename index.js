// Shared integration clients — @reformation/qa-integrations

// SFCC (unified client wrapping OCAPI and SCAPI)
module.exports.SfccClient      = require('./sfcc/sfcc-client');
module.exports.SfccEnv = require('./sfcc/sfcc-env');

// Deposco
module.exports.DeposcoApiClient      = require('./deposco/deposco-api-client');
module.exports.DeposcoApiShipment    = require('./deposco/deposco-api-shipment');

// Utilities
module.exports.REFLogger         = require('./util/ref-logger');
module.exports.REFDateTimeHelper = require('./util/date-time-helper');
module.exports.REFShippingHelper = require('./util/shipping-helper');
module.exports.Timer             = require('./util/timer');
module.exports.SkuParser         = require('./util/sku-parser');

// Slack
module.exports.XmlReportParser = require('./slack/xml/xml-report-parser');
module.exports.SlackReport     = require('./slack/slack-report');

// Legacy imports — for testing use only
module.exports.InventoryHelper             = require('./sfcc/ocapi/data-api/util/inventory-helper');
module.exports.OcapiHelper                 = require('./sfcc/ocapi/ocapi-helper');
module.exports.RefInventoryProductRecord   = require('./sfcc/ref-inventory-product-record');
