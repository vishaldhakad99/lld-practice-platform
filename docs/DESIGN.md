# Design Note

## 1. MVP Scope

One focused practice loop:

```
Choose problem → Write design → Save draft → Submit → Evaluated → View feedback → Try again
```

The MVP deliberately excludes: user authentication, code execution, diagram rendering, admin problem authoring, team features.

---

## 2. User Flow

```
[Home] Enter learner ID
    ↓
[Problem List] 5 LLD problems (Parking Lot, Elevator, Vending Machine, Library, Chess)
    ↓
[Attempt Editor] Split view: problem details (left) + textarea editor (right)
  - Auto-saves draft every 1.8s
  - Manual "Save Draft" button
    ↓
[Submit] POST /api/attempts/:id/submit
    ↓
[Evaluation] DeterministicEvaluator + AIEvaluator (if OPENAI_API_KEY set)
    ↓
[Feedback View] Score ring, grade, dimension bars, feedback items by severity
    ↓
[History Panel] All past attempts for this problem; click any to view its feedback
```

---

## 3. Domain Model

### Problem
A read-only value object. Loaded from a seed file at startup. Properties: id, title, difficulty, tags, description, requirements, hints, constraints.

```
Problem
  id: string
  title: string
  difficulty: Easy | Medium | Hard
  tags: string[]
  description: string
  requirements: string[]
  hints: string[]
  constraints: string[]
  validate(): boolean
  toJSON(): object
```

### Attempt
An entity with identity and a lifecycle (state machine). Owns the transition logic so the service layer cannot accidentally skip states.

```
Attempt
  id: UUID
  problemId: string
  learnerId: string
  solution: string
  status: DRAFT | SUBMITTED | EVALUATING | EVALUATED | FAILED
  createdAt: ISO string
  submittedAt: ISO string | null
  updatedAt: ISO string

  canSubmit(): boolean        // solution.length >= 50 and status === DRAFT
  submit(): this              // DRAFT → SUBMITTED
  markEvaluating(): this      // SUBMITTED → EVALUATING
  markEvaluated(): this       // EVALUATING → EVALUATED
  markFailed(reason): this    // any → FAILED
  toJSON(): object
```

State machine:
```
  DRAFT ──submit()──► SUBMITTED ──markEvaluating()──► EVALUATING
                                                         │        │
                                                  markEvaluated  markFailed
                                                         │        │
                                                     EVALUATED  FAILED
```

### EvaluationResult
A value object produced by an evaluator. Not mutable after creation.

```
EvaluationResult
  attemptId: UUID
  score: integer (0-100)
  dimensions: { abstraction, responsibilities, extensibility, patterns, tradeoffs }
  items: FeedbackItem[]
  summary: string
  evaluatorType: string
  evaluatedAt: ISO string

  grade(): A | B | C | D | F
  strengths(): FeedbackItem[]
  improvements(): FeedbackItem[]
  toJSON(): object

FeedbackItem
  category: string
  observation: string
  suggestion: string
  severity: strength | info | warning | error
```

---

## 4. Evaluator Design (Strategy Pattern)

The evaluation approach is the core intellectual challenge of this product. A wrong design here means the feedback is either useless or expensive to change.

```
BaseEvaluator (abstract)
  evaluate(attempt, problem): Promise<EvaluationResult>   // must override
  name(): string                                           // must override
  _clamp(value, min, max): number                          // shared util

  ├── DeterministicEvaluator
  │     Fast, free, always runs.
  │     Scores 5 dimensions by signal matching:
  │       abstraction: looks for 'interface', 'abstract', 'encapsulat', etc.
  │       responsibilities: 'single responsibility', 'cohesion', etc.
  │       extensibility: 'open-closed', 'strategy', 'inject', etc.
  │       patterns: 'singleton', 'factory', 'observer', etc.
  │       tradeoffs: 'tradeoff', 'limitation', 'alternatively', etc.
  │     Also checks problem-specific domain keywords.
  │     Weight: 35% of composite score.
  │
  ├── AIEvaluator
  │     Calls OpenAI gpt-4o-mini with a strict JSON-response prompt.
  │     Only runs when OPENAI_API_KEY is set.
  │     Falls back gracefully: if API fails, CompositeEvaluator uses deterministic only.
  │     Weight: 65% of composite score.
  │
  └── CompositeEvaluator
        Orchestrates both.
        If AI is unavailable → use deterministic, append a note in summary.
        If AI throws at runtime → use deterministic, add a warning feedback item.
        Merges dimension scores (30% deterministic + 70% AI).
        All items from both evaluators are passed through (labelled by source).
```

### Why this split?

| Check | Evaluator | Reason |
|-------|-----------|--------|
| Did the candidate name an interface? | Deterministic | Binary, fast, cheap |
| Did they address SRP? | Deterministic | Signal-based pattern match |
| Is the abstraction actually meaningful? | AI | Requires reading comprehension |
| Are the responsibilities genuinely separated? | AI | Judgment, context-dependent |
| Did they note trade-offs? | Both | Deterministic catches the word; AI judges quality |

---

## 5. Persistence

SQLite via `better-sqlite3` (synchronous, embedded, zero configuration).

Two tables:
- `attempts` — all attempt records with status
- `evaluation_results` — one-to-one with a completed attempt

The `AttemptRepository` owns all SQL. Services depend only on the repository interface, so swapping to Postgres later requires only a new repository implementation.

---

## 6. Failure Handling

| Scenario | Behaviour |
|----------|-----------|
| Solution too short | `canSubmit()` returns false; 400 returned to client |
| Attempt not found | Repository returns null; service throws; 404 returned |
| OpenAI unavailable | `AIEvaluator.isAvailable()` returns false; composite uses deterministic only |
| OpenAI times out or errors mid-evaluation | Attempt marked FAILED; error message stored; 400 returned with reason |
| Concurrent double-submit | Second submit call hits status !== DRAFT and throws early |

---

## 7. Key Trade-offs

**Signal matching vs semantic evaluation:** The deterministic evaluator uses keyword signals. A candidate who writes "I avoid using a single class that does everything" gets no credit for SRP even though their intent is clear. This is a known weakness. The AI evaluator compensates for this on semantic understanding; the trade-off is cost and latency.

**Synchronous evaluation:** Evaluation happens in the request-response cycle. For the prototype this is fine. A longer-running AI call (2-5 seconds) is acceptable. If evaluation took 30+ seconds, the right fix would be a job queue with polling — but that complexity is out of scope for a 2-day prototype.

**SQLite over Postgres:** Zero configuration, no Docker dependency, easy to run. The downside is that it does not scale to concurrent writes well. Acceptable for a prototype; the repository pattern makes swapping easy.

**Text-only submissions:** Code or diagrams would be richer but harder to evaluate consistently. Text forces the learner to articulate their design, which is what interviews actually test.

---

## 8. Extensibility Points

- **New evaluator:** implement `BaseEvaluator`, inject into `CompositeEvaluator`.
- **New submission format:** `Attempt.solution` is currently a string; add a `submissionFormat` field and let evaluators branch on it.
- **New problem:** add an entry to `src/data/problems.js`.
- **Async evaluation:** wrap `EvaluationService.evaluate` in a job queue; add a polling endpoint; the domain model already has the `EVALUATING` state.
- **Scoring rubric change:** only `DeterministicEvaluator` and the AI prompt change; the domain model and routes are untouched.
