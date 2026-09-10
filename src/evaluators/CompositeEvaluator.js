const BaseEvaluator = require('./BaseEvaluator');
const { EvaluationResult } = require('../domain/Feedback');

class CompositeEvaluator extends BaseEvaluator {
  constructor(deterministicEvaluator, aiEvaluator) {
    super();
    this.deterministic = deterministicEvaluator;
    this.ai = aiEvaluator;
  }

  name() {
    return 'composite';
  }

  async evaluate(attempt, problem) {
    const detResult = await this.deterministic.evaluate(attempt, problem);

    if (!this.ai || !this.ai.isAvailable()) {
      return new EvaluationResult({
        attemptId: detResult.attemptId,
        score: detResult.score,
        dimensions: detResult.dimensions,
        items: detResult.items,
        summary: detResult.summary + ' (AI evaluation unavailable — set OPENAI_API_KEY to enable.)',
        evaluatorType: 'deterministic-only',
      });
    }

    let aiResult;
    try {
      aiResult = await this.ai.evaluate(attempt, problem);
    } catch {
      return new EvaluationResult({
        attemptId: detResult.attemptId,
        score: detResult.score,
        dimensions: detResult.dimensions,
        items: [...detResult.items, {
          category: 'system',
          observation: 'AI evaluation failed. Showing deterministic results only.',
          suggestion: 'Check OPENAI_API_KEY and retry.',
          severity: 'warning',
        }],
        summary: detResult.summary,
        evaluatorType: 'deterministic-fallback',
      });
    }

    const mergedScore = Math.round(detResult.score * 0.35 + aiResult.score * 0.65);

    const mergedDimensions = {};
    for (const dim of Object.keys(detResult.dimensions)) {
      const aiDim = aiResult.dimensions[dim] ?? detResult.dimensions[dim];
      mergedDimensions[dim] = Math.round(detResult.dimensions[dim] * 0.3 + aiDim * 0.7);
    }

    const allItems = [
      ...detResult.items.map(i => ({ ...i, source: 'deterministic' })),
      ...aiResult.items.map(i => ({ ...i, source: 'ai' })),
    ];

    return new EvaluationResult({
      attemptId: attempt.id,
      score: this._clamp(mergedScore),
      dimensions: mergedDimensions,
      items: allItems,
      summary: aiResult.summary,
      evaluatorType: this.name(),
    });
  }
}

module.exports = CompositeEvaluator;
