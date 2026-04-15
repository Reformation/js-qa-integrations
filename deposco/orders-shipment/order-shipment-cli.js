const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const OrderShipmentProcessor = require('./create-order-shipment');

class OrderShipmentCLI {
    constructor() {
        this.processor = new OrderShipmentProcessor();
        this.environment = this.getEnvironment();
    }

    getEnvironment() {
        const env = process.env.ENV_HOST || process.env.NODE_ENV || 'unknown';
        return env.toLowerCase().includes('stg') ? 'stg' : 
            env.toLowerCase().includes('dev') ? 'dev' : env;
    }

    async processOrdersFromCsv(csvFilePath) {
        console.log(`🚀 Processing orders from: ${csvFilePath}`);
        console.log(`🌍 Environment: ${this.environment}`);
        console.log('='.repeat(50));
        
        const resolvedPath = await this.resolveFilePath(csvFilePath);
        const orderNumbers = await this.extractOrderNumbers(resolvedPath);
        
        console.log(`📊 Found ${orderNumbers.length} orders: ${orderNumbers.join(', ')}`);
        
        return await this.processOrders(orderNumbers);
    }

    async resolveFilePath(filePath) {
        const searchPaths = [
            filePath,
            path.resolve(filePath),
            path.resolve(path.basename(filePath)),
            path.resolve('output-data', path.basename(filePath)),
            path.resolve('data', path.basename(filePath)),
            path.resolve('csv', path.basename(filePath))
        ];

        for (const candidatePath of searchPaths) {
            if (fsSync.existsSync(candidatePath) && fsSync.statSync(candidatePath).isFile()) {
                console.log(`📁 Resolved to: ${candidatePath}`);
                return candidatePath;
            }
        }

        throw new Error(`File not found: ${filePath}`);
    }

    async extractOrderNumbers(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV must contain header and at least one data row');
        }
        
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const orderIndex = headers.indexOf('order_number');
        
        if (orderIndex === -1) {
            throw new Error('CSV missing required column: order_number');
        }
        
        return lines.slice(1)
            .map(line => this.parseCSVLine(line)[orderIndex]?.trim())
            .filter(Boolean);
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }


    handleOrderNotFoundError(orderNumber, error) {
        const is404 = error.message.includes('404') || 
                    error.message.includes('not found') ||
                    error.response?.status === 404;

        if (is404) {
            const possibleReasons = [
                `Order pending export from SFCC/OMS to ${this.environment} environment`,
                `Order "${orderNumber}" does not exist in ${this.environment} environment`,
                `Order number format invalid for ${this.environment} environment`,
                `Order created in different environment (not ${this.environment})`
            ];

            return {
                type: '404_NOT_FOUND',
                message: `Order not found in ${this.environment} environment: ${orderNumber}`,
                possibleReasons,
                suggestions: [
                    'Wait for SFCC/OMS export process to complete',
                    'Verify order exists in the correct environment',
                    'Check order number spelling and format',
                    'Confirm you are connected to the right environment'
                ]
            };
        }

        return {
            type: 'GENERAL_ERROR',
            message: error.message,
            possibleReasons: ['Network connectivity issue', 'Service temporarily unavailable', 'Authentication/authorization error'],
            suggestions: ['Retry the operation', 'Check network connectivity', 'Verify credentials and permissions']
        };
    }

    async processOrders(orderNumbers) {
        const orders = Array.isArray(orderNumbers) ? orderNumbers : [orderNumbers];
        console.log(`\n🚀 Processing ${orders.length} order(s) in ${this.environment} environment`);
        console.log('='.repeat(50));
        
        const results = [];
        
        for (const orderNumber of orders) {
            console.log(`\n📦 Processing: ${orderNumber}...`);
            
            try {
                const result = await this.processor.createSalesOrderShipment(orderNumber);
                
                if (result && result.status === 'failed') {
                    const errorInfo = this.handleOrderNotFoundError(orderNumber, { message: result.error });
                    results.push({ 
                        orderNumber, 
                        status: 'failed', 
                        error: result.error || 'Error creating shipment',
                        errorType: errorInfo.type,
                        possibleReasons: errorInfo.possibleReasons,
                        suggestions: errorInfo.suggestions,
                        trackingNumber: 'N/A',
                        shipmentId: 'N/A'
                    });
                    console.log(`❌ Failed: ${orderNumber} - ${errorInfo.message}`);
                    
                    if (errorInfo.type === '404_NOT_FOUND') {
                        console.log(`💡 Possible reasons:`);
                        errorInfo.possibleReasons.forEach((reason, i) => {
                            console.log(`   ${i + 1}. ${reason}`);
                        });
                        console.log(`🔧 Suggestions:`);
                        errorInfo.suggestions.forEach((suggestion, i) => {
                            console.log(`   ${i + 1}. ${suggestion}`);
                        });
                    }
                } else {
                    results.push({ 
                        orderNumber, 
                        status: 'success', 
                        response: result 
                    });
                    console.log(`✅ Success: ${orderNumber}`);
                }
            } catch (error) {
                const errorInfo = this.handleOrderNotFoundError(orderNumber, error);
                results.push({ 
                    orderNumber, 
                    status: 'failed', 
                    error: error.message,
                    errorType: errorInfo.type,
                    possibleReasons: errorInfo.possibleReasons,
                    suggestions: errorInfo.suggestions,
                    trackingNumber: 'N/A',
                    shipmentId: 'N/A'
                });
                console.log(`❌ Failed: ${orderNumber} - ${errorInfo.message}`);

                if (errorInfo.type === '404_NOT_FOUND') {
                    console.log(`💡 Possible reasons:`);
                    errorInfo.possibleReasons.forEach((reason, i) => {
                        console.log(`   ${i + 1}. ${reason}`);
                    });
                    console.log(`🔧 Suggestions:`);
                    errorInfo.suggestions.forEach((suggestion, i) => {
                        console.log(`   ${i + 1}. ${suggestion}`);
                    });
                }
            }
        }
        
        this.displayResults(results);
        return results;
    }

    displayResults(results) {
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const notFoundErrors = results.filter(r => r.errorType === '404_NOT_FOUND').length;
        
        console.log('\n📋 RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Successful: ${successful} | ❌ Failed: ${failed} | 📊 Total: ${results.length}`);
        
        if (notFoundErrors > 0) {
            console.log(`🔍 Orders not found (404): ${notFoundErrors}`);
            console.log(`💡 These orders may be pending export from SFCC/OMS or don't exist in ${this.environment}`);
        }
        
        if (results.length <= 10) {
            console.log('\n📝 DETAILS:');
            results.forEach((result, i) => {
                const icon = result.status === 'success' ? '✅' : '❌';
                console.log(`${i + 1}. ${icon} ${result.orderNumber}`);
                
                if (result.status === 'success' && result.response) {
                    console.log(`   📦 Shipment: ${result.response.shipmentId || 'N/A'}`);
                    console.log(`   📍 Tracking: ${result.response.trackingNumber || 'N/A'}`);
                } else {
                    console.log(`   📦 Shipment: ${result.shipmentId || 'N/A'}`);
                    console.log(`   📍 Tracking: ${result.trackingNumber || 'N/A'}`);
                    if (result.error) {
                        console.log(`   ❌ Error: ${result.error}`);
                        if (result.errorType === '404_NOT_FOUND') {
                            console.log(`   💡 Likely pending SFCC/OMS export or wrong environment`);
                        }
                    }
                }
            });
        }

    }

    async validateCsvFile(filePath) {
        const resolvedPath = await this.resolveFilePath(filePath);
        const content = await fs.readFile(resolvedPath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV must contain header and at least one data row');
        }
        
        const header = lines[0].toLowerCase();
        if (!header.includes('order_number')) {
            throw new Error('CSV missing required column: order_number');
        }
        
        console.log(`✅ CSV validated: ${lines.length - 1} orders found`);
        return true;
    }

    parseOrderNumbers(input) {
        const orders = input.split(',').map(o => o.trim()).filter(Boolean);
        if (orders.length === 0) {
            throw new Error('No valid order numbers provided');
        }
        return orders;
    }

    displayUsage() {
        console.log(`
    📦 Order Shipment Processor CLI
    ==============================

    Current Environment: ${this.environment}

    Usage:
    node ${path.basename(__filename)} [OPTIONS]

    Options:
    --csv <file>           Process orders from CSV file
    --order <numbers>      Process orders (comma-separated)
    --help                Show this help

    Examples:
    node ${path.basename(__filename)} --csv orders.csv
    node ${path.basename(__filename)} --csv /path/to/orders.csv
    node ${path.basename(__filename)} --order SD00091128
    node ${path.basename(__filename)} --order SD001,SD002,SD003

    CSV Requirements:
    - Must contain 'order_number' column
    - Supports various file locations (current dir, output-data/, data/, csv/)

    Common Issues:
    - 404 errors usually mean orders are pending SFCC/OMS export
    - Verify order numbers match the current environment (${this.environment})
            `);
        }
    }

// Main CLI execution
async function main() {
    const cli = new OrderShipmentCLI();
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        cli.displayUsage();
        return;
    }
    
    try {
        const csvIndex = args.indexOf('--csv');
        const orderIndex = args.indexOf('--order');
        
        if (csvIndex !== -1) {
            const csvFile = args[csvIndex + 1];
            if (!csvFile) throw new Error('Please provide CSV file path');
            
            await cli.validateCsvFile(csvFile);
            await cli.processOrdersFromCsv(csvFile);
            
        } else if (orderIndex !== -1) {
            const orderInput = args[orderIndex + 1];
            if (!orderInput) throw new Error('Please provide order numbers');
            
            const orderNumbers = cli.parseOrderNumbers(orderInput);
            await cli.processOrders(orderNumbers);
            
        } else {
            throw new Error('Use --csv or --order. Run --help for usage');
        }
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        console.log('\nRun with --help for usage information');
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = OrderShipmentCLI;