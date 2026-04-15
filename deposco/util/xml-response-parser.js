const xml2js = require('xml2js');

const REFLogger = require('../../util/ref-logger');

class XmlResponseParser {
    constructor() {
        this.logger = new REFLogger('XmlResponseParser');
        
        this.parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: false,
            mergeAttrs: true,
            normalize: true,
            normalizeTags: true,
            trim: true
        });
    }


    async parseXmlResponse(xmlString) {
        try {
            if (!xmlString || typeof xmlString !== 'string') {
                throw new Error('Invalid XML string provided');
            }

            this.logger.debug(`Parsing XML response: ${xmlString}`);

            const result = await this.parser.parseStringPromise(xmlString);
            
            this.logger.debug(`Parsed XML result: ${JSON.stringify(result, null, 2)}`);

            return this.extractResponseData(result);

        } catch (error) {
            this.logger.error(`Error parsing XML response: ${error.message}`);
            throw new Error(`XML parsing failed: ${error.message}`);
        }
    }

    extractResponseData(parsedXml) {
        try {
            if (parsedXml['ns2:multistatus']) {
                return this.parseMultiStatusResponse(parsedXml['ns2:multistatus']);
            }

            if (parsedXml.response) {
                return this.parseDirectResponse(parsedXml.response);
            }

            if (parsedXml.error) {
                return this.parseErrorResponse(parsedXml.error);
            }

            return {
                success: false,
                error: 'Unknown XML response format',
                rawData: parsedXml
            };

        } catch (error) {
            this.logger.error(`Error extracting response data: ${error.message}`);
            throw error;
        }
    }

    parseMultiStatusResponse(multistatus) {
        try {
            const response = multistatus.response;
            
            if (!response) {
                throw new Error('No response found in multistatus');
            }

            const status = response.status;
            const entity = response.entity;
            const description = response.description;
            const message = response.message;

            const isSuccess = this.isSuccessStatus(status);

            const result = {
                success: isSuccess,
                status: status,
                entity: entity,
                description: description,
                message: message,
                shipmentId: entity,
                rawData: multistatus
            };

            if (!isSuccess) {
                result.error = description || message || status || 'Unknown error';
            }

            return result;

        } catch (error) {
            this.logger.error(`Error parsing multistatus response: ${error.message}`);
            throw error;
        }
    }

    parseDirectResponse(response) {
        try {
            const status = response.status;
            const isSuccess = this.isSuccessStatus(status);

            return {
                success: isSuccess,
                status: status,
                entity: response.entity,
                description: response.description,
                message: response.message,
                error: isSuccess ? null : (response.error || response.message || 'Unknown error'),
                rawData: response
            };

        } catch (error) {
            this.logger.error(`Error parsing direct response: ${error.message}`);
            throw error;
        }
    }

    parseErrorResponse(errorResponse) {
        try {
            return {
                success: false,
                status: errorResponse.status || 'Error',
                error: errorResponse.message || errorResponse.description || 'Unknown error',
                code: errorResponse.code,
                details: errorResponse.details,
                rawData: errorResponse
            };

        } catch (error) {
            this.logger.error(`Error parsing error response: ${error.message}`);
            throw error;
        }
    }

    isSuccessStatus(status) {
        if (!status || typeof status !== 'string') {
            return false;
        }

        const statusLower = status.toLowerCase();
        
        // Check for HTTP success status codes
        return statusLower.includes('200 ok') || 
               statusLower.includes('201 created') || 
               statusLower.includes('202 accepted') ||
               statusLower.includes('204 no content');
    }


    isXmlResponse(responseString) {
        if (!responseString || typeof responseString !== 'string') {
            return false;
        }

        const trimmed = responseString.trim();
        return trimmed.startsWith('<?xml') || 
               trimmed.startsWith('<') && trimmed.includes('</');
    }

    async parseResponse(response) {
        try {
            // If response is already an object, return as is
            if (typeof response === 'object' && response !== null) {
                return {
                    success: true,
                    data: response,
                    format: 'json'
                };
            }

            if (typeof response === 'string') {
                if (this.isXmlResponse(response)) {
                    const parsedXml = await this.parseXmlResponse(response);
                    return {
                        ...parsedXml,
                        format: 'xml'
                    };
                } else {
                    // Try to parse as JSON
                    try {
                        const jsonData = JSON.parse(response);
                        return {
                            success: true,
                            data: jsonData,
                            format: 'json'
                        };
                    } catch (jsonError) {
                        return {
                            success: false,
                            error: 'Response is neither valid XML nor JSON',
                            rawData: response,
                            format: 'unknown'
                        };
                    }
                }
            }

            return {
                success: false,
                error: 'Invalid response format',
                rawData: response,
                format: 'unknown'
            };

        } catch (error) {
            this.logger.error(`Error parsing response: ${error.message}`);
            return {
                success: false,
                error: error.message,
                rawData: response,
                format: 'error'
            };
        }
    }


    validateResponse(parsedResponse) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!parsedResponse) {
            validation.isValid = false;
            validation.errors.push('No parsed response provided');
            return validation;
        }

        // Check for required fields
        if (parsedResponse.success === undefined) {
            validation.warnings.push('Success status not defined');
        }

        if (parsedResponse.success === false && !parsedResponse.error) {
            validation.warnings.push('Error response without error message');
        }

        if (parsedResponse.success === true && !parsedResponse.entity && !parsedResponse.data) {
            validation.warnings.push('Success response without entity or data');
        }

        return validation;
    }
}

module.exports = XmlResponseParser;