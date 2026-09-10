const Attempt = require('../domain/Attempt');
const AttemptRepository = require('../repositories/AttemptRepository');
const ProblemService = require('./ProblemService');

class AttemptService {
  constructor(attemptRepo, problemService) {
    this.repo = attemptRepo || new AttemptRepository();
    this.problemService = problemService || new ProblemService();
  }

  startAttempt(problemId, learnerId) {
    this.problemService.getById(problemId);
    const attempt = new Attempt({ problemId, learnerId });
    return this.repo.save(attempt);
  }

  saveDraft(attemptId, solution) {
    const attempt = this._requireAttempt(attemptId);
    if (attempt.status !== Attempt.Status.DRAFT) {
      throw new Error(`Cannot edit attempt in status: ${attempt.status}`);
    }
    attempt.solution = solution;
    attempt.updatedAt = new Date().toISOString();
    return this.repo.save(attempt);
  }

  getAttempt(attemptId) {
    return this._requireAttempt(attemptId);
  }

  getHistory(learnerId, problemId) {
    if (problemId) {
      return this.repo.findByLearnerAndProblem(learnerId, problemId);
    }
    return this.repo.findByLearner(learnerId);
  }

  getAttemptWithFeedback(attemptId) {
    const attempt = this._requireAttempt(attemptId);
    const feedback = this.repo.findEvaluationByAttemptId(attemptId);
    return { attempt, feedback };
  }

  markSubmitted(attemptId) {
    const attempt = this._requireAttempt(attemptId);
    attempt.submit();
    return this.repo.save(attempt);
  }

  markEvaluating(attemptId) {
    const attempt = this._requireAttempt(attemptId);
    attempt.markEvaluating();
    return this.repo.save(attempt);
  }

  markEvaluated(attemptId, evaluationResult) {
    const attempt = this._requireAttempt(attemptId);
    attempt.markEvaluated();
    this.repo.save(attempt);
    this.repo.saveEvaluationResult(evaluationResult);
    return { attempt, evaluation: evaluationResult };
  }

  markFailed(attemptId, reason) {
    const attempt = this._requireAttempt(attemptId);
    attempt.markFailed(reason);
    return this.repo.save(attempt);
  }

  _requireAttempt(attemptId) {
    const attempt = this.repo.findById(attemptId);
    if (!attempt) throw new Error(`Attempt not found: ${attemptId}`);
    return attempt;
  }
}

module.exports = AttemptService;
