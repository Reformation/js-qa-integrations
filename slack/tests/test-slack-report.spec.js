require('dotenv').config();
const path = require('path');
const axios = require('axios');

const REFLogger = require('../../util/ref-logger');
const SlackReport = require('../slack-report');

describe('Slack Automated Test Report Tests', () => {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);

    const dirPath = __dirname;
    refLogger.info('dirPath -> ', dirPath);

    const GREEN_BUILDS_webhookUrl = `https://hooks.slack.com/services/${process.env.GREEN_BUILDS_SLACK_TOKEN}`;
    const QA_AUTOMATION_webhookUrl = `https://hooks.slack.com/services/${process.env.QA_AUTOMATION_SLACK_TOKEN}`;

    test('should write success report to QA Automation Slack channel', async () => {
        refLogger.info('Started test_write_success_report_to_qa_automation_slack_channel');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = '12345';
        const testEnv = '008';
        const prNumber = 'test write success report to QA Automation Slack channel';

        let headerNameValuePairs = new Map();
        headerNameValuePairs.set('Test set', pytestTag);
        headerNameValuePairs.set('Server', testEnv);
        headerNameValuePairs.set('PR', prNumber);

        const slackReport = new SlackReport(reportFile, QA_AUTOMATION_webhookUrl, headerNameValuePairs, '<https://api.slack.com|Slack API>');
        await slackReport.compileReportAndSendToSlack();

        refLogger.info('Finished test_write_success_report_to_qa_automation_slack_channel');
    });

    test('should write error report to QA Automation Slack channel', async () => {
        refLogger.info('Started test_write_error_report_to_qa_automation_slack_channel');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results-errors-full.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = 'abcdefg';
        const testEnv = '008';
        const prNumber = '2';

        const slackReport = new SlackReport(reportFile, QA_AUTOMATION_webhookUrl, pytestTag, testEnv, prNumber, '<https://api.slack.com|Slack API>');
        await slackReport.compileReportAndSendToSlack();

        refLogger.info('Finished test_write_error_report_to_qa_automation_slack_channel');
    });

    test('should write failure report to QA Automation Slack channel', async () => {
        refLogger.info('Started test_write_failure_report_to_qa_automation_slack_channel');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results-failed.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = '98765';
        const testEnv = '008';
        const prNumber = 'test write failure report to QA Automation Slack channel';

        let headerNameValuePairs = new Map();
        headerNameValuePairs.set('Test set', pytestTag);
        headerNameValuePairs.set('Server', testEnv);
        headerNameValuePairs.set('PR', prNumber);

        const slackReport = new SlackReport(reportFile, QA_AUTOMATION_webhookUrl, headerNameValuePairs, '<https://api.slack.com|Slack API>');
        await slackReport.compileReportAndSendToSlack();

        refLogger.info('Finished test_write_failure_report_to_qa_automation_slack_channel');
    });

    test('should write test message to green builds Slack channel', async () => {
        refLogger.info('Started test_write_test_message_to_green_builds_slack_channel');

        const payload = {
            text: 'AUTOMATED TEST slack/tests/test-slack-report.spec - test_write_test_message_to_green_builds_slack_channel',
        };

        const response = await axios.post(GREEN_BUILDS_webhookUrl, payload, { timeout: 5000 });
        expect(response.status).toBe(200);

        refLogger.info('Finished test_write_test_message_to_green_builds_slack_channel');
    });

    test('new format for node tests', async () => {
        refLogger.info('Started new format for node tests');

        const reportFile = path.join(dirPath, 'data/green-automated-test-results-2.0.xml');
        refLogger.info('Report File -> ', reportFile);

        const pytestTag = 'Slack Unit Test';
        const testEnv = '008';
        const prNumber = '3';

        const slackReport = new SlackReport(reportFile, QA_AUTOMATION_webhookUrl, pytestTag, testEnv, prNumber, '<https://api.slack.com|Slack API>');
        await slackReport.compileReportAndSendToSlack();

        refLogger.info('Finished new format for node tests');
    });
});
