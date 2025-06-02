const http = require('http');

const metadataUrl = 'http://localhost:3000/api/auth/saml/metadata';
let testFailed = false;

function reportResult(testName, success, message) {
    if (success) {
        console.log(`✅ PASSED: ${testName}`);
    } else {
        console.error(`❌ FAILED: ${testName} - ${message}`);
        testFailed = true;
    }
}

console.log(`Starting SAML metadata test against: ${metadataUrl}`);

const req = http.get(metadataUrl, (res) => {
    // 1. Validate status code
    reportResult(
        "Status code is 200",
        res.statusCode === 200,
        `Expected 200, got ${res.statusCode}`
    );

    // 2. Validate Content-Type header
    const contentType = res.headers['content-type'];
    const isValidContentType = contentType && (contentType.includes('application/xml') || contentType.includes('text/xml'));
    reportResult(
        "Content-Type header is application/xml or text/xml",
        isValidContentType,
        `Expected application/xml or text/xml, got ${contentType}`
    );

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            // 3. Validate XML content (basic checks)
            const bodyContainsEntityDescriptor = body.includes('<md:EntityDescriptor') || body.includes('<EntityDescriptor');
            reportResult(
                "Response body contains <EntityDescriptor>",
                bodyContainsEntityDescriptor,
                "Missing <EntityDescriptor> tag in response body."
            );

            const bodyContainsSPSSODescriptor = body.includes('<md:SPSSODescriptor') || body.includes('<SPSSODescriptor');
            reportResult(
                "Response body contains <SPSSODescriptor>",
                bodyContainsSPSSODescriptor,
                "Missing <SPSSODescriptor> tag in response body."
            );

            // A more robust XML validation would require an XML parsing library,
            // but for a basic test, string includes is a start.
            if (!bodyContainsEntityDescriptor || !bodyContainsSPSSODescriptor) {
                console.log("Full response body for inspection:\n", body.substring(0, 1000) + (body.length > 1000 ? "..." : ""));
            }

        } else {
            console.error("Skipping content validation due to non-200 status code.");
        }

        if (testFailed) {
            console.error("\nSAML Metadata Test Suite: At least one test FAILED.");
            process.exit(1);
        } else {
            console.log("\nSAML Metadata Test Suite: All tests PASSED.");
            process.exit(0);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ FAILED: HTTP request failed - ${e.message}`);
    console.error("Ensure the Next.js development server is running ('npm run dev' in 'my-next-app').");
    process.exit(1);
});

req.end();
