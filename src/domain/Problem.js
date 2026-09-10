class Problem {
  constructor({ id, title, difficulty, tags, description, requirements, hints, constraints }) {
    this.id = id;
    this.title = title;
    this.difficulty = difficulty;
    this.tags = tags || [];
    this.description = description;
    this.requirements = requirements || [];
    this.hints = hints || [];
    this.constraints = constraints || [];
  }

  validate() {
    if (!this.id) throw new Error('Problem must have an id');
    if (!this.title || this.title.trim() === '') throw new Error('Problem must have a title');
    if (!['Easy', 'Medium', 'Hard'].includes(this.difficulty)) {
      throw new Error(`Invalid difficulty: ${this.difficulty}`);
    }
    if (!this.description || this.description.trim() === '') throw new Error('Problem must have a description');
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      difficulty: this.difficulty,
      tags: this.tags,
      description: this.description,
      requirements: this.requirements,
      hints: this.hints,
      constraints: this.constraints,
    };
  }
}

module.exports = Problem;
