# Research Note

## 1. The Learner Problem

LLD practice has a fundamental feedback gap. A learner can spend two hours designing a Parking Lot system and still walk away unsure whether their design is good. Existing resources — YouTube videos, GitHub repos, blog posts — show you *a* solution, not what makes *your* solution strong or weak. The two core problems are:

**Discovery gap.** Learners do not know which dimension of their design needs improvement. Is the abstraction poor? Are responsibilities leaking between classes? Are they ignoring extensibility? Without structured feedback, all they can do is compare their output to a reference answer.

**Motivation gap.** LLD skill is built through repetition. Most tools treat it as a one-time solve: here is the problem, here is the answer. There is no loop that says "your third attempt is better than your first in these specific ways."

## 2. Existing Approaches Researched

### 2a. LeetCode / NeetCode
- Strong for DSA, thin for LLD.
- LLD problems exist but feedback is limited to upvotes on discussion threads.
- No structured evaluation of your specific submission.

### 2b. Educative.io / Grokking System Design
- High-quality reference designs.
- Passive learning: read the solution, compare mentally. No submission or feedback loop.
- HLD-heavy; LLD content is secondary.

### 2c. InterviewBit / Scaler
- Curated LLD problems with model solutions.
- Feedback is again comparison-based, not submission-evaluated.

### 2d. GitHub LLD repositories
- Abundant reference implementations (e.g., ashishps1/awesome-low-level-design).
- Useful for self-study but zero interactivity or feedback.

### 2e. ChatGPT / Claude (direct)
- Learners increasingly paste their design and ask "is this good?".
- Works but unstructured: feedback quality depends entirely on prompt quality.
- No history tracking, no consistent evaluation rubric, no practice loop.

## 3. Key Gaps

| Gap | Why it matters |
|-----|----------------|
| No submission loop | Practice requires repeated attempts and comparison over time |
| No structured feedback rubric | "Your design is decent" is not actionable |
| No separation of deterministic vs reasoning feedback | Some checks (e.g., did you name at least one interface?) are mechanical; others need judgment |
| No history per learner | Improvement is invisible without history |

## 4. Product Direction

Build a minimal, focused practice loop:

```
Choose problem → Write design → Submit → Get structured feedback → View history → Try again
```

Feedback must be:
- **Multi-dimensional**: abstraction, responsibilities, extensibility, patterns, trade-offs.
- **Actionable**: each item has an observation and a concrete suggestion.
- **Honest about confidence**: deterministic checks vs AI-reasoned observations are labelled separately.

History must surface improvement: learners can see their score trend across attempts on the same problem.

The MVP deliberately avoids: user auth, team features, problem authoring UI, code execution, diagram rendering. These are real features but they are not the core learning loop.
