class SlackErrorReport {
    static FAILURE_HEADER_TEXT = "Green Automation 2.0 - FAILURE";
    static CONTEXT_TEXT = "This round of automated testing was kicked off by GitHub Action [ run-green-automated-node-tests.yml ] on the JS-QA-AUTOMATION repository.";

    formatErrorReport(results, headerNameValuePairs, reportDownloadUrl) {
        return {
            text: "This is a fallback message for clients that do not support Block Kit.",
            blocks: [
                this.buildHeaderBlock(),
                this.buildSectionBlock(this.buildErrorHeaderText(headerNameValuePairs), "section-1"),
                this.buildDivider(),
                this.buildSectionBlock(this.buildSummaryText(results), "section-2"),
                this.buildDivider(),
                this.buildSectionBlock(this.buildFailedTestList(results['test-failures']), "section-3"),
                this.buildDivider(),
                this.buildSectionBlock(this.buildErrorReportLink(reportDownloadUrl), "section-4"),
                this.buildContextBlock(SlackErrorReport.CONTEXT_TEXT)
            ]
        };
    }

    buildHeaderBlock() {
        return {
            type: "header",
            text: {
                type: "plain_text",
                text: SlackErrorReport.FAILURE_HEADER_TEXT
            }
        };
    }

    buildSectionBlock(text, block_id) {
        return {
            type: "section",
            block_id,
            text: {
                type: "mrkdwn",
                text
            }
        };
    }

    buildDivider() {
        return { type: "divider" };
    }

    buildContextBlock(text) {
        return {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text
                }
            ]
        };
    }

    buildErrorHeaderText(headerNameValuePairs) {
        let headerText = `*Hello, Green Refs!* :wave:\n\nAutomated Tests:`;
        
        headerNameValuePairs.forEach((value, key) => {
            headerText += `\n• *${key}*: [${value}]`;
        });
        
        headerText += '\n\n⚠️ *Completed with errors.*';
        return headerText;
    }

    buildSummaryText(results) {
        return (
            `*Error Report Summary:*\n` +
            `• Total: ${results.total}\n` +
            `• Passed: ${results.passed}\n` +
            `• Failed: ${results.failed}\n` +
            `• Skipped: ${results.skipped}\n` +
            `• Errors: ${results.errors}\n` +
            `• Rerun: ${results.rerun}\n` +
            `• Executed: ${results.executed}`
        );
    }

    buildFailedTestList(failedTestMap) {
        if (!failedTestMap || Object.keys(failedTestMap).length === 0) {
            return "*Failed Test List:*\n\n-- None Specified --";
        }

        const tests = Object.keys(failedTestMap)
            .map((name, idx) => `${idx + 1}.) ${name}`)
            .join("\n");

        return `*Failed Test List:*\n\n${tests}`;
    }

    buildErrorReportLink(reportDownloadUrl) {
        return reportDownloadUrl
            ? `📄 *Download the full error report:*\n<${reportDownloadUrl}|Click to view>`
            : "No error report available.";
    }
}

module.exports = SlackErrorReport;