// Shared integration clients — @reformation/qa-integrations

// Utilities
module.exports.EnvVarLoader              = require('./util/env-var-loader');
module.exports.BaseIntegrationEnv        = require('./util/base-integration-env');
module.exports.HttpRequestHelper         = require('./util/http-request-helper');
module.exports.REFLogger                 = require('./util/ref-logger');
module.exports.OcapiHelper               = require('./util/ocapi-helper');
module.exports.InventoryHelper           = require('./util/inventory-helper');
module.exports.RefInventoryProductRecord = require('./util/ref-inventory-product-record');

// SFCC
module.exports.SfccEnvironment       = require('./sfcc/sfcc-env');

// SFCC OCAPI
module.exports.OcapiDataClient       = require('./sfcc/ocapi/data-api/ocapi-data-client');
module.exports.OcapiShopClient       = require('./sfcc/ocapi/shop-api/ocapi-shop-client');

// SFCC SCAPI
module.exports.ScapiGiftcardClient   = require('./sfcc/scapi/scapi-giftcard-client');
module.exports.ScapiInventoryClient  = require('./sfcc/scapi/scapi-inventory-client');

// Deposco
module.exports.DeposcoApiClient      = require('./deposco/deposco-api-client');
module.exports.DeposcoApiShipment    = require('./deposco/deposco-api-shipment');
module.exports.OrderShipmentProcessor = require('./deposco/orders-shipment/create-order-shipment');
