require('dotenv').config();
const path = require('path');

const { test, expect } = require('@playwright/test');

const REFLogger = require('../../../util/ref-logger');
const SlackReport = require('../../../slack/slack-report');

test.describe('Slack Automated Test Report Info Tests', () => {
    const loggerName = path.basename(__filename, path.extname(__filename));
    const refLogger = new REFLogger(loggerName);

    const dirPath = __dirname;
    refLogger.info('dirPath -> ', dirPath);

    test('verify that test results are parsed correctly for the SlackReport', async () => {
        refLogger.info('Started test_write_success_report_to_qa_automation_slack_channel');

        const dirPath = __dirname;
        refLogger.debug('dirPath -> ', dirPath);

        const reportFile = path.join(dirPath, 'data/green-bugfix-results.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = '12345';
        const testEnv = '008';
        const webhookUrl = `https://hooks.slack.com/services/${process.env.QA_AUTOMATION_SLACK_TOKEN}`;
        const prNumber = '1';

        const slackReport = new SlackReport(reportFile);
        const reportData = await slackReport.compileReport();
        refLogger.debug('test_results --> ');
        refLogger.debug(reportData);
        expect(reportData).toBeDefined();

        expect(reportData.total).toBe(2);
        expect(reportData.passed).toBe(2);
        expect(reportData.failed).toBe(0);
        expect(reportData.skipped).toBe(0);
        expect(reportData.errors).toBe(0);
        expect(reportData.rerun).toBe(0);
        expect(reportData.executed).toBe(0);
        expect(reportData['test-failures']).toEqual({});

        refLogger.info('Finished test_write_success_report_to_qa_automation_slack_channel');
    });

    test('verify that test results are parsed correctly for the SlackReport 2', async () => {
        refLogger.info('Started test_write_error_report_to_qa_automation_slack_channel');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results-errors-full.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = 'abcdefg';
        const testEnv = '008';
        const webhookUrl = `https://hooks.slack.com/services/${process.env.QA_AUTOMATION_SLACK_TOKEN}`;
        const prNumber = '2';

        const slackReport = new SlackReport(reportFile);
        const reportData = await slackReport.compileReport();
        refLogger.debug('test_results --> ');
        refLogger.debug(reportData);
        expect(reportData).toBeDefined();

        expect(reportData.total).toBe(18);
        expect(reportData.passed).toBe(14);
        expect(reportData.failed).toBe(4);
        expect(reportData.skipped).toBe(0);
        expect(reportData.errors).toBe(0);
        expect(reportData.rerun).toBe(0);
        expect(reportData.executed).toBe(0);

        expect(reportData['test-failures']).toBeDefined();
        const testFailures = reportData['test-failures'];
        
        // Ensure all expected test keys are present
        expect(Object.keys(testFailures)).toEqual([
            "test_simple_ispu_order_logged_in[chromium]",
            "test_simple_ispu_order_logged_out[chromium]",
            "test_simple_sfs_order_logged_out[chromium]",
            "test_sfs_double_ship_charge_logged_out[chromium]"
        ]);

        // Assertions per test
        expect(testFailures["test_simple_ispu_order_logged_in[chromium]"]).toContain("AssertionError");
        expect(testFailures["test_simple_ispu_order_logged_in[chromium]"]).toContain("get_by_text(\"Boston\")");

        expect(testFailures["test_simple_ispu_order_logged_out[chromium]"]).toContain("AssertionError");
        expect(testFailures["test_simple_ispu_order_logged_out[chromium]"]).toContain("get_by_text(\"Boston\")");

        expect(testFailures["test_simple_sfs_order_logged_out[chromium]"]).toContain("TimeoutError");
        expect(testFailures["test_simple_sfs_order_logged_out[chromium]"]).toContain("get_by_role(\"button\", name=\"Continue as guest\")");

        expect(testFailures["test_sfs_double_ship_charge_logged_out[chromium]"]).toContain('Timeout 30000ms exceeded');
        expect(testFailures["test_sfs_double_ship_charge_logged_out[chromium]"]).toContain('TimeoutError');      
        

        refLogger.info('Finished test_write_error_report_to_qa_automation_slack_channel');
    });

    test('verify that test results are parsed correctly for the SlackReport 3', async () => {
        refLogger.info('Started test_write_failure_report_to_qa_automation_slack_channel');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results-failed.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = '98765';
        const testEnv = '008';
        const webhookUrl = `https://hooks.slack.com/services/${process.env.QA_AUTOMATION_SLACK_TOKEN}`;
        const prNumber = '3';

        const slackReport = new SlackReport(reportFile);
        const reportData = await slackReport.compileReport();
        refLogger.debug('test_results --> ');
        refLogger.debug(reportData);
        expect(reportData).toBeDefined();

        expect(reportData.total).toBe(2);
        expect(reportData.passed).toBe(1);
        expect(reportData.failed).toBe(1);
        expect(reportData.skipped).toBe(0);
        expect(reportData.errors).toBe(0);
        expect(reportData.rerun).toBe(0);
        expect(reportData.executed).toBe(0);

        expect(reportData['test-failures']).toEqual({});

        refLogger.info('Finished test_write_failure_report_to_qa_automation_slack_channel');
    });

    test('should handle empty environment variables minus the report data', async () => {
        refLogger.info('Started should handle empty environment variables minus the report data');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results.xml');
        refLogger.debug('Report File -> ', reportFile);

        const slackReport = new SlackReport(reportFile);
        const reportData = await slackReport.compileReport();
        refLogger.debug('test_results --> ');
        refLogger.debug(reportData);
        expect(reportData).toBeDefined();

        expect(reportData.total).toBe(2);
        expect(reportData.passed).toBe(2);
        expect(reportData.failed).toBe(0);
        expect(reportData.skipped).toBe(0);
        expect(reportData.errors).toBe(0);
        expect(reportData.rerun).toBe(0);
        expect(reportData.executed).toBe(0);
        expect(reportData['test-failures']).toEqual({});

        refLogger.info('Finished should handle empty environment variables minus the report data');
    });

    test('should throw error when ALL variables are missing for Slack report', async () => {
        refLogger.info('Started should throw error when ALL variables are missing for Slack report');

        const slackReport = new SlackReport();

        await expect(slackReport.compileReport()).rejects.toThrow(
        /Failed to parse report at .*\/src\/slack\/test\/green-bugfix-results\.xml/
        );

        refLogger.info('Finished should throw error when ALL variables are missing for Slack report');
    });

    test('should throw error for existing but empty test report', async () => {
        refLogger.info('Started should throw error for existing but empty test report');

        const reportFile = path.join(dirPath, 'data/green-bugfix-results-empty.xml');
        refLogger.debug(`Report File -> ${reportFile}`);

        const slackReport = new SlackReport(reportFile);

        await expect(slackReport.compileReport()).rejects.toThrow(
        /Failed to parse report at .*\/tests\/slack-internal\/data\/green-bugfix-results-empty\.xml/
        );

        refLogger.info('Finished should throw error for existing but empty test report');
    });

    test('Error Report for Automation 2.0 node results', async () => {
        refLogger.info('Started Error Report for Automation 2.0 node results');

        const reportFile = path.join(dirPath, 'data/green-automated-test-results-2.0.xml');
        refLogger.debug('Report File -> ', reportFile);

        const pytestTag = 'abcdefg';
        const testEnv = '008';
        const webhookUrl = `https://hooks.slack.com/services/${process.env.QA_AUTOMATION_SLACK_TOKEN}`;
        const prNumber = '2';

        const slackReport = new SlackReport(reportFile);
        const reportData = await slackReport.compileReport();
        refLogger.debug('test_results --> ');
        refLogger.debug(reportData);
        expect(reportData).toBeDefined();

        expect(reportData.total).toBe(20);
        expect(reportData.passed).toBe(4);
        expect(reportData.failed).toBe(16);
        expect(reportData.skipped).toBe(0);
        expect(reportData.errors).toBe(0);
        expect(reportData.rerun).toBe(0);
        expect(reportData.executed).toBe(0);

        expect(reportData['test-failures']).toBeDefined();
        const testFailures = reportData['test-failures'];
        
        // Ensure all expected test keys are present
        expect(Object.keys(testFailures)).toEqual([
            "Baseline Home Delivery Logged In › test_simple_home_delivery_promo_code_order_logged_in",
            "TestBaselineISPULoggedIn › test_simple_ispu_order_logged_in",
            "Baseline ISPU Logged Out › test_simple_ispu_order_logged_out",
            "TestBaselineSFSLoggedOut › test_simple_sfs_order_logged_out",
            "TestMultipleProductTypeShipmentIssues › test_CEVA_and_VERNON_shipments_fix_1",
            "TestMultipleProductTypeShipmentIssues › test_SFS_CEVA_VERNON_and_PREORDER_shipments_fix_2",
            "TestMultipleProductTypeShipmentIssues › test_multiple_product_type_shipment_issues_logged_out",
            "TestMultipleProductTypeShipmentRegression › test_SFS_and_VERNON_shipments_regression",
            "TestMultipleProductTypeShipmentRegression › test_SFS_and_CEVA_shipments_regression",
            "TestMultipleProductTypeShipmentRegression › test_SFS_and_PREORDER_shipments_regression",
            "TestMultipleProductTypeShipmentRegression › test_CEVA_and_PREORDER_shipments_regression",
            "TestMultipleProductTypeShipmentRegression › test_SFS_CEVA_and_PREORDER_shipments_regression",
            "TestMultipleProductTypeShipmentRegression › test_SFS_VERNON_and_PREORDER_shipments_regression",
            "TestUSispuCheckout › test_ispu_with_logout_and_login",
            "Test US SFS and Standard Item Checkout › test_sfs_and_standard_with_paypal_dedicated_cart",
            "TestSFSDoubleShipChargeLoggedOut › test_sfs_double_ship_charge_logged_out"
        ]);

        // Assertions per test
        expect(testFailures['Baseline Home Delivery Logged In › test_simple_home_delivery_promo_code_order_logged_in'])
        .toBe('test-home-delivery-promo-code-logged-in.spec.js:26:9 test_simple_home_delivery_promo_code_order_logged_in');

        expect(testFailures['TestBaselineISPULoggedIn › test_simple_ispu_order_logged_in'])
        .toBe('test-ispu-logged-in.spec.js:25:9 test_simple_ispu_order_logged_in');

        expect(testFailures['Baseline ISPU Logged Out › test_simple_ispu_order_logged_out'])
        .toBe('test-ispu-logged-out.spec.js:19:9 test_simple_ispu_order_logged_out');

        expect(testFailures['TestBaselineSFSLoggedOut › test_simple_sfs_order_logged_out'])
        .toBe('test-sfs-logged-out.spec.js:22:9 test_simple_sfs_order_logged_out');

        expect(testFailures['TestMultipleProductTypeShipmentIssues › test_CEVA_and_VERNON_shipments_fix_1'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-issues.spec.js:28:9 test_CEVA_and_VERNON_shipments_fix_1');

        expect(testFailures['TestMultipleProductTypeShipmentIssues › test_SFS_CEVA_VERNON_and_PREORDER_shipments_fix_2'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-issues.spec.js:56:9 test_SFS_CEVA_VERNON_and_PREORDER_shipments_fix_2');

        expect(testFailures['TestMultipleProductTypeShipmentIssues › test_multiple_product_type_shipment_issues_logged_out'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-issues.spec.js:89:9 test_multiple_product_type_shipment_issues_logged_out');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_SFS_and_VERNON_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:23:9 test_SFS_and_VERNON_shipments_regression');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_SFS_and_CEVA_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:52:9 test_SFS_and_CEVA_shipments_regression');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_SFS_and_PREORDER_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:81:9 test_SFS_and_PREORDER_shipments_regression');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_CEVA_and_PREORDER_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:105:9 test_CEVA_and_PREORDER_shipments_regression');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_SFS_CEVA_and_PREORDER_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:134:9 test_SFS_CEVA_and_PREORDER_shipments_regression');

        expect(testFailures['TestMultipleProductTypeShipmentRegression › test_SFS_VERNON_and_PREORDER_shipments_regression'])
        .toBe('test-vernon-ceva-preorder-sfs-shipment-regression.spec.js:174:9 test_SFS_VERNON_and_PREORDER_shipments_regression');

        expect(testFailures['TestUSispuCheckout › test_ispu_with_logout_and_login'])
        .toBe('test-ispu-with-login-and-logout.spec.js:23:5 test_ispu_with_logout_and_login');

        expect(testFailures['Test US SFS and Standard Item Checkout › test_sfs_and_standard_with_paypal_dedicated_cart'])
        .toBe('test-sfs-and-standard-with-paypal.spec.js:20:5 test_sfs_and_standard_with_paypal_dedicated_cart');

        expect(testFailures['TestSFSDoubleShipChargeLoggedOut › test_sfs_double_ship_charge_logged_out'])
        .toBe('test-sfs-double-ship-charge-logged-out.spec.js:24:9 test_sfs_double_ship_charge_logged_out');

        refLogger.info('Finished Error Report for Automation 2.0 node results');
    });
 });
