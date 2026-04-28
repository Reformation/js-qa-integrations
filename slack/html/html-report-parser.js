const fs = require('fs');
const cheerio = require('cheerio');

class HtmlReportParser {
    parseReport(htmlFile) {
        const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
        const $ = cheerio.load(htmlContent);

        // Initialize the results object
        const results = { passed: 0, failed: 0, skipped: 0, error: 0, rerun: 0, executed: 0 };

        // Find the summary data section
        const summaryData = $('.summary__data');
        const controls = summaryData.find('.controls');

        if (controls.length) {
            // Find the filters section within controls
            const filters = controls.find('.filters');

            if (filters.length) {
                // Extract and parse the numeric values for each test result category
                filters.find('span').each((_, span) => {
                    const text = $(span).text();
                    if (text.includes('Failed')) {
                        results.failed = parseInt(text.split(' ')[0], 10);
                    } else if (text.includes('Passed')) {
                        results.passed = parseInt(text.split(' ')[0], 10);
                    } else if (text.includes('Skipped')) {
                        results.skipped = parseInt(text.split(' ')[0], 10);
                    } else if (text.includes('Errors')) {
                        results.error = parseInt(text.split(' ')[0], 10);
                    } else if (text.includes('Reruns')) {
                        results.rerun = parseInt(text.split(' ')[0], 10);
                    }
                });
            }

            // Find the run count
            const runCountP = $('.run-count');
            if (runCountP.length) {
                results.executed = runCountP.text().trim();
            }

            console.log(results);
            return results;
        }
    }
}

module.exports = HtmlReportParser;