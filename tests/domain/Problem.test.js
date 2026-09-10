const Problem = require('../../src/domain/Problem');

const VALID = {
  id: 'parking-lot',
  title: 'Design a Parking Lot',
  difficulty: 'Medium',
  description: 'Design an OO parking lot system.',
  requirements: ['Multi-floor support'],
  hints: [],
  constraints: [],
  tags: ['OOP'],
};

describe('Problem', () => {
  test('constructs with required fields', () => {
    const p = new Problem(VALID);
    expect(p.id).toBe('parking-lot');
    expect(p.title).toBe('Design a Parking Lot');
    expect(p.difficulty).toBe('Medium');
    expect(p.tags).toEqual(['OOP']);
  });

  test('defaults tags, hints, constraints to empty arrays when not provided', () => {
    const p = new Problem({ ...VALID, tags: undefined, hints: undefined, constraints: undefined });
    expect(p.tags).toEqual([]);
    expect(p.hints).toEqual([]);
    expect(p.constraints).toEqual([]);
  });

  test('validate() returns true for a valid problem', () => {
    const p = new Problem(VALID);
    expect(p.validate()).toBe(true);
  });

  test('validate() throws when id is missing', () => {
    const p = new Problem({ ...VALID, id: '' });
    expect(() => p.validate()).toThrow('must have an id');
  });

  test('validate() throws when title is blank', () => {
    const p = new Problem({ ...VALID, title: '   ' });
    expect(() => p.validate()).toThrow('must have a title');
  });

  test('validate() throws for unknown difficulty', () => {
    const p = new Problem({ ...VALID, difficulty: 'VeryHard' });
    expect(() => p.validate()).toThrow('Invalid difficulty');
  });

  test('validate() throws when description is blank', () => {
    const p = new Problem({ ...VALID, description: '' });
    expect(() => p.validate()).toThrow('must have a description');
  });

  test('toJSON() returns a plain object with all fields', () => {
    const p = new Problem(VALID);
    const json = p.toJSON();
    expect(json).toMatchObject({
      id: 'parking-lot',
      title: 'Design a Parking Lot',
      difficulty: 'Medium',
    });
    expect(json).not.toBeInstanceOf(Problem);
  });
});
