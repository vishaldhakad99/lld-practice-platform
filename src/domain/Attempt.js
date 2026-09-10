const { v4: uuidv4 } = require('uuid');

const Status = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  EVALUATING: 'EVALUATING',
  EVALUATED: 'EVALUATED',
  FAILED: 'FAILED',
});

class Attempt {
  constructor({ id, problemId, learnerId, solution, status, createdAt, submittedAt, updatedAt }) {
    this.id = id || uuidv4();
    this.problemId = problemId;
    this.learnerId = learnerId;
    this.solution = solution || '';
    this.status = status || Status.DRAFT;
    this.createdAt = createdAt || new Date().toISOString();
    this.submittedAt = submittedAt || null;
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  canSubmit() {
    return this.status === Status.DRAFT && this.solution && this.solution.trim().length >= 50;
  }

  submit() {
    if (!this.canSubmit()) {
      throw new Error('Attempt cannot be submitted: either already submitted or solution is too short (min 50 chars)');
    }
    this.status = Status.SUBMITTED;
    this.submittedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  markEvaluating() {
    if (this.status !== Status.SUBMITTED) {
      throw new Error(`Cannot evaluate attempt in status: ${this.status}`);
    }
    this.status = Status.EVALUATING;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  markEvaluated() {
    this.status = Status.EVALUATED;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  markFailed(reason) {
    this.status = Status.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      problemId: this.problemId,
      learnerId: this.learnerId,
      solution: this.solution,
      status: this.status,
      createdAt: this.createdAt,
      submittedAt: this.submittedAt,
      updatedAt: this.updatedAt,
    };
  }
}

Attempt.Status = Status;

module.exports = Attempt;
