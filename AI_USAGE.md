# AI Usage

This document covers 5 meaningful decisions where AI assistance was used, what was suggested, and what was accepted or changed.

---

## 1. Evaluator Architecture: One or Many?

**What I asked:** How should I structure evaluation so it's extensible but not over-engineered for a 2-day prototype?

**What AI suggested:** Use a Strategy pattern with a base evaluator and pluggable implementations. It suggested three concrete types: rule-based, AI-powered, and a composite that merges both.

**What I accepted:** The three-evaluator structure with a `CompositeEvaluator` that blends scores. The base class with an abstract `evaluate()` method keeps things clean.

**What I changed:** AI suggested using a numeric weight array passed as constructor config. I simplified this to hardcoded constants (35% deterministic, 65% AI) with a comment in the code explaining the rationale. For a prototype, configurable weights add complexity without benefit.

---

## 2. Attempt State Machine

**What I asked:** How should I model attempt status transitions to prevent illegal state changes?

**What AI suggested:** Use a state machine directly on the entity with guard methods (`canSubmit()`, `canEvaluate()`) and transition methods that throw on invalid transitions.

**What I accepted:** The guard + transition method pattern on the `Attempt` class. This keeps transition logic in the domain, not scattered across services.

**What I changed:** AI included a generic `transition(from, to)` method and a transitions map. I replaced this with explicit named methods (`submit()`, `markEvaluating()`, `markEvaluated()`, `markFailed()`) because they make the code more readable and the test assertions clearer. Named methods also make accidental transitions impossible through type constraints.

---

## 3. Deterministic Scoring Dimensions

**What I asked:** Which dimensions matter most for LLD quality assessment, and how can I detect them with keyword signals?

**What AI suggested:** Five dimensions: abstraction, responsibilities, extensibility, design patterns, trade-off awareness. For each it provided a list of signal keywords.

**What I accepted:** The five dimensions. The keyword lists were a good starting point.

**What I changed:** AI's keyword lists were too generous (e.g., counting "object" as an abstraction signal). I tightened them to require more specific terms (e.g., `interface`, `abstract class`, `encapsulat`) to reduce false positives. I also added problem-specific domain keyword matching as a separate signal, which AI had not suggested, because a parking lot design that never mentions vehicles or spots is almost certainly incomplete.

---

## 4. AI Evaluator Prompt Design

**What I asked:** How should I prompt GPT to return structured, consistent feedback on an LLD submission?

**What AI suggested:** A system prompt that describes the rubric dimensions and asks for JSON output with a specific schema. It included asking GPT to rate each dimension 0-100 and return an array of feedback items with severity.

**What I accepted:** The JSON schema structure. Asking for structured output instead of prose is the right call here because the frontend needs to render individual feedback items.

**What I changed:** The original prompt had GPT produce a free-text summary alongside the JSON. I moved the summary inside the JSON object so parsing is atomic — one JSON.parse call gives everything. I also added explicit instruction to return only valid JSON with no markdown fencing, after testing showed GPT-4o-mini sometimes wraps responses in ` ```json ` blocks.

---

## 5. Frontend Architecture Decision

**What I asked:** Should I use React or Vanilla JS for the frontend, given the 2-day scope?

**What AI suggested:** React with a simple CRA or Vite setup for component structure.

**What I rejected:** React adds a build step, a bundler, and component boilerplate. For 6 UI states in a prototype, this is overhead without benefit.

**What I used instead:** Vanilla JS with a simple view router pattern. The `app.js` manages state in a plain object, renders views by toggling DOM sections, and fetches data via the native Fetch API. This is faster to ship, easier to debug, and requires zero build tooling. The reviewer sees working software, not a half-finished React setup.
