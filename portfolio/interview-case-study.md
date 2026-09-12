# Interview case study

## Situation

Enterprise change governance teams need fast first-pass review, but incomplete rollback plans, weak validation, undocumented dependencies, and historical incidents can make CAB preparation inconsistent.

## Task

Design a decision-support copilot that improves evidence coverage without allowing an AI model to become the change approver.

## Actions

I built the project in gated stages. I started with a normalized evidence schema and deterministic E0–E3 rules, then added AR0–AR3 aggregate review logic. I added explainable historical retrieval with scoring, thresholds, top-k limits, and near-duplicate suppression. Only after those controls passed did I add bounded structured synthesis. A grounding validator rejects unknown evidence IDs, unsupported claims, malformed output, and approval/rejection language. Finally, I added a reviewer workflow with explicit stale-package and provider-failure states.

## Results

The 18-scenario evaluation achieved 100% groundedness, 100% critical-gap recall, 0% unsupported-risk false positives, 100% retrieval relevance, and 5/5 adversarial scenario passes. The project has 48/48 automated tests passing. CAB usefulness scored 4.33/5 in scenario-based internal UAT.

## Lesson

The central design decision was to separate deterministic controls, retrieval, probabilistic synthesis, and human authority. The LLM can explain and organize supplied evidence, but it cannot create facts, set the final risk decision, or approve/reject a change.
