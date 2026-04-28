class SlackSuccessReport {
    static SUCCESS_HEADER_TEXT = "Green Automation 2.0 - SUCCESS";
    static CONTEXT_TEXT = "This round of automated testing was kicked off by GitHub Action [ run-green-automated-node-tests.yml ] on the JS-QA-AUTOMATION repository.";

    formatSuccessMessage(results, headerNameValuePairs, reportDownloadUrl) {

        return {
            text: "This is a fallback message for clients that do not support Block Kit.",
            blocks: [
                this.buildHeaderBlock(),
                this.buildSectionBlock(this.buildHeaderText(headerNameValuePairs), "section-1"),
                this.buildDivider(),
                this.buildSectionBlock(this.buildTestDataText(results), "section-2"),
                this.buildDivider(),
                this.buildSectionBlock(this.buildReportLinkText(reportDownloadUrl), "section-3"),
                this.buildContextBlock(SlackSuccessReport.CONTEXT_TEXT)
            ]
        };
    }

    buildHeaderBlock() {
        return {
            type: "header",
            text: {
                type: "plain_text",
                text: SlackSuccessReport.SUCCESS_HEADER_TEXT
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

    buildHeaderText(headerNameValuePairs) {

        let headerText = `*Hello, Green Refs!* :wave:\n\nAutomated Tests:`;
        
            headerNameValuePairs.forEach((value, key) => {
            headerText += `\n• *${key}*: [${value}]`;
            console.log(`${key}: ${value}`);

        });

        headerText += '\n\n✅ *All tests passed with NO errors.*\n\nNo further action is required.';

        return headerText;
    }

    buildTestDataText(results) {
        let successText = `*Test Results Summary:*\n\n• Total Successful Tests: *${results.passed}*`;

        // Only include skipped tests if total ≠ passed AND skipped > 0
        if (results.total !== results.passed && results.skipped > 0) {
            successText += `\n*Total Skipped Tests: *${results.skipped}*`;
        }

        return successText;
    }


    buildReportLinkText(reportDownloadUrl) {
        return `📄 *Download the test report:*\n<${reportDownloadUrl}|Click here to view the report>`;
    }
}

module.exports = SlackSuccessReport;