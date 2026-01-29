# Playwright Accessibility Testing

This project provides a comprehensive accessibility testing framework using Playwright and axe-core.

## Features

- ✅ Automated accessibility testing with axe-core
- ✅ WCAG 2.0 and WCAG 2.1 compliance checking (Level A and AA)
- ✅ HTML and JSON report generation
- ✅ Include/exclude specific page elements
- ✅ Customizable test rules and options
- ✅ Detailed violation reports with error details

## Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install --save-dev @playwright/test axe-core axe-html-reporter @types/node
```

## Project Structure

```
playwrightAccessibility/
├── utils/
│   └── accessibility.ts       # Accessibility testing utilities
├── tests/
│   ├── example.spec.ts        # Example Playwright tests
│   └── accessibility.spec.ts  # Example accessibility tests
├── artifacts/
│   └── accessibility/         # Default output directory for reports
├── playwright.config.ts       # Playwright configuration
└── package.json
```

## Usage

### Basic Accessibility Test

```typescript
import { test, expect } from "@playwright/test";
import { runA11yTestAndGenerateReports, expectNoViolations } from "../utils/accessibility";

test("should have no accessibility violations", async ({ page }) => {
  await page.goto("https://example.com");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Example Page",
    failOnViolations: false,
  });

  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

### Test Specific Components

```typescript
test("should test navigation accessibility", async ({ page }) => {
  await page.goto("https://example.com");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Navigation Component",
    include: ["nav", ".header"], // Test only these selectors
    failOnViolations: false,
  });

  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

### Exclude Elements from Testing

```typescript
test("should exclude footer from testing", async ({ page }) => {
  await page.goto("https://example.com");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Page without Footer",
    exclude: ["footer", ".advertisement"], // Skip these elements
    failOnViolations: false,
  });

  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

### Custom WCAG Tags

```typescript
test("should test WCAG 2.1 Level AA compliance", async ({ page }) => {
  await page.goto("https://example.com");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "WCAG 2.1 AA Test",
    tags: ["wcag21aa"], // Test only WCAG 2.1 Level AA
    failOnViolations: false,
  });

  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

### Custom Output Directory

```typescript
test("should save reports to custom directory", async ({ page }) => {
  await page.goto("https://example.com");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Custom Reports",
    outputDir: "custom-a11y-reports",
    generateHtmlReport: true,
    generateJsonReport: true,
    failOnViolations: false,
  });

  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

### Fail on Violations

```typescript
test("should fail when violations are found", async ({ page }) => {
  await page.goto("https://example.com");

  // This will throw an error if violations are found
  await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Strict Accessibility Test",
    failOnViolations: true, // Test will fail if violations found
  });
});
```

## API Reference

### `runA11yTestAndGenerateReports(options: RunA11yOptions): Promise<AxeResults>`

Main function to run accessibility tests and generate reports.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `page` | `Page` | **required** | Playwright page object |
| `pageDescription` | `string` | **required** | Description of the page being tested |
| `include` | `string[]` | `[]` | CSS selectors to include in testing |
| `exclude` | `string[]` | `[]` | CSS selectors to exclude from testing |
| `tags` | `A11yTag[]` | `["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]` | WCAG tags to test |
| `rules` | `RunOptions["rules"]` | `undefined` | Axe rule overrides |
| `runOptions` | `RunOptions` | `undefined` | Additional axe run options |
| `failOnViolations` | `boolean` | `false` | Whether to throw error on violations |
| `outputDir` | `string` | `"artifacts/accessibility"` | Output directory for reports |
| `reporterOptions` | `Record<string, unknown>` | `{}` | axe-html-reporter options |
| `generateHtmlReport` | `boolean` | `true` | Generate HTML report |
| `generateJsonReport` | `boolean` | `true` | Generate JSON report |

#### Available WCAG Tags

- `wcag2a` - WCAG 2.0 Level A
- `wcag2aa` - WCAG 2.0 Level AA
- `wcag21a` - WCAG 2.1 Level A
- `wcag21aa` - WCAG 2.1 Level AA

### `expectNoViolations(results: AxeResults, message?: string): number`

Utility function to check for violations and log results.

**Returns:** Number of violations found

### `runAxeTest(params): Promise<AxeResults>`

Lower-level function to run axe tests without generating reports.

## Reports

When violations are found, reports are generated in the specified output directory (default: `artifacts/accessibility/`):

- **HTML Report**: Interactive HTML report with detailed violation information
- **JSON Report**: Raw JSON data of all violations

Report filenames include:
- Normalized page description
- Timestamp
- Extension (`.html` or `.json`)

Example: `example-page-2026-01-28t20-30-45-123z.html`

## Running Tests

```bash
# Run all tests
npx playwright test

# Run only accessibility tests
npx playwright test tests/accessibility.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with headed browser
npx playwright test --headed

# View test report
npx playwright show-report
```

## Continuous Integration

In CI environments, you can set `failOnViolations: true` to fail builds when accessibility issues are detected:

```typescript
const results = await runA11yTestAndGenerateReports({
  page,
  pageDescription: "Production Page",
  failOnViolations: process.env.CI === "true",
});
```

## Best Practices

1. **Test Early and Often**: Integrate accessibility tests into your development workflow
2. **Test Real Content**: Test with actual page content, not lorem ipsum
3. **Test Interactive States**: Test modals, dropdowns, and dynamic content
4. **Review Reports**: Don't just rely on pass/fail - review the reports for context
5. **Fix Issues Incrementally**: Start with critical issues (Level A) before moving to AA
6. **Test Across Browsers**: Run tests on multiple browsers to catch browser-specific issues

## Troubleshooting

### Tests timing out

If tests timeout, try increasing the timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Axe not loading

Ensure the page has fully loaded before running tests. The utility includes built-in waits, but you may need to add custom waits for dynamic content:

```typescript
await page.goto("https://example.com");
await page.waitForLoadState("networkidle");

const results = await runA11yTestAndGenerateReports({
  page,
  pageDescription: "Page",
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/)

## License

ISC
