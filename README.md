# LLD Practice Platform

A focused practice loop for Low-Level Design: choose a problem, write your design, get structured multi-dimensional feedback, and track improvement across attempts.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Add your OpenAI key for AI-powered feedback
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...

# 3. Start the server
npm start

# 4. Open in browser
open http://localhost:3000
```

No database setup needed. SQLite file is created automatically at `data/lld.db` on first run.

---

## Running Tests

```bash
npm test
```

All tests use an in-memory SQLite database. No environment variables required to run tests.

```bash
npm run test:coverage   # with coverage report
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `data/lld.db` | SQLite file path |
| `OPENAI_API_KEY` | (not set) | Enables AI evaluation. Without this, deterministic-only evaluation runs. |

---

## Project Structure

```
lld-practice-platform/
├── src/
│   ├── domain/
│   │   ├── Problem.js          Value object. Holds problem data and validates it.
│   │   ├── Attempt.js          Entity. Owns state machine and transition guards.
│   │   └── Feedback.js         Value objects: FeedbackItem, EvaluationResult.
│   ├── repositories/
│   │   ├── db.js               SQLite connection + migrations.
│   │   └── AttemptRepository.js CRUD for attempts and evaluation results.
│   ├── services/
│   │   ├── ProblemService.js   Loads and looks up problems from seed data.
│   │   ├── AttemptService.js   Orchestrates attempt lifecycle.
│   │   └── EvaluationService.js Drives the evaluation pipeline.
│   ├── evaluators/
│   │   ├── BaseEvaluator.js    Abstract base (strategy interface).
│   │   ├── DeterministicEvaluator.js  Signal-based, free, always runs.
│   │   ├── AIEvaluator.js      OpenAI gpt-4o-mini, optional.
│   │   └── CompositeEvaluator.js Merges both; handles AI unavailability.
│   ├── routes/
│   │   ├── problems.js         GET /api/problems, GET /api/problems/:id
│   │   ├── attempts.js         CRUD + submit endpoint
│   │   └── health.js           GET /api/health
│   ├── data/
│   │   └── problems.js         5 LLD problems as plain JS objects.
│   └── app.js              Express app factory + entry point.
├── public/
│   ├── index.html          Single-page app shell.
│   ├── css/style.css       All styles.
│   └── js/app.js           Vanilla JS frontend (no framework).
├── tests/
│   ├── domain/             Problem and Attempt unit tests.
│   ├── evaluators/         DeterministicEvaluator unit tests.
│   ├── services/           EvaluationService integration tests.
│   └── routes/             API route tests via supertest.
├── docs/
│   ├── RESEARCH.md         Learner problem, existing tools, gaps, direction.
│   └── DESIGN.md           Domain model, evaluator design, trade-offs.
├── .env.example
├── AI_USAGE.md
└── README.md
```

---

## API Endpoints

### Problems
```
GET  /api/problems           List all problems
GET  /api/problems/:id       Get one problem by id
```

### Attempts
```
POST   /api/attempts                  Start a new attempt
PATCH  /api/attempts/:id/draft        Save draft solution
POST   /api/attempts/:id/submit       Submit for evaluation
GET    /api/attempts/:id             Get attempt + feedback
GET    /api/attempts?learnerId=&problemId=  History
```

### Health
```
GET  /api/health
```

---

## LLD Problems Included

| # | Problem | Difficulty |
|---|---------|------------|
| 1 | Design a Parking Lot | Medium |
| 2 | Design an Elevator System | Medium |
| 3 | Design a Vending Machine | Easy |
| 4 | Design a Library Management System | Hard |
| 5 | Design a Chess Game | Hard |

---

## Evaluation Approach

Without `OPENAI_API_KEY`: **Deterministic only** — instant, free, signal-based.

With `OPENAI_API_KEY`: **Composite** — deterministic (35%) + AI reasoning (65%). The AI uses a structured prompt that returns JSON with per-dimension scores and actionable feedback items.

If the AI call fails at runtime, the system falls back to deterministic results automatically and marks the failure in the feedback.

---

## Known Limitations

- Evaluation is synchronous in the request-response cycle. AI calls typically take 2-5 seconds, which is acceptable for a prototype.
- The deterministic evaluator uses keyword signals. A candidate expressing good ideas without using standard terminology may score lower than deserved. The AI evaluator compensates for this.
- No authentication: learner identity is a self-reported string stored in `localStorage`. Suitable for a prototype, not for production.
- SQLite does not support high write concurrency. Acceptable for a prototype.
