const express = require('express');
const router = express.Router();
const AttemptService = require('../services/AttemptService');
const EvaluationService = require('../services/EvaluationService');

const attemptService = new AttemptService();
const evaluationService = new EvaluationService(attemptService);

router.post('/', (req, res) => {
  const { problemId, learnerId } = req.body;
  if (!problemId || !learnerId) {
    return res.status(400).json({ error: 'problemId and learnerId are required' });
  }
  try {
    const attempt = attemptService.startAttempt(problemId, learnerId);
    res.status(201).json({ attempt: attempt.toJSON() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/draft', (req, res) => {
  const { solution } = req.body;
  if (solution === undefined) {
    return res.status(400).json({ error: 'solution is required' });
  }
  try {
    const attempt = attemptService.saveDraft(req.params.id, solution);
    res.json({ attempt: attempt.toJSON() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const evaluation = await evaluationService.evaluate(req.params.id);
    res.json({ evaluation: evaluation.toJSON() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { attempt, feedback } = attemptService.getAttemptWithFeedback(req.params.id);
    res.json({
      attempt: attempt.toJSON(),
      feedback: feedback ? feedback.toJSON() : null,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  const { learnerId, problemId } = req.query;
  if (!learnerId) {
    return res.status(400).json({ error: 'learnerId query param is required' });
  }
  try {
    const history = attemptService.getHistory(learnerId, problemId);
    const withFeedback = history.map(attempt => {
      const feedback = attemptService.repo.findEvaluationByAttemptId(attempt.id);
      return {
        attempt: attempt.toJSON(),
        feedback: feedback ? feedback.toJSON() : null,
      };
    });
    res.json({ history: withFeedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
