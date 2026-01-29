# Quick Start Guide - Accessibility Testing

## 🚀 Running Your First Test

```bash
# Run all accessibility tests
npm run test:a11y

# Run all tests
npm test

# Run with UI (interactive mode)
npm run test:ui
```

## 📝 Basic Test Template

Create a new test file in `tests/` directory:

```typescript
import { test, expect } from "@playwright/test";
import { runA11yTestAndGenerateReports, expectNoViolations } from "../utils/accessibility";

test("my accessibility test", async ({ page }) => {
  // 1. Navigate to your page
  await page.goto("https://example.com");

  // 2. Run accessibility test
  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "My Page Name",
    failOnViolations: false,
  });

  // 3. Check results
  const violationCount = expectNoViolations(results);
  expect(violationCount).toBe(0);
});
```

## 🎯 Common Use Cases

### 1. Test Your Local Development Server

```typescript
test("test localhost", async ({ page }) => {
  await page.goto("http://localhost:3000");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Local Dev Server",
  });

  const violations = expectNoViolations(results);
  expect(violations).toBe(0);
});
```

### 2. Test After User Interaction

```typescript
test("test modal accessibility", async ({ page }) => {
  await page.goto("https://example.com");
  
  // Open a modal
  await page.click('button[aria-label="Open modal"]');
  await page.waitForSelector('.modal[role="dialog"]');

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Modal Dialog",
    include: ['.modal'],
  });

  const violations = expectNoViolations(results);
  expect(violations).toBe(0);
});
```

### 3. Test Form Accessibility

```typescript
test("test form accessibility", async ({ page }) => {
  await page.goto("https://example.com/contact");

  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Contact Form",
    include: ['form'],
    tags: ["wcag2aa"], // Check WCAG 2.0 Level AA
  });

  const violations = expectNoViolations(results);
  expect(violations).toBe(0);
});
```

### 4. Test Multiple Pages in One Suite

```typescript
test.describe("Site-wide Accessibility", () => {
  const pages = [
    { url: "/", name: "Homepage" },
    { url: "/about", name: "About Page" },
    { url: "/contact", name: "Contact Page" },
  ];

  for (const { url, name } of pages) {
    test(`${name} should be accessible`, async ({ page }) => {
      await page.goto(`https://example.com${url}`);

      const results = await runA11yTestAndGenerateReports({
        page,
        pageDescription: name,
        failOnViolations: false,
      });

      const violations = expectNoViolations(results);
      expect(violations).toBe(0);
    });
  }
});
```

### 5. Test Authenticated Pages

```typescript
test("test dashboard accessibility", async ({ page }) => {
  // Login first
  await page.goto("https://example.com/login");
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Now test the authenticated page
  const results = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "User Dashboard",
  });

  const violations = expectNoViolations(results);
  expect(violations).toBe(0);
});
```

## 🔧 Configuration Options Cheat Sheet

```typescript
await runA11yTestAndGenerateReports({
  page,                           // Required: Playwright page
  pageDescription: "Page Name",   // Required: Test name
  
  // Scope
  include: ["#main", ".content"], // Only test these
  exclude: [".ads", "footer"],    // Skip these
  
  // Standards
  tags: ["wcag2aa"],              // Which standards to check
  
  // Behavior
  failOnViolations: true,         // Throw error on violations
  
  // Reports
  outputDir: "custom-reports",    // Where to save reports
  generateHtmlReport: true,       // HTML report (default: true)
  generateJsonReport: true,       // JSON report (default: true)
});
```

## 📊 Understanding Results

### Console Output

- ✅ **No violations**: `[ACCESSIBILITY] No accessibility violations found`
- ❌ **Violations found**: `[ACCESSIBILITY] violations:` followed by JSON details

### Reports Location

Reports are saved to `artifacts/accessibility/` (or your custom directory):

- `page-name-2026-01-28t20-30-45.html` - Visual HTML report
- `page-name-2026-01-28t20-30-45.json` - Raw data

## 🐛 Debugging Tips

### View tests in browser

```bash
npm run test:headed
```

### Interactive debug mode

```bash
npm run test:debug
```

### Add custom waits

```typescript
// Wait for specific element
await page.waitForSelector('.my-component');

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for custom condition
await page.waitForFunction(() => {
  return document.querySelector('.loading') === null;
});
```

### See what's happening

```typescript
// Take screenshots
await page.screenshot({ path: 'debug.png' });

// Log page content
console.log(await page.content());

// Pause execution
await page.pause(); // Opens Playwright Inspector
```

## 📖 WCAG Tags Reference

| Tag | Description |
|-----|-------------|
| `wcag2a` | WCAG 2.0 Level A (minimum) |
| `wcag2aa` | WCAG 2.0 Level AA (recommended) |
| `wcag21a` | WCAG 2.1 Level A |
| `wcag21aa` | WCAG 2.1 Level AA (current standard) |

**Recommended**: Use `["wcag2aa", "wcag21aa"]` for comprehensive testing.

## 🎓 Next Steps

1. **Run the example tests**: `npm run test:a11y`
2. **Create your first test**: Copy the basic template above
3. **Review generated reports**: Check `artifacts/accessibility/`
4. **Fix violations**: Update your code and re-run tests
5. **Integrate into CI/CD**: Add to your build pipeline

## 💡 Pro Tips

- Test early and often during development
- Test interactive states (hover, focus, active)
- Test with keyboard navigation
- Test on real devices when possible
- Don't disable rules without understanding them
- Review HTML reports for context and solutions

## 🆘 Need Help?

- Check the full [README.md](./README.md) for detailed documentation
- Review example tests in `tests/accessibility.spec.ts`
- Visit [Playwright docs](https://playwright.dev)
- Check [axe-core rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
