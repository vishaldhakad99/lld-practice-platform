const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('./db');
const Attempt = require('../domain/Attempt');
const { EvaluationResult } = require('../domain/Feedback');

class AttemptRepository {
  constructor(db) {
    this._injectedDb = db || null;
  }

  get db() {
    return this._injectedDb || getDb();
  }

  _one(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }

  _all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  save(attempt) {
    const existing = this._one('SELECT id FROM attempts WHERE id = ?', [attempt.id]);
    if (existing) {
      this.db.run(
        'UPDATE attempts SET solution=?, status=?, submitted_at=?, updated_at=? WHERE id=?',
        [attempt.solution, attempt.status, attempt.submittedAt, attempt.updatedAt, attempt.id]
      );
    } else {
      this.db.run(
        'INSERT INTO attempts (id, problem_id, learner_id, solution, status, created_at, submitted_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [attempt.id, attempt.problemId, attempt.learnerId, attempt.solution, attempt.status, attempt.createdAt, attempt.submittedAt, attempt.updatedAt]
      );
    }
    if (!this._injectedDb) saveDb();
    return attempt;
  }

  findById(id) {
    const row = this._one('SELECT * FROM attempts WHERE id = ?', [id]);
    return row ? this._toAttempt(row) : null;
  }

  findByLearner(learnerId) {
    return this._all(
      'SELECT * FROM attempts WHERE learner_id = ? ORDER BY created_at DESC',
      [learnerId]
    ).map(r => this._toAttempt(r));
  }

  findByLearnerAndProblem(learnerId, problemId) {
    return this._all(
      'SELECT * FROM attempts WHERE learner_id = ? AND problem_id = ? ORDER BY created_at DESC',
      [learnerId, problemId]
    ).map(r => this._toAttempt(r));
  }

  saveEvaluationResult(result) {
    const id = uuidv4();
    this.db.run(
      'INSERT OR REPLACE INTO evaluation_results (id, attempt_id, score, dimensions, items, summary, evaluator_type, evaluated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, result.attemptId, result.score, JSON.stringify(result.dimensions), JSON.stringify(result.items), result.summary, result.evaluatorType, result.evaluatedAt]
    );
    if (!this._injectedDb) saveDb();
    return result;
  }

  findEvaluationByAttemptId(attemptId) {
    const row = this._one(
      'SELECT * FROM evaluation_results WHERE attempt_id = ?',
      [attemptId]
    );
    if (!row) return null;
    return new EvaluationResult({
      attemptId: row.attempt_id,
      score: row.score,
      dimensions: JSON.parse(row.dimensions),
      items: JSON.parse(row.items),
      summary: row.summary,
      evaluatorType: row.evaluator_type,
      evaluatedAt: row.evaluated_at,
    });
  }

  _toAttempt(row) {
    return new Attempt({
      id: row.id,
      problemId: row.problem_id,
      learnerId: row.learner_id,
      solution: row.solution,
      status: row.status,
      createdAt: row.created_at,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = AttemptRepository;
