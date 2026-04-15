// ===== standardized error handling  =====

class ErrorHandler {
    static createError(message, code = 'GENERIC_ERROR', statusCode = 400, originalError = null) {
        const error = new Error(message);
        error.code = code;
        error.statusCode = statusCode;
        error.originalError = originalError;
        error.timestamp = new Date().toISOString();
        return error;
    }

    static createValidationError(message, field = null) {
        const error = this.createError(message, 'VALIDATION_ERROR', 400);
        error.field = field;
        return error;
    }

    static createNotFoundError(resource, identifier = null) {
        const message = identifier 
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        return this.createError(message, 'NOT_FOUND', 404);
    }

    static createApiError(message, statusCode = 500, apiResponse = null) {
        const error = this.createError(message, 'API_ERROR', statusCode);
        error.apiResponse = apiResponse;
        return error;
    }

    static wrapError(originalError, message = null, code = 'WRAPPED_ERROR') {
        const wrappedMessage = message || originalError.message;
        return this.createError(wrappedMessage, code, 500, originalError);
    }

    static handleAsyncOperation(operation, context = 'Operation') {
        return async (...args) => {
            try {
                return await operation(...args);
            } catch (error) {
                throw this.wrapError(error, `${context} failed: ${error.message}`);
            }
        };
    }
}

module.exports = ErrorHandler;