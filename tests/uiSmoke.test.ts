import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync(join(process.cwd(), "ui/index.html"), "utf8");
describe("operator UI accessibility and authority smoke", () => {
  it("uses semantic headings, labels, status regions, and keyboard buttons", () => { expect(html).toContain('lang="en"'); expect(html).toContain('aria-labelledby="page-title"'); expect(html).toContain('aria-live="polite"'); expect(html).toContain('for="reviewer-note"'); expect(html).toContain('for="edit-target"'); expect(html).toContain('id="missing-evidence"'); expect(html).toContain('id="cab-questions"'); expect(html).toContain('id="recommendations"'); expect(html).toContain("Retry / re-analyze"); expect(html).toContain("<button"); });
  it("exposes the human authority boundary", () => { expect(html).toContain("Decision Support Only"); expect(html).toContain("does not approve the change"); expect(html).not.toMatch(/Approve change|Reject change/); });
});
