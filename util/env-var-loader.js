const process = require('process');

class EnvVarLoader {
    /**
     * Load a single environment variable with a prefixed key.
     * @param {string} varName - Base variable name (e.g., 'SFCC_HOST')
     * @param {string} envStr - Environment identifier (e.g., '004', 'DEV')
     * @param {string} [category] - Optional display name for error messages; defaults to varName
     * @returns {string} The environment variable value
     * @throws {Error} If the variable is not set
     */
    static loadEnvVar(varName, envStr, category = null) {
        if (!envStr || typeof envStr !== 'string') {
            throw new Error(`envStr must be a non-empty string. Received: ${envStr}`);
        }
        const key = `${varName}_${envStr.toUpperCase()}`;

        if (!process.env[key]) {
            const displayName = category || varName;
            throw new Error(
                `ENVIRONMENT is not set up correctly. You're missing the following configurations [ ${displayName} ].`
            );
        }

        return process.env[key];
    }

    /**
     * Load multiple environment variables with prefixed keys.
     * @param {string[]} varNames - Array of base variable names
     * @param {string} envStr - Environment identifier
     * @returns {Object} Object mapping each varName to its resolved value
     * @throws {Error} If any variable is not set
     */
    static loadEnvVars(varNames, envStr) {
        const result = {};

        varNames.forEach(varName => {
            result[varName] = this.loadEnvVar(varName, envStr);
        });

        return result;
    }
}

module.exports = EnvVarLoader;
