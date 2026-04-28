const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const REFLogger = require('../../util/ref-logger');

class XmlReportParser {
    constructor() {
        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    async parseReport(reportPath) {
        try {
            const content = fs.readFileSync(reportPath, 'utf-8');
            const report = await xml2js.parseStringPromise(content);

            this.refLogger.debug('XmlReportParser -> report');
            this.refLogger.debug(report);

            // Handle both structures:
            let testsuite;

            if (report.testsuites.$?.tests) {
                 testsuite = report.testsuites;
            }
            else if (report.testsuites.testsuite[0]?.$?.tests) {
                // node test xml format
                testsuite = report.testsuites.testsuite[0];
            } else {
                throw new Error('Unexpected XML format: testsuite node not found');
            }

            const { tests = '0', failures = '0', errors = '0', skipped = '0' } = testsuite.$ || {};

            const total = parseInt(tests, 10);
            const failed = parseInt(failures, 10);
            const errorCount = parseInt(errors, 10);
            const skippedCount = parseInt(skipped, 10);
            const passed = total - failed - errorCount - skippedCount;

            const executedCount = this.countKeyOccurrences(testsuite, '@classname');

            this.refLogger.debug('XmlReportParser -> executedCount');
            this.refLogger.debug(executedCount);

            return {
                total,
                passed,
                failed,
                skipped: skippedCount,
                errors: errorCount,
                rerun: 0, // No rerun info in XML
                executed: executedCount,
                'test-failures': this.getTestFailures(report)
            };
        } catch (error) {
            this.refLogger.error(`Error parsing report file [${reportPath}]: ${error.message}`);
            throw new Error(`Failed to parse report at ${reportPath}`);
        }
    }


    countKeyOccurrences(data, keyToCount) {
        /**
         * Recursively count occurrences of a specific key in a JSON document.
         *
         * @param {Object|Array} data - The JSON data to search through.
         * @param {string} keyToCount - The key to count occurrences of.
         * @returns {number} The number of occurrences of the specified key.
         */
        if (typeof data === 'object' && !Array.isArray(data)) {
            let count = 0;
            for (const [key, value] of Object.entries(data)) {
                if (key === keyToCount) {
                    count += 1;
                }
                count += this.countKeyOccurrences(value, keyToCount);
            }
            return count;
        } else if (Array.isArray(data)) {
            return data.reduce((acc, item) => acc + this.countKeyOccurrences(item, keyToCount), 0);
        } else {
            return 0;
        }
    }

    getTestFailures(report) {
        /**
         * Parse all of the test failures from JUnit-style test JSON results.
         *
         * @param {Object} report - The parsed JSON/XML data.
         * @returns {Object} A map of test names and their error messages.
         */
        const failureMap = {};

        // Normalize the test case array
        let testcases = [];

        if (report.testsuites?.testsuite) {
            // Some reports have an array of test suites
            const suites = Array.isArray(report.testsuites.testsuite)
                ? report.testsuites.testsuite
                : [report.testsuites.testsuite];

            suites.forEach((suite) => {
                if (suite.testcase) {
                    testcases.push(...suite.testcase);
                }
            });
        } else if (report.testsuite?.testcase) {
            // Some reports use a single testsuite
            testcases = Array.isArray(report.testsuite.testcase)
                ? report.testsuite.testcase
                : [report.testsuite.testcase];
        }

        // Parse failures
        testcases.forEach((testcase) => {
            if (testcase.failure) {
                const testName = testcase.$?.name || 'Unnamed Test';
                const failureMessage = testcase.failure[0]?.$?.message || 'No failure message';
                failureMap[testName] = failureMessage;

                this.refLogger.debug(`Test failure: ${testName} -> ${failureMessage}`);
            }
        });

        this.refLogger.debug('Parsed test failures:', failureMap);

        return failureMap;
    }

}

module.exports = XmlReportParser;
