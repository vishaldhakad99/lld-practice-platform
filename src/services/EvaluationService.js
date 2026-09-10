const AttemptService = require('./AttemptService');
const ProblemService = require('./ProblemService');
const DeterministicEvaluator = require('../evaluators/DeterministicEvaluator');
const AIEvaluator = require('../evaluators/AIEvaluator');
const CompositeEvaluator = require('../evaluators/CompositeEvaluator');

class EvaluationService {
  constructor(attemptService, problemService, evaluator) {
    this.attemptService = attemptService || new AttemptService();
    this.problemService = problemService || new ProblemService();
    this.evaluator = evaluator || new CompositeEvaluator(
      new DeterministicEvaluator(),
      new AIEvaluator()
    );
  }

  async evaluate(attemptId) {
    const attempt = this.attemptService.markSubmitted(attemptId);
    const problem = this.problemService.getById(attempt.problemId);

    this.attemptService.markEvaluating(attemptId);

    let result;
    try {
      result = await this.evaluator.evaluate(attempt, problem);
    } catch (err) {
      this.attemptService.markFailed(attemptId, err.message);
      throw new Error(`Evaluation failed: ${err.message}`);
    }

    const { evaluation } = this.attemptService.markEvaluated(attemptId, result);
    return evaluation;
  }
}

module.exports = EvaluationService;
