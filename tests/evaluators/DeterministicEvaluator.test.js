const DeterministicEvaluator = require('../../src/evaluators/DeterministicEvaluator');
const Attempt = require('../../src/domain/Attempt');
const Problem = require('../../src/domain/Problem');

const problem = new Problem({
  id: 'parking-lot',
  title: 'Design a Parking Lot',
  difficulty: 'Medium',
  description: 'Design an OO parking lot system.',
  requirements: ['Multi-floor support', 'Vehicle types'],
  hints: [],
  constraints: [],
  tags: ['OOP'],
});

function makeAttempt(solution) {
  return new Attempt({ id: 'a1', problemId: 'parking-lot', learnerId: 'v', solution });
}

describe('DeterministicEvaluator', () => {
  const evaluator = new DeterministicEvaluator();

  test('name() returns deterministic', () => {
    expect(evaluator.name()).toBe('deterministic');
  });

  test('returns low score for short unrelated text', async () => {
    const attempt = makeAttempt('This is a very short and unhelpful solution that has no design thinking at all yes yes.');
    const result = await evaluator.evaluate(attempt, problem);
    expect(result.score).toBeLessThan(40);
  });

  test('returns higher score when abstraction and responsibility signals are present', async () => {
    const solution = [
      'I define an interface ParkingSpot with methods isAvailable() and assign(vehicle).',
      'ParkingFloor implements the spot collection. ParkingLot owns multiple floors.',
      'Each class has single responsibility. The Ticket class owns fee calculation.',
      'I use a strategy pattern for pricing so it can be extended without modification.',
      'Tradeoff: I chose in-memory state over a DB for simplicity.',
      'Entry vehicle spot assignment ticket exit fee return.',
    ].join(' ');
    const attempt = makeAttempt(solution);
    const result = await evaluator.evaluate(attempt, problem);
    expect(result.score).toBeGreaterThan(40);
  });

  test('returns EvaluationResult with correct shape', async () => {
    const attempt = makeAttempt('x'.repeat(200));
    const result = await evaluator.evaluate(attempt, problem);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('summary');
    expect(result.evaluatorType).toBe('deterministic');
  });

  test('score is always between 0 and 100', async () => {
    for (const text of ['', 'x', 'a'.repeat(2000)]) {
      const attempt = makeAttempt(text || 'placeholder text for test');
      const result = await evaluator.evaluate(attempt, problem);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  test('grade A for score >= 85', async () => {
    const { EvaluationResult } = require('../../src/domain/Feedback');
    const r = new EvaluationResult({ attemptId: 'x', score: 87, dimensions: {}, items: [], summary: '' });
    expect(r.grade()).toBe('A');
  });

  test('grade F for score < 40', async () => {
    const { EvaluationResult } = require('../../src/domain/Feedback');
    const r = new EvaluationResult({ attemptId: 'x', score: 30, dimensions: {}, items: [], summary: '' });
    expect(r.grade()).toBe('F');
  });

  test('items include warning when no signals found for a dimension', async () => {
    const attempt = makeAttempt('vehicle spot floor ticket entry exit fee capacity');
    const result = await evaluator.evaluate(attempt, problem);
    const warnings = result.items.filter(i => i.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
  });
});
