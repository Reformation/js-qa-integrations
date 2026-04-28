const path = require('path');
const process = require('process');
const { ArgumentParser } = require('argparse');
const REFLogger = require('../util/ref-logger');
const SlackReportSender = require('../slack/slack-sender');
const HtmlReportParser = require('../slack/html/html-report-parser');
const XmlReportParser = require('../slack/xml/xml-report-parser');


class SlackReport {
    constructor(reportFile = null, webhookUrl = null, headerNameValuePairs, reportDownloadUrl = "None Specified") {
        this.reportFile = reportFile;
        this.webhookUrl = webhookUrl;
        this.headerNameValuePairs = headerNameValuePairs;
        this.reportDownloadUrl = reportDownloadUrl;

        const loggerName = path.basename(__filename, path.extname(__filename));
        this.refLogger = new REFLogger(loggerName);
    }

    setReportFile() {
        if (!this.reportFile) {
            try {
                this.refLogger.debug('No value found. Looking up [ PLAYWRIGHT_TEST_RESULTS_FILE_LOCATION ] in the ENV');
                this.reportFile = process.env.PLAYWRIGHT_TEST_RESULTS_FILE_LOCATION;
                this.refLogger.debug(`PLAYWRIGHT_TEST_RESULTS_FILE_LOCATION value retrieved from ENV: ${this.reportFile}`);
            } catch (error) {
                this.refLogger.error(`REQUIRED ENV VARIABLE MISSING - Error encountered for [ PLAYWRIGHT_TEST_RESULTS_FILE_LOCATION ] in slack_report: ${error.message}`);
                throw error;
            }
        } else {
            this.refLogger.debug(`Using PLAYWRIGHT_TEST_RESULTS_FILE_LOCATION value that was passed into the SlackReport programmatically: ${this.reportFile}`);
        }
    }

    setWebhookUrl() {
        if (!this.webhookUrl) {
            try {
                this.refLogger.debug('No value found. Looking up [ SLACK_CHANNEL_WEBHOOK_URL ] in the ENV');
                this.webhookUrl = process.env.SLACK_CHANNEL_WEBHOOK_URL;
                this.refLogger.debug(`SLACK_CHANNEL_WEBHOOK_URL value retrieved from ENV: ${this.webhookUrl}`);
            } catch (error) {
                this.refLogger.error(`REQUIRED ENV VARIABLE MISSING - Error encountered for [ SLACK_CHANNEL_WEBHOOK_URL ] in slack_report: ${error.message}`);
                throw error;
            }
        } else {
            this.refLogger.debug(`Using SLACK_CHANNEL_WEBHOOK_URL value that was passed into the SlackReport programmatically: ${this.webhookUrl}`);
        }
    }

    getReportParser() {
        let parser;
        if (this.reportFile.toLowerCase().endsWith('.xml')) {
            parser = new XmlReportParser();
            this.refLogger.debug('Instantiated XmlReportParser()');
        } else if (this.reportFile.toLowerCase().endsWith('.html')) {
            parser = new HtmlReportParser();
            this.refLogger.debug('Instantiated HtmlReportParser()');
        } else {
            throw new Error(`Slack Report expects to process one of the following file types [ HTML, XML ]. File [ ${this.reportFile} ] doesn't appear to be either of those.`);
        }
        return parser;
    }       

    async compileReport() {
        // If the reportFile and webhookUrl parameters are blank, try to get them from the environment
        this.setReportFile();
        this.setWebhookUrl();

        const parser = this.getReportParser();

        const reportData = await parser.parseReport(this.reportFile);
        this.refLogger.debug('test_results --> ');
        this.refLogger.debug(reportData);
        
        return reportData;
    }      

    async compileReportAndSendToSlack() {
        this.refLogger.debug('Started -> src.slack.SlackReport');

        try {
            const reportData = await this.compileReport();
            this.refLogger.debug('test_results --> ');
            this.refLogger.debug(reportData);

            const slackReportSender = new SlackReportSender(
                this.webhookUrl,
                reportData,
                this.headerNameValuePairs,
                this.reportDownloadUrl
            );

            await slackReportSender.postToSlack();
        } catch (error) {
            this.refLogger.error(`Failed to compile or send report to Slack: ${error.message}`);

            const fallbackMessage = `:x: An error occurred while parsing the test report or sending the Slack message.\nError: ${error.message}\nReport File: ${this.reportFile}`;

            const slackReportSender = new SlackReportSender(
                this.webhookUrl,
                fallbackMessage,
                this.headerNameValuePairs,
                this.reportDownloadUrl
            );

            try {
                await slackReportSender.postToSlack();
            } catch (slackError) {
                this.refLogger.error(`Also failed to send fallback Slack message: ${slackError.message}`);
            }
        }

        this.refLogger.debug('Ended -> src.slack.SlackReport');
    }
}

// This 'main' is called the following workflows as of 5/20/2025
// 1. js-qa-automation -> run-green-automated-node-tests.yml
// 2. sfcc-site -> dev-build.yml
// It is called via the following command:
// node src/slack/slack_report.js --report_file <file> --webhook_url <url> --pytest_tag <tag> --test_env <env> --pr_number <pr> --report_download_url <url>
if (require.main === module) {
    const parser = new ArgumentParser({
        description: "A script to process GitHub Actions parameters"
    });

    // Add arguments
    parser.add_argument('--report_file', { type: 'str', required: true, help: 'Path to the report file' });
    parser.add_argument('--webhook_url', { type: 'str', required: true, help: 'Slack webhook URL' });
    parser.add_argument('--pytest_tag', { type: 'str', required: true, help: 'Pytest tag' });
    parser.add_argument('--test_env', { type: 'str', required: true, help: 'Env where tests are being run' });
    parser.add_argument('--pr_number', { type: 'str', required: true, help: 'PR number' });
    parser.add_argument('--report_download_url', { type: 'str', required: true, help: 'URL to download test results file' });

    // Parse the arguments
    const args = parser.parse_args();

    // Set up a quick logger for CLI debugging
    const loggerName = path.basename(__filename, path.extname(__filename));
    const cliLogger = new REFLogger(loggerName);

    // Access the arguments
    cliLogger.info('There are the arguments passed in from GitHub Actions:');
    cliLogger.info(`Report File: ${args.report_file}`);
    cliLogger.info(`Webhook URL: ${args.webhook_url}`);
    cliLogger.info(`Pytest Tag: ${args.pytest_tag}`);
    cliLogger.info(`Test Env: ${args.test_env}`);
    cliLogger.info(`PR Number: ${args.pr_number}`);
    cliLogger.info(`Report Download URL: ${args.report_download_url}`);

    let headerNameValuePairs = new Map();
        headerNameValuePairs.set('Test set', args.pytest_tag);
        headerNameValuePairs.set('Server', args.test_env);
        headerNameValuePairs.set('PR', args.pr_number);


    const slackReport = new SlackReport(args.report_file, args.webhook_url, headerNameValuePairs, args.report_download_url);
    slackReport.compileReportAndSendToSlack().catch(error => {
        cliLogger.error('Error:', error.message);
        process.exit(1);
    });
}

module.exports = SlackReport;