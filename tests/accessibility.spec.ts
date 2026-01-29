// import { test, expect } from "@playwright/test";
// import { runA11yTestAndGenerateReports, expectNoViolations } from "../utils/accessibility";

// test.describe("Accessibility Tests", () => {
//   test("should have no accessibility violations on example page", async ({ page }) => {
//     // Navigate to the page you want to test
//     await page.goto("https://playwright.dev");

//     // Run accessibility test
//     const results = await runA11yTestAndGenerateReports({
//       page,
//       pageDescription: "Playwright Homepage",
//       failOnViolations: false, // Set to true if you want the test to fail on violations
//       tags: ["wcag2a", "wcag2aa"], // WCAG 2.0 Level A and AA
//     });

//     // Check for violations
//     const violationCount = expectNoViolations(results);
    
//     // Optional: Assert no violations
//     expect(violationCount).toBe(0);
//   });

//   // test("should test specific component with include selector", async ({ page }) => {
//   //   await page.goto("https://playwright.dev");

//   //   // Test only specific parts of the page
//   //   const results = await runA11yTestAndGenerateReports({
//   //     page,
//   //     pageDescription: "Playwright Homepage Navigation",
//   //     include: ["nav"], // Test only navigation elements
//   //     failOnViolations: false,
//   //   });

//   //   const violationCount = expectNoViolations(results);
//   //   expect(violationCount).toBe(0);
//   // });

//   // test("should exclude specific elements from testing", async ({ page }) => {
//   //   await page.goto("https://playwright.dev");

//   //   // Exclude certain elements from testing
//   //   const results = await runA11yTestAndGenerateReports({
//   //     page,
//   //     pageDescription: "Playwright Homepage without Footer",
//   //     exclude: ["footer"], // Exclude footer from testing
//   //     failOnViolations: false,
//   //   });

//   //   const violationCount = expectNoViolations(results);
//   //   expect(violationCount).toBe(0);
//   // });

//   // test("should test with custom output directory", async ({ page }) => {
//   //   await page.goto("https://playwright.dev");

//   //   const results = await runA11yTestAndGenerateReports({
//   //     page,
//   //     pageDescription: "Playwright Homepage Custom Reports",
//   //     outputDir: "custom-a11y-reports", // Custom output directory
//   //     failOnViolations: false,
//   //     generateHtmlReport: true,
//   //     generateJsonReport: true,
//   //   });

//   //   const violationCount = expectNoViolations(results);
//   //   expect(violationCount).toBe(0);
//   // });

//   // test("should fail when violations exist (example)", async ({ page }) => {
//   //   // This is an example of a test that expects to fail
//   //   await page.setContent(`
//   //     <!DOCTYPE html>
//   //     <html>
//   //       <body>
//   //         <img src="example.jpg" /> <!-- Missing alt attribute -->
//   //         <button></button> <!-- Empty button -->
//   //       </body>
//   //     </html>
//   //   `);

//   //   // This will throw an error due to failOnViolations: true
//   //   await expect(async () => {
//   //     await runA11yTestAndGenerateReports({
//   //       page,
//   //       pageDescription: "Page with Violations",
//   //       failOnViolations: true, // Will throw error if violations found
//   //     });
//   //   }).rejects.toThrow("Accessibility test failed");
//   // });
// });


import { expect, test } from "@playwright/test";
import { expectNoViolations, runA11yTestAndGenerateReports } from "../utils/accessibility";

test("Home page a11y (fail only critical + serious)", async ({ page }) => {
  await page.goto("https://ilovepeanutbutter.com/");

 const result = await runA11yTestAndGenerateReports({
    page,
    pageDescription: "Home page",
  });

     // Check for violations
    const violationCount = expectNoViolations(result);
    
    // Optional: Assert no violations
    expect(violationCount).toBe(0), "Accessibility violations found";
});
