# Week 1 Research: TDD for AI-Assisted CLI Development

**Author:** Sample (filled by mentor/AI as a reference — do not submit as-is)
**Date:** 2026-08-04
**Status:** Example / Reference only

> This is a **worked example** showing the depth and format expected. Use [research-template.md](./research-template.md) for your own submission — don't copy this content directly, write it in your own words based on your own research.

---

## 1. Core Principles of TDD

**What is TDD?**

> Test-Driven Development is a workflow where you write a failing test *before* writing the implementation that makes it pass. The test defines the expected behavior first, so the code is written to satisfy a known, checkable requirement instead of "what the developer thinks should work." This matters even more with AI-generated code — the test is the objective spec the AI's output must satisfy, not just a suggestion to trust.

**Red → Green → Refactor**

| Step | What happens | Why it matters |
|---|---|---|
| Red | Write a test for behavior that doesn't exist yet; run it and watch it fail | Proves the test actually exercises something real, and pins down the requirement precisely before any implementation exists |
| Green | Write the minimum code needed to make the test pass — no more | Keeps scope tight; prevents over-building; gives a fast feedback loop (seconds, not hours) |
| Refactor | Clean up the implementation (naming, duplication, structure) while tests stay green | Improves code quality without risking behavior — the test suite is the safety net that proves nothing broke |

---

## 2. Testing Levels

| Level | Definition | What it covers | Example in a Ticket Manager CLI | Speed / Cost |
|---|---|---|---|---|
| Unit test | Tests a single function/class in isolation, no I/O | Business logic, validation rules | `validateTicketStatus("done")` throws for an invalid status like `"archivedd"` | Fastest, cheapest — run on every save |
| Integration test | Tests multiple units working together, often with real I/O (file system, DB) | Interaction between layers (service ↔ storage) | `ticketService.create(...)` actually writes a correct JSON record to `tickets.json` | Slower — run before commit/push |
| End-to-end test | Tests the full flow as a user would experience it | CLI invocation → output/exit code | Running `tickets create --title "Bug" --priority high` from the shell and asserting stdout + exit code 0 | Slowest — run in CI before merge |

---

## 3. AI Validation: How Tests Verify AI-Generated Code

**Why tests matter when code comes from AI:**

> AI can produce code that looks correct, compiles, and reads fluently, while still being subtly wrong (off-by-one, wrong edge case, silently swallowed error). A test suite written independently of the implementation — ideally written *before* asking the AI to implement — acts as an objective check. If the AI-generated code passes tests that already encode the real requirements (not tests the AI wrote for itself), that's actual evidence of correctness, not just plausibility.

**Worked example:**

- AI-generated code/function: a `filterTickets(tickets, { status, priority })` function generated to filter the ticket list by status and priority.
- Test written before/after: written **before**, asserting that when `priority` is omitted, all priorities are returned, and when a ticket has `status: undefined` (legacy/corrupted record), it is excluded rather than crashing.
- Bug or issue the test caught: the first AI-generated version threw a `TypeError` when a ticket had no `status` field (assumed the field always exists) — the test with a malformed record caught this before it reached the CLI layer.

---

## 4. CLI Test Checklist — Ticket Manager CLI

| Area | What to test | Example test case |
|---|---|---|
| Commands | `create`, `list`, `show`, `update` behave as expected | `tickets create --title "Login bug"` creates a ticket with a generated id and `status: "open"` by default |
| Validation | Invalid/missing input rejected with clear error | `tickets create` with no `--title` exits non-zero with message `"title is required"` |
| File storage | JSON read/write, corrupted/missing file handling | If `tickets.json` doesn't exist yet, `tickets list` returns an empty list instead of crashing; if the file has invalid JSON, the CLI reports a clear storage error instead of an unhandled exception |
| Errors | Not-found ticket, invalid status transitions | `tickets show ticket-999` (nonexistent id) exits non-zero with `"ticket not found"` |

---

## 5. Common Mistakes

| Mistake | Why it's a problem | How to avoid it |
|---|---|---|
| Over-testing | Testing trivial code (e.g. a plain getter) wastes time and adds maintenance burden without catching real bugs | Focus tests on logic with branches, edge cases, or external I/O — skip testing things that can't realistically break |
| Weak assertions | A test that only checks "no exception was thrown" or `result !== null` passes even when the output is wrong | Assert on the actual expected value/shape, not just "something came back" |
| Testing implementation details | Asserting on internal function calls or private state means the test breaks on every refactor even when behavior is unchanged | Test observable behavior (inputs → outputs), not how the code is internally structured |
| Blindly trusting AI output | AI can generate tests that trivially pass against its own (possibly wrong) implementation, giving false confidence | Write the test intent yourself first (or review it critically before running), and check that a test can actually fail — e.g. temporarily break the code and confirm the test catches it |

---

## 6. Evidence of Applying the 3 Workflows

### 6.1 Layered Questioning (Research → Brief → Example → Validation)

| Stage | What you asked / did | AI response summary | Your validation |
|---|---|---|---|
| Research | "What is TDD and why is Red-Green-Refactor structured that way?" | Explained the 3-step cycle and rationale (fail-first proves the test works) | Cross-checked against Kent Beck's original TDD description — consistent |
| Brief | "Summarize this for someone testing a CLI tool specifically, not a web app" | Reframed examples around CLI commands, exit codes, stdout/stderr instead of HTTP endpoints | Confirmed the CLI framing matches this project's Ticket Manager scope |
| Example | "Give a concrete Red-Green-Refactor example for a `validateTicketStatus` function" | Produced a failing test, minimal implementation, then a refactor step | Ran the example logic manually and traced through each step to confirm it actually follows Red→Green→Refactor rather than skipping straight to a full implementation |
| Validation | "What would make this example wrong or misleading?" | Pointed out the initial refactor step introduced a behavior change disguised as cleanup | Rewrote the refactor step to change structure only, verified logic stayed identical |

### 6.2 Solution Exploration (Explore → Compare → Choose)

| Option considered | Pros | Cons | Chosen? | Why |
|---|---|---|---|---|
| Test with a real JSON file on disk for storage tests | Closer to real production behavior | Slower, needs cleanup between test runs, flaky on parallel runs | No | Chose in-memory/temp-dir approach instead for speed and isolation |
| Use a temp directory per test run for JSON storage | Fast, isolated, still exercises real file I/O | Slightly more setup code | Yes | Best balance of realism (integration test) and reliability |
| Mock the file system entirely | Fastest, no I/O at all | Doesn't actually verify file read/write logic works | No | Would hide real bugs in storage code — acceptable only for pure unit tests of unrelated logic |

### 6.3 Iterative Refinement (Review → Summarize → Refine → Feedback → Validate)

| Round | AI suggestion | Your review | Refinement requested | Result after refinement |
|---|---|---|---|---|
| 1 | Test list generated covering only "happy path" create/list/show/update | Missing error cases (invalid input, not-found, corrupted file) | "Add test cases for error scenarios: missing required field, ticket not found, corrupted JSON file" | Updated list included 5 additional error-case tests |
| 2 | Error-case tests asserted only that an error was thrown, no message content | Weak assertion — matches the "Common Mistakes" section above | "Assert on the specific error message content, not just that an error occurred" | Tests now assert exact error messages, making failures easier to diagnose |

---

## 7. Self-Check Against Acceptance Criteria

- [x] Research content documented: TDD principles, testing levels, CLI test examples, AI validation
- [x] Research process with AI tracked: workflows applied and iterations documented (Section 6 complete)
- [x] Research findings can be explained clearly when submitting
- [x] Can answer questions about TDD, test types, and AI-generated code validation based on this research

---

## 8. Q&A Prep

| Likely question | Your answer |
|---|---|
| What's the difference between unit and integration tests? | Unit tests isolate one function/class with no real I/O; integration tests exercise multiple units together, often including real file/DB access, to verify they work correctly as a group |
| Why write the test before the implementation? | It forces the requirement to be precise and checkable before code exists, and proves the test can actually fail (catch a real bug) rather than trivially passing |
| How do you know when an AI-generated implementation is "done"? | When it passes a test suite that was defined independently of the implementation and covers normal, invalid, and edge-case inputs — not just when it "looks right" |
| What's wrong with testing implementation details instead of behavior? | It couples tests to internal structure, so any refactor (even one that doesn't change behavior) breaks tests — this discourages refactoring and adds maintenance cost without added safety |
