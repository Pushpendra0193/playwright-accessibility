import fs from "node:fs/promises";
import path from "node:path";
import { Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";
import type { AxeResults } from "axe-core";

// ---------------- Types ----------------

/**
 * Supported WCAG conformance levels for accessibility testing
 */
export type A11yTag = "wcag2a" | "wcag2aa" | "wcag21a" | "wcag21aa";

/**
 * Severity levels for accessibility violations
 */
export type A11yFailImpact = "minor" | "moderate" | "serious" | "critical";

/**
 * Configuration options for running accessibility tests
 */
export interface RunA11yOptions {
  /** Playwright page instance to test */
  page: Page;
  
  /** Human-readable description of the page being tested (used for reporting) */
  pageDescription: string;

  /** CSS selectors to include in the test (test only these elements) */
  include?: string[];
  
  /** CSS selectors to exclude from the test (skip these elements) */
  exclude?: string[];

  /** WCAG conformance levels to test against (defaults to WCAG 2.0 and 2.1 A and AA) */
  tags?: A11yTag[];

  /**
   * Rule IDs to disable during testing
   * @example ["color-contrast", "region"]
   */
  disableRules?: string[];

  /**
   * Whether to throw an error when violations are found
   * @default false
   */
  failOnViolations?: boolean;
  
  /**
   * Impact levels that should cause test failure (when failOnViolations is true)
   * @default ["critical", "serious", "moderate", "minor"] (all impacts)
   */
  failImpacts?: A11yFailImpact[];

  // Report Configuration
  
  /** Directory for report output (relative to project root) */
  outputDir?: string; // default artifacts/accessibility
  
  /** Additional options to pass to the HTML reporter */
  reporterOptions?: Record<string, unknown>;
  
  /** Whether to generate HTML report (only generated if violations exist) */
  generateHtmlReport?: boolean; // default true
  
  /** Whether to generate JSON report (only generated if violations exist) */
  generateJsonReport?: boolean; // default true

  /**
   * Whether to log a summary to console
   * @default true
   */
  logSummary?: boolean;
}

const DEFAULT_TAGS: A11yTag[] = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const DEFAULT_FAIL_IMPACTS: A11yFailImpact[] = ["critical", "serious", "moderate", "minor"];
const DEFAULT_OUTPUT_DIR = "artifacts/accessibility";

// ---------------- Helpers ----------------

/**
 * Validates that pageDescription is a non-empty string
 */
function validatePageDescription(value: unknown): asserts value is string {
  if (!value || typeof value !== "string") {
    throw new Error("pageDescription is required and must be a non-empty string");
  }
}

/**
 * Gets the full path to the artifacts directory
 */
function getArtifactsDir(outputDir?: string): string {
  return path.join(process.cwd(), outputDir ?? DEFAULT_OUTPUT_DIR);
}

/**
 * Ensures a directory exists, creating it recursively if needed
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Generates a safe filename from page description with timestamp
 * @param pageDescription - Human-readable page name
 * @returns Normalized filename with ISO timestamp
 */
function reportBaseName(pageDescription: string): string {
  // Convert to lowercase and replace spaces with hyphens
  // Remove all characters except alphanumeric, underscore, and hyphen
  const normalized = pageDescription
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");

  // Create filename-safe timestamp
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${normalized}-${ts}`;
}

/**
 * Counts violations by impact level
 */
function countByImpact(results: AxeResults): Record<A11yFailImpact, number> {
  const counts: Record<A11yFailImpact, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  for (const violation of results.violations ?? []) {
    if (!violation.impact) continue;
    if (violation.impact in counts) {
      counts[violation.impact as A11yFailImpact] += 1;
    }
  }
  return counts;
}

/**
 * Filters violations to only those matching specified impact levels
 * Returns an empty array if no impacts are specified or no violations match
 */
function filterViolationsByImpact(results: AxeResults, impacts: A11yFailImpact[]): NonNullable<AxeResults["violations"]> {
  if (!impacts.length) {
    return [];
  }
  const impactSet = new Set(impacts);
  return (results.violations ?? []).filter((violation) => violation.impact && impactSet.has(violation.impact as A11yFailImpact));
}

/**
 * Validates that failImpacts array contains valid impact levels
 */
function validateFailImpacts(impacts: A11yFailImpact[]): void {
  if (!Array.isArray(impacts)) {
    throw new Error("failImpacts must be an array");
  }
  
  const validImpacts: A11yFailImpact[] = ["critical", "serious", "moderate", "minor"];
  const invalidImpacts = impacts.filter(impact => !validImpacts.includes(impact));
  
  if (invalidImpacts.length > 0) {
    throw new Error(`Invalid impact levels: ${invalidImpacts.join(", ")}. Valid values are: ${validImpacts.join(", ")}`);
  }
}

// ---------------- Core runner ----------------

/**
 * Configures and runs an axe accessibility scan on the provided page
 */
async function runAxeScan(opts: {
  page: Page;
  include?: string[];
  exclude?: string[];
  tags?: A11yTag[];
  disableRules?: string[];
}): Promise<AxeResults> {
  let builder = new AxeBuilder({ page: opts.page });

  if (opts.include?.length) {
    for (const selector of opts.include) builder = builder.include(selector);
  }

  if (opts.exclude?.length) {
    for (const selector of opts.exclude) builder = builder.exclude(selector);
  }

  if (opts.disableRules?.length) {
    builder = builder.disableRules(opts.disableRules);
  }

  builder = builder.withTags(opts.tags ?? DEFAULT_TAGS);

  return await builder.analyze();
}

// ---------------- Reports ----------------

/**
 * Writes accessibility scan results to a JSON file
 */
async function writeJsonReport(dir: string, baseName: string, results: AxeResults): Promise<string> {
  try {
    const jsonPath = path.join(dir, `${baseName}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), "utf8");
    return jsonPath;
  } catch (error) {
    throw new Error(`Failed to write JSON report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates an HTML report from accessibility scan results
 */
async function writeHtmlReport(
  dir: string,
  baseName: string,
  pageDescription: string,
  results: AxeResults,
  reporterOptions?: Record<string, unknown>
): Promise<string> {
  try {
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
  } catch (error) {
    throw new Error(`Failed to generate HTML report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ---------------- Public API ----------------

/**
 * Runs accessibility tests on a page and generates reports
 */
export async function runA11yTestAndGenerateReports(opts: RunA11yOptions): Promise<AxeResults> {
  validatePageDescription(opts.pageDescription);

  const dir = getArtifactsDir(opts.outputDir);
  await ensureDir(dir);

  const results = await runAxeScan({
    page: opts.page,
    include: opts.include,
    exclude: opts.exclude,
    tags: opts.tags,
    disableRules: opts.disableRules,
  });

  const totalViolations = results.violations?.length ?? 0;
  const counts = countByImpact(results);

  // Optional console summary
  if (opts.logSummary !== false) {
    // eslint-disable-next-line no-console
    console.log(
      `[A11Y] ${opts.pageDescription} -> total=${totalViolations} (critical=${counts.critical}, serious=${counts.serious}, moderate=${counts.moderate}, minor=${counts.minor})`
    );
  }

  let htmlPath: string | null = null;
  let jsonPath: string | null = null;

  if (totalViolations > 0) {
    const base = reportBaseName(opts.pageDescription);

    if (opts.generateHtmlReport !== false) {
      htmlPath = await writeHtmlReport(dir, base, opts.pageDescription, results, opts.reporterOptions);
    }

    if (opts.generateJsonReport !== false) {
      jsonPath = await writeJsonReport(dir, base, results);
    }
  }

  // Fail logic (optionally only for selected impacts)
  const failImpacts = opts.failImpacts ?? DEFAULT_FAIL_IMPACTS;
  validateFailImpacts(failImpacts);

  if (opts.failOnViolations) {
    const failingViolations = filterViolationsByImpact(results, failImpacts);
    if (failingViolations.length > 0) {
      // Create a summary of violations instead of full JSON dump
      const violationSummary = failingViolations
        .map((v, idx) => `  ${idx + 1}. [${v.impact}] ${v.id}: ${v.description}\n     Nodes affected: ${v.nodes.length}\n     Help: ${v.helpUrl}`)
        .join("\n");

      throw new Error(
        [
          "Accessibility test failed.",
          `Page: ${opts.pageDescription}`,
          results.url ? `URL: ${results.url}` : "",
          `Fail impacts: ${failImpacts.join(", ")}`,
          `Totals: total=${totalViolations}, critical=${counts.critical}, serious=${counts.serious}, moderate=${counts.moderate}, minor=${counts.minor}`,
          htmlPath ? `HTML report: ${htmlPath}` : "",
          jsonPath ? `JSON report: ${jsonPath}` : "",
          `\nFailing violations (${failingViolations.length}):\n${violationSummary}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
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
  const violations = results.violations?.length ?? 0;
  
  if (violations > 0) {
    console.log(`\n⚠️  Found ${violations} accessibility violation(s):\n`);
    results.violations?.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Affected nodes: ${violation.nodes.length}\n`);
    });
  } else {
    console.log("✓ No accessibility violations found");
  }
  
  return violations;
}
