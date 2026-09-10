process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { initDb, closeDb } = require('../../src/repositories/db');
const { createApp } = require('../../src/app');

let app;

beforeAll(async () => {
  await initDb();
  app = createApp();
});

afterAll(() => {
  closeDb();
});

describe('POST /api/attempts', () => {
  test('creates a new attempt for a valid problem', async () => {
    const res = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'parking-lot', learnerId: 'vishal' });
    expect(res.status).toBe(201);
    expect(res.body.attempt).toHaveProperty('id');
    expect(res.body.attempt.status).toBe('DRAFT');
    expect(res.body.attempt.problemId).toBe('parking-lot');
  });

  test('returns 400 when problemId is missing', async () => {
    const res = await request(app)
      .post('/api/attempts')
      .send({ learnerId: 'vishal' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when learnerId is missing', async () => {
    const res = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'parking-lot' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for a non-existent problem', async () => {
    const res = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'does-not-exist', learnerId: 'vishal' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/attempts/:id/draft', () => {
  test('saves draft solution and returns updated attempt', async () => {
    const create = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'parking-lot', learnerId: 'drafter' });
    const id = create.body.attempt.id;

    const res = await request(app)
      .patch(`/api/attempts/${id}/draft`)
      .send({ solution: 'Here is my draft design for the parking lot.' });
    expect(res.status).toBe(200);
    expect(res.body.attempt.solution).toBe('Here is my draft design for the parking lot.');
  });

  test('returns 400 when solution field is missing', async () => {
    const create = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'parking-lot', learnerId: 'drafter2' });
    const id = create.body.attempt.id;

    const res = await request(app)
      .patch(`/api/attempts/${id}/draft`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for unknown attempt id', async () => {
    const res = await request(app)
      .patch('/api/attempts/unknown-id/draft')
      .send({ solution: 'Some solution' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/attempts/:id', () => {
  test('returns attempt with null feedback when not yet evaluated', async () => {
    const create = await request(app)
      .post('/api/attempts')
      .send({ problemId: 'elevator-system', learnerId: 'getter' });
    const id = create.body.attempt.id;

    const res = await request(app).get(`/api/attempts/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.attempt.id).toBe(id);
    expect(res.body.feedback).toBeNull();
  });

  test('returns 404 for unknown attempt id', async () => {
    const res = await request(app).get('/api/attempts/totally-fake-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/attempts?learnerId=', () => {
  test('returns history for a learner', async () => {
    await request(app)
      .post('/api/attempts')
      .send({ problemId: 'parking-lot', learnerId: 'history-user' });

    const res = await request(app).get('/api/attempts?learnerId=history-user');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history.length).toBeGreaterThan(0);
    expect(res.body.history[0]).toHaveProperty('attempt');
  });

  test('returns empty history for unknown learner', async () => {
    const res = await request(app).get('/api/attempts?learnerId=nobody-here');
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(0);
  });

  test('returns 400 when learnerId is not provided', async () => {
    const res = await request(app).get('/api/attempts');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/problems', () => {
  test('returns list of problems with required fields', async () => {
    const res = await request(app).get('/api/problems');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.problems)).toBe(true);
    expect(res.body.problems.length).toBeGreaterThan(0);
    expect(res.body.problems[0]).toHaveProperty('id');
    expect(res.body.problems[0]).toHaveProperty('title');
  });

  test('returns a specific problem by id', async () => {
    const res = await request(app).get('/api/problems/parking-lot');
    expect(res.status).toBe(200);
    expect(res.body.problem.id).toBe('parking-lot');
  });

  test('returns 404 for unknown problem id', async () => {
    const res = await request(app).get('/api/problems/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/health', () => {
  test('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
