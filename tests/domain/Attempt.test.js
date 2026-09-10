const Attempt = require('../../src/domain/Attempt');

function makeAttempt(overrides = {}) {
  return new Attempt({
    problemId: 'parking-lot',
    learnerId: 'vishal',
    ...overrides,
  });
}

describe('Attempt', () => {
  test('creates with DRAFT status and generates id', () => {
    const a = makeAttempt();
    expect(a.status).toBe('DRAFT');
    expect(a.id).toBeTruthy();
    expect(a.solution).toBe('');
  });

  test('canSubmit() returns false when solution is too short', () => {
    const a = makeAttempt({ solution: 'short' });
    expect(a.canSubmit()).toBe(false);
  });

  test('canSubmit() returns false when already submitted', () => {
    const solution = 'x'.repeat(60);
    const a = makeAttempt({ solution, status: 'SUBMITTED' });
    expect(a.canSubmit()).toBe(false);
  });

  test('canSubmit() returns true for a draft with enough content', () => {
    const a = makeAttempt({ solution: 'x'.repeat(60) });
    expect(a.canSubmit()).toBe(true);
  });

  test('submit() transitions DRAFT to SUBMITTED and sets submittedAt', () => {
    const a = makeAttempt({ solution: 'x'.repeat(60) });
    a.submit();
    expect(a.status).toBe('SUBMITTED');
    expect(a.submittedAt).not.toBeNull();
  });

  test('submit() throws when solution is too short', () => {
    const a = makeAttempt({ solution: 'tiny' });
    expect(() => a.submit()).toThrow();
  });

  test('submit() throws when already submitted', () => {
    const a = makeAttempt({ solution: 'x'.repeat(60), status: 'SUBMITTED' });
    expect(() => a.submit()).toThrow();
  });

  test('markEvaluating() transitions SUBMITTED to EVALUATING', () => {
    const a = makeAttempt({ status: 'SUBMITTED' });
    a.markEvaluating();
    expect(a.status).toBe('EVALUATING');
  });

  test('markEvaluating() throws when not in SUBMITTED state', () => {
    const a = makeAttempt({ status: 'DRAFT' });
    expect(() => a.markEvaluating()).toThrow();
  });

  test('markEvaluated() sets status to EVALUATED', () => {
    const a = makeAttempt({ status: 'EVALUATING' });
    a.markEvaluated();
    expect(a.status).toBe('EVALUATED');
  });

  test('markFailed() sets status to FAILED with reason', () => {
    const a = makeAttempt({ status: 'EVALUATING' });
    a.markFailed('OpenAI timeout');
    expect(a.status).toBe('FAILED');
    expect(a.failureReason).toBe('OpenAI timeout');
  });

  test('toJSON() returns plain object', () => {
    const a = makeAttempt();
    const json = a.toJSON();
    expect(json).not.toBeInstanceOf(Attempt);
    expect(json.id).toBe(a.id);
    expect(json.status).toBe('DRAFT');
  });
});
