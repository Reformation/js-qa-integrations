const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');

const REFLogger = require('../../util/ref-logger');
//const ErrorHandler = require('../util/error-handler');

class CsvReader {
    constructor(envHost = null, outputDataDir = null) {
        this.envHost = envHost || process.env.ENV_HOST;
        this.outputDataDir = outputDataDir || process.env.OUTPUT_DATA_DIR || './output-data';
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }


    returnPathFile(fileName) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                //throw ErrorHandler.createValidationError('File name must be a non-empty string', 'fileName');
                throw new Error('File name must be a non-empty string');
            }
            
            if (path.isAbsolute(fileName)) {
                return fileName;
            }
            
            return path.join(this.outputDataDir, fileName);

        } catch (error) {
            this.refLogger.error(`Error resolving file path: ${error.message}`);
            //throw ErrorHandler.wrapError(error, 'Failed to resolve file path');
            throw new Error(`Failed to resolve file path: ${error.message}`);
        }
    }

    async readCsvFile(filePath) {
        try {

            if (!filePath || typeof filePath !== 'string') {
                //throw ErrorHandler.createValidationError('File path must be a non-empty string', 'filePath');
                throw new Error('File path must be a non-empty string');
            }

            
            try {
                await fs.access(filePath);
            } catch (accessError) {
                //throw ErrorHandler.createNotFoundError('CSV file', filePath);
                throw new Error(`CSV file not found: ${filePath}`);
            }

            const fileContent = await fs.readFile(filePath, 'utf8');
            
            if (!fileContent.trim()) {
                //throw ErrorHandler.createValidationError('CSV file is empty', 'fileContent');
                throw new Error('CSV file is empty');
            }
            
            const parseResult = Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                delimitersToGuess: [',', '\t', '|', ';']
            });

            if (parseResult.errors.length > 0) {

                const criticalErrors = parseResult.errors.filter(error => 
                    error.type === 'Delimiter' || error.type === 'Quotes'
                );
                
                if (criticalErrors.length > 0) {
                    // throw ErrorHandler.createValidationError(
                    //     `Critical CSV parsing errors: ${JSON.stringify(criticalErrors)}`, 
                    //     'csvParsing'
                    // );
                    throw new Error(`Critical CSV parsing errors: ${JSON.stringify(criticalErrors)}`);
                }
                
                this.refLogger.warn(`CSV parsing warnings: ${JSON.stringify(parseResult.errors)}`);
            }

            if (!Array.isArray(parseResult.data) || parseResult.data.length === 0) {
                //throw ErrorHandler.createValidationError('No valid data found in CSV file');
                throw new Error('No valid data found in CSV file');
            }

            this.refLogger.info(`Successfully parsed CSV: ${parseResult.data.length} records`);
            return parseResult.data;

        } catch (error) {
            this.refLogger.error(`Failed to read CSV file: ${error.message}`);
            if (error.code && error.code.startsWith('VALIDATION_') || error.code === 'NOT_FOUND') {
                throw error; 
            }
            //throw ErrorHandler.wrapError(error, 'Failed to read and parse CSV file');
            throw new Error(`Failed to read and parse CSV file: ${error.message}`);
        }
    }
}

module.exports = CsvReader;