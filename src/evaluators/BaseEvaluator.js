class BaseEvaluator {
  async evaluate(attempt, problem) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  name() {
    throw new Error('name() must be implemented by subclass');
  }

  _clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }
}

module.exports = BaseEvaluator;
