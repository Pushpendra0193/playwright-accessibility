import fs from "node:fs/promises";
import path from "node:path";
import { Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";
import type { AxeResults, RunOptions } from "axe-core";

export type A11yTag = "wcag2a" | "wcag2aa" | "wcag21a" | "wcag21aa";

export type RunA11yOptions = {
  page: Page;
  pageDescription: string;

  include?: string[];
  exclude?: string[];

  tags?: A11yTag[];
  rules?: RunOptions["rules"];

  failOnViolations?: boolean;

  // Reports
  outputDir?: string;
  reporterOptions?: Record<string, unknown>;
  generateHtmlReport?: boolean;
  generateJsonReport?: boolean;
};

const DEFAULT_TAGS: A11yTag[] = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// ---------------- helpers ----------------

function validatePageDescription(value: unknown): asserts value is string {
  if (!value || typeof value !== "string") {
    throw new Error("pageDescription is required and must be a string");
  }
}

function getArtifactsDir(outputDir?: string): string {
  return path.join(process.cwd(), outputDir ?? "artifacts/accessibility");
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function reportBaseName(pageDescription: string): string {
  const normalized = pageDescription
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${normalized}-${ts}`;
}

// ---------------- core ----------------

async function runAxe(
  page: Page,
  options: {
    include?: string[];
    exclude?: string[];
    tags?: A11yTag[];
    rules?: RunOptions["rules"];
  }
): Promise<AxeResults> {
  let builder = new AxeBuilder({ page });

  if (options.include?.length) {
    options.include.forEach((selector) => builder = builder.include(selector));
  }

  if (options.exclude?.length) {
    options.exclude.forEach((selector) => builder = builder.exclude(selector));
  }

  if (options.rules) {
    // Configure individual rule settings
    Object.entries(options.rules).forEach(([ruleId, ruleConfig]) => {
      if (typeof ruleConfig === 'object' && ruleConfig?.enabled === false) {
        builder = builder.disableRules([ruleId]);
      }
    });
  }

  builder = builder.withTags(options.tags ?? DEFAULT_TAGS);

  return await builder.analyze();
}

// ---------------- reports ----------------

async function writeJsonReport(
  dir: string,
  baseName: string,
  results: AxeResults
): Promise<string> {
  const jsonPath = path.join(dir, `${baseName}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), "utf8");
  return jsonPath;
}

function writeHtmlReport(
  dir: string,
  baseName: string,
  pageDescription: string,
  results: AxeResults,
  reporterOptions?: Record<string, unknown>
): string {
  createHtmlReport({
    results,
    options: {
      projectKey: pageDescription,
      reportFileName: `${baseName}.html`,
      outputDirPath: dir,
      outputDir: ".",
      ...reporterOptions,
    },
  });

  return path.join(dir, `${baseName}.html`);
}

// ---------------- public API ----------------

/**
 * Runs accessibility tests on a page using axe-core and generates reports.
 * 
 * @param opts - Configuration options for the accessibility test
 * @param opts.page - Playwright page object to test
 * @param opts.pageDescription - Description of the page being tested (used in reports)
 * @param opts.include - CSS selectors to include in the scan
 * @param opts.exclude - CSS selectors to exclude from the scan
 * @param opts.tags - WCAG tags to test against (defaults to wcag2a, wcag2aa, wcag21a, wcag21aa)
 * @param opts.rules - Custom rule configurations
 * @param opts.failOnViolations - Whether to throw an error when violations are found (default: false)
 * @param opts.outputDir - Directory for reports (default: "artifacts/accessibility")
 * @param opts.generateHtmlReport - Generate HTML report (default: true, only when violations exist)
 * @param opts.generateJsonReport - Generate JSON report (default: true, only when violations exist)
 * @param opts.reporterOptions - Additional options for the HTML reporter
 * 
 * @returns AxeResults object containing test results
 * @throws Error if failOnViolations is true and violations are found
 */
export async function runA11yTestAndGenerateReports(
  opts: RunA11yOptions
): Promise<AxeResults> {
  validatePageDescription(opts.pageDescription);

  const dir = getArtifactsDir(opts.outputDir);
  await ensureDir(dir);

  const results = await runAxe(opts.page, {
    include: opts.include,
    exclude: opts.exclude,
    tags: opts.tags,
    rules: opts.rules,
  });

  const violations = results.violations.length;

  let htmlPath: string | null = null;
  let jsonPath: string | null = null;

  // Same behavior as your WDIO code
  if (violations > 0) {
    const base = reportBaseName(opts.pageDescription);

    if (opts.generateHtmlReport !== false) {
      htmlPath = writeHtmlReport(
        dir,
        base,
        opts.pageDescription,
        results,
        opts.reporterOptions
      );
    }

    if (opts.generateJsonReport !== false) {
      jsonPath = await writeJsonReport(dir, base, results);
    }
  }

  if (opts.failOnViolations && violations > 0) {
    throw new Error(
      [
        "Accessibility test failed.",
        `Found ${violations} violation(s) on ${opts.pageDescription}.`,
        results.url ? `testUrl: ${results.url}` : "",
        htmlPath ? `HTML report: ${htmlPath}` : "",
        jsonPath ? `JSON report: ${jsonPath}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return results;
}

/**
 * Helper function to check and log accessibility violations.
 * 
 * @param results - AxeResults object from runA11yTestAndGenerateReports
 * @returns The number of violations found
 */
export function expectNoViolations(results: AxeResults): number {
  const violations = results.violations.length;
  
  if (violations > 0) {
    console.log(`\n⚠️  Found ${violations} accessibility violation(s):\n`);
    results.violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Affected nodes: ${violation.nodes.length}\n`);
    });
  } else {
    console.log("✓ No accessibility violations found");
  }
  
  return violations;
}
