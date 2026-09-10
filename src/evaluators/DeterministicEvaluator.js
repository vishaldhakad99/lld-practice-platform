const BaseEvaluator = require('./BaseEvaluator');
const { EvaluationResult } = require('../domain/Feedback');

const DIMENSION_WEIGHTS = {
  abstraction: 25,
  responsibilities: 25,
  extensibility: 20,
  patterns: 15,
  tradeoffs: 15,
};

const SIGNALS = {
  abstraction: [
    'interface', 'abstract', 'contract', 'encapsulat', 'polymorphi',
    'extends', 'implements', 'base class', 'superclass', 'inherit',
    'class ', 'object', 'type hierarchy',
  ],
  responsibilities: [
    'single responsibility', 'SRP', 'cohesion', 'responsible for',
    'owns', 'manages', 'handles', 'belongs to', 'separate concern',
    'service', 'repository', 'controller', 'handler', 'manager',
  ],
  extensibility: [
    'open-closed', 'OCP', 'strategy', 'factory', 'plug', 'extensib',
    'swap', 'replace', 'inject', 'dependency inject', 'DI',
    'without modif', 'add new', 'extend',
  ],
  patterns: [
    'singleton', 'factory', 'observer', 'strategy', 'state machine',
    'command', 'decorator', 'builder', 'adapter', 'facade',
    'template method', 'composite', 'proxy', 'iterator',
  ],
  tradeoffs: [
    'tradeoff', 'trade-off', 'limitation', 'alternatively', 'however',
    'drawback', 'downside', 'instead of', 'chose', 'decided against',
    'could also', 'another approach', 'consideration',
  ],
};

const PROBLEM_KEYWORDS = {
  'parking-lot': ['spot', 'vehicle', 'floor', 'ticket', 'fee', 'entry', 'exit', 'capacity'],
  'elevator-system': ['elevator', 'floor', 'request', 'dispatch', 'door', 'idle', 'moving', 'queue'],
  'vending-machine': ['coin', 'item', 'dispense', 'change', 'inventory', 'stock', 'payment', 'slot'],
  'library-management': ['book', 'member', 'borrow', 'return', 'fine', 'reservation', 'copy', 'catalogue'],
  'chess-game': ['piece', 'board', 'move', 'king', 'check', 'valid', 'turn', 'pawn'],
};

class DeterministicEvaluator extends BaseEvaluator {
  name() {
    return 'deterministic';
  }

  async evaluate(attempt, problem) {
    const text = attempt.solution.toLowerCase();
    const wordCount = attempt.solution.split(/\s+/).filter(Boolean).length;

    const dimensionScores = {};
    const items = [];

    for (const [dim, signals] of Object.entries(SIGNALS)) {
      const matched = signals.filter(s => text.includes(s.toLowerCase()));
      const ratio = matched.length / signals.length;
      const raw = Math.min(100, Math.round(ratio * 180));
      dimensionScores[dim] = raw;

      if (matched.length === 0) {
        items.push({
          category: dim,
          observation: `No signals found for ${dim}.`,
          suggestion: this._hint(dim),
          severity: 'warning',
        });
      } else if (raw >= 70) {
        items.push({
          category: dim,
          observation: `Good coverage of ${dim} concepts.`,
          suggestion: 'Consider deepening your justification with trade-off reasoning.',
          severity: 'strength',
        });
      } else {
        items.push({
          category: dim,
          observation: `Partial coverage of ${dim} (${matched.length} signal(s) found).`,
          suggestion: this._hint(dim),
          severity: 'info',
        });
      }
    }

    const domainKeywords = PROBLEM_KEYWORDS[problem.id] || [];
    const domainMatched = domainKeywords.filter(k => text.includes(k));
    const domainScore = domainKeywords.length
      ? Math.round((domainMatched.length / domainKeywords.length) * 100)
      : 50;

    if (domainScore < 40) {
      items.push({
        category: 'domain',
        observation: `Solution appears to miss key domain concepts for this problem.`,
        suggestion: `Make sure you address: ${domainKeywords.join(', ')}.`,
        severity: 'error',
      });
    }

    const lengthPenalty = wordCount < 100 ? -15 : wordCount < 200 ? -5 : 0;

    const weightedScore =
      Object.entries(DIMENSION_WEIGHTS).reduce((sum, [dim, w]) => {
        return sum + (dimensionScores[dim] || 0) * (w / 100);
      }, 0);

    const finalScore = this._clamp(weightedScore * 0.65 + domainScore * 0.35 + lengthPenalty);

    return new EvaluationResult({
      attemptId: attempt.id,
      score: finalScore,
      dimensions: dimensionScores,
      items,
      summary: this._buildSummary(finalScore, dimensionScores),
      evaluatorType: this.name(),
    });
  }

  _hint(dimension) {
    const hints = {
      abstraction:
        'Define clear interfaces or abstract classes. Show what each type promises to its callers.',
      responsibilities:
        'Call out which class owns which behaviour. Avoid god-classes.',
      extensibility:
        'Explain how you would add a new feature without modifying existing classes (Open-Closed).',
      patterns:
        'Name any design patterns you applied and why they fit here.',
      tradeoffs:
        'Acknowledge at least one trade-off or alternative you considered and rejected.',
    };
    return hints[dimension] || '';
  }

  _buildSummary(score, dims) {
    const weakest = Object.entries(dims).sort((a, b) => a[1] - b[1])[0];
    const strongest = Object.entries(dims).sort((a, b) => b[1] - a[1])[0];
    return (
      `Deterministic score: ${score}/100. ` +
      `Strongest area: ${strongest[0]} (${strongest[1]}). ` +
      `Area needing most attention: ${weakest[0]} (${weakest[1]}).`
    );
  }
}

module.exports = DeterministicEvaluator;
