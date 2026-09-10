const Problem = require('../domain/Problem');
const problems = require('../data/problems');

class ProblemService {
  constructor() {
    this._problems = problems.map(p => new Problem(p));
  }

  list() {
    return this._problems;
  }

  getById(id) {
    const problem = this._problems.find(p => p.id === id);
    if (!problem) throw new Error(`Problem not found: ${id}`);
    return problem;
  }

  exists(id) {
    return this._problems.some(p => p.id === id);
  }
}

module.exports = ProblemService;
