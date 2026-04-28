const path = require('path');
const axios = require('axios');
const REFLogger = require('../util/ref-logger');
const SlackErrorReport = require('../slack/template/error-report');
const SlackSuccessReport = require('../slack/template/success-report');
class SlackReportSender {
    constructor(webhookUrl, results, headerNameValuePairs, reportDownloadUrl) {
        this.webhookUrl = webhookUrl;
        this.results = results;
        this.headerNameValuePairs = headerNameValuePairs;
        this.reportDownloadUrl = reportDownloadUrl;

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    async postToSlack() {
        console.log('SlackReportSender -> results ');
        console.log(this.results);

        let payload;

        if (this.resultsHasErrors()) {
            const slackErrorReport = new SlackErrorReport();
            this.refLogger.debug('----------- slack_error_report -----------');
            this.refLogger.debug(slackErrorReport);
            payload = slackErrorReport.formatErrorReport(
                this.results,
                this.headerNameValuePairs,
                this.reportDownloadUrl
            );
        } else {
            const slackSuccessReport = new SlackSuccessReport();
            this.refLogger.debug('----------- slack_success_report -----------');
            this.refLogger.debug(slackSuccessReport);

            payload = slackSuccessReport.formatSuccessMessage(
                this.results,
                this.headerNameValuePairs,
                this.reportDownloadUrl
            );
        }

        try {
            this.refLogger.debug('slack_sender.js is writing to webhook url - ');
            this.refLogger.debug(this.webhookUrl);
            const response = await axios.post(this.webhookUrl, payload, { timeout: 5000 });
            this.refLogger.debug(`Slack Channel POST Response -> ${response.status}`);
            if (response.status !== 200) {
                throw new Error(`Request to Slack returned an error ${response.status}, the response is:\n${response.data}`);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                this.refLogger.error('A timeout occurred when attempting to pass the test results to Slack.');
            } else {
                this.refLogger.error(`An error occurred: ${error.message}`);
            }
            throw error;
        }
    }

    resultsHasErrors() {
        return this.results.errors || this.results.failed;
    }
}

module.exports = SlackReportSender;