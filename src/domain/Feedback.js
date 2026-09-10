class FeedbackItem {
  constructor({ category, observation, suggestion, severity }) {
    this.category = category;
    this.observation = observation;
    this.suggestion = suggestion;
    this.severity = severity || 'info';
  }
}

class EvaluationResult {
  constructor({ attemptId, score, dimensions, items, summary, evaluatedAt, evaluatorType }) {
    this.attemptId = attemptId;
    this.score = score;
    this.dimensions = dimensions || {};
    this.items = (items || []).map(i => new FeedbackItem(i));
    this.summary = summary || '';
    this.evaluatedAt = evaluatedAt || new Date().toISOString();
    this.evaluatorType = evaluatorType || 'composite';
  }

  grade() {
    if (this.score >= 85) return 'A';
    if (this.score >= 70) return 'B';
    if (this.score >= 55) return 'C';
    if (this.score >= 40) return 'D';
    return 'F';
  }

  strengths() {
    return this.items.filter(i => i.severity === 'strength');
  }

  improvements() {
    return this.items.filter(i => i.severity !== 'strength');
  }

  toJSON() {
    return {
      attemptId: this.attemptId,
      score: this.score,
      grade: this.grade(),
      dimensions: this.dimensions,
      items: this.items,
      summary: this.summary,
      evaluatedAt: this.evaluatedAt,
      evaluatorType: this.evaluatorType,
    };
  }
}

module.exports = { FeedbackItem, EvaluationResult };
