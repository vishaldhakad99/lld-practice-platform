const AttemptService = require('../../src/services/AttemptService');
const ProblemService = require('../../src/services/ProblemService');
const EvaluationService = require('../../src/services/EvaluationService');
const AttemptRepository = require('../../src/repositories/AttemptRepository');
const { createTestDb } = require('../../src/repositories/db');
const Attempt = require('../../src/domain/Attempt');

async function makeServices() {
  const db = await createTestDb();
  const repo = new AttemptRepository(db);
  const problemService = new ProblemService();
  const attemptService = new AttemptService(repo, problemService);

  const mockEvaluator = {
    name: () => 'mock',
    isAvailable: () => true,
    evaluate: async (attempt) => ({
      attemptId: attempt.id,
      score: 72,
      grade: () => 'B',
      dimensions: { abstraction: 80, responsibilities: 70 },
      items: [{ category: 'abstraction', observation: 'Good', suggestion: 'Go deeper', severity: 'strength' }],
      summary: 'Solid design.',
      evaluatorType: 'mock',
      toJSON() { return this; },
    }),
  };

  const evalService = new EvaluationService(attemptService, problemService, mockEvaluator);
  return { repo, problemService, attemptService, evalService };
}

describe('EvaluationService', () => {
  test('evaluate() runs full lifecycle: DRAFT -> EVALUATED', async () => {
    const { attemptService, evalService } = await makeServices();
    const attempt = attemptService.startAttempt('parking-lot', 'vishal');
    attemptService.saveDraft(attempt.id, 'x'.repeat(60));

    await evalService.evaluate(attempt.id);

    const { attempt: updated } = attemptService.getAttemptWithFeedback(attempt.id);
    expect(updated.status).toBe(Attempt.Status.EVALUATED);
  });

  test('evaluate() stores feedback that can be retrieved', async () => {
    const { attemptService, evalService } = await makeServices();
    const attempt = attemptService.startAttempt('parking-lot', 'vishal');
    attemptService.saveDraft(attempt.id, 'y'.repeat(60));

    await evalService.evaluate(attempt.id);

    const { feedback } = attemptService.getAttemptWithFeedback(attempt.id);
    expect(feedback).not.toBeNull();
    expect(feedback.score).toBe(72);
  });

  test('evaluate() marks attempt FAILED when evaluator throws', async () => {
    const { attemptService, problemService } = await makeServices();
    const failingEvaluator = {
      name: () => 'fail',
      evaluate: async () => { throw new Error('LLM timeout'); },
    };
    const evalService = new EvaluationService(attemptService, problemService, failingEvaluator);

    const attempt = attemptService.startAttempt('parking-lot', 'vishal');
    attemptService.saveDraft(attempt.id, 'z'.repeat(60));

    await expect(evalService.evaluate(attempt.id)).rejects.toThrow('Evaluation failed');

    const { attempt: failed } = attemptService.getAttemptWithFeedback(attempt.id);
    expect(failed.status).toBe(Attempt.Status.FAILED);
  });

  test('evaluate() throws when attempt solution is too short', async () => {
    const { attemptService, evalService } = await makeServices();
    const attempt = attemptService.startAttempt('parking-lot', 'vishal');
    attemptService.saveDraft(attempt.id, 'short');

    await expect(evalService.evaluate(attempt.id)).rejects.toThrow();
  });
});
