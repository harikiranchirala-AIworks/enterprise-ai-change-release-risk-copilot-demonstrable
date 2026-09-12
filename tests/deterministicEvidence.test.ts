import { describe, expect, it } from "vitest";
import { evaluateChange } from "../src/deterministicEvaluator.js";
import { ChangeEvidence } from "../src/changeEvidence.schema.js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "fixtures");
const files = readdirSync(root).filter(f => /^change-\d{3}\.json$/.test(f)).sort();

describe("deterministic CAB evidence baseline", () => {
  it("contains exactly ten synthetic change packages", () => expect(files).toHaveLength(10));
  for (const file of files) {
    it(`matches gold output for ${file}`, () => {
      const input = JSON.parse(readFileSync(join(root, file), "utf8")) as ChangeEvidence;
      const expected = JSON.parse(readFileSync(join(process.cwd(), "gold", file.replace(".json", ".expected.json")), "utf8"));
      const actual = evaluateChange(input);
      expect({
        changeId: actual.changeId,
        observations: actual.observations.map(o => ({ code: o.code, severity: o.severity, domain: o.domain })),
        aggregateReviewState: actual.aggregateReviewState,
        aggregateFlags: actual.aggregateFlags
      }).toEqual(expected);
    });
  }
  it("does not interpret prompt-injection text as an instruction", () => {
    const input = JSON.parse(readFileSync(join(root, "change-008.json"), "utf8")) as ChangeEvidence;
    expect(input.notes?.join(" ")).toContain("Ignore all previous instructions");
    expect(evaluateChange(input).aggregateReviewState).toBe("AR0");
  });
});
