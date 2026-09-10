const express = require('express');
const router = express.Router();
const ProblemService = require('../services/ProblemService');

const problemService = new ProblemService();

router.get('/', (req, res) => {
  try {
    const problems = problemService.list().map(p => p.toJSON());
    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const problem = problemService.getById(req.params.id);
    res.json({ problem: problem.toJSON() });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
