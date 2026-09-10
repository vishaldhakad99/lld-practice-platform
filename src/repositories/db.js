const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _SQL = null;
let _db = null;
let _dbPath = null;

async function getSqlJs() {
  if (!_SQL) {
    _SQL = await require('sql.js')();
  }
  return _SQL;
}

function runMigrations(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      learner_id TEXT NOT NULL,
      solution TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      submitted_at TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS evaluation_results (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL UNIQUE,
      score INTEGER NOT NULL,
      dimensions TEXT NOT NULL,
      items TEXT NOT NULL,
      summary TEXT NOT NULL,
      evaluator_type TEXT NOT NULL,
      evaluated_at TEXT NOT NULL
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_attempts_learner ON attempts(learner_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_attempts_problem ON attempts(problem_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status)`);
}

async function initDb() {
  if (_db) return _db;
  const SQL = await getSqlJs();
  _dbPath = process.env.DB_PATH || path.join(DATA_DIR, 'lld.db');

  if (_dbPath === ':memory:' || !fs.existsSync(_dbPath)) {
    _db = new SQL.Database();
  } else {
    const buf = fs.readFileSync(_dbPath);
    _db = new SQL.Database(buf);
  }

  runMigrations(_db);
  return _db;
}

function getDb() {
  if (!_db) throw new Error('Database not initialized. Ensure initDb() was awaited at startup.');
  return _db;
}

function saveDb() {
  if (_db && _dbPath && _dbPath !== ':memory:') {
    const data = _db.export();
    fs.writeFileSync(_dbPath, Buffer.from(data));
  }
}

function closeDb() {
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

async function createTestDb() {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  runMigrations(db);
  return db;
}

module.exports = { initDb, getDb, saveDb, closeDb, createTestDb };
