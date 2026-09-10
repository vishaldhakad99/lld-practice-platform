const BaseEvaluator = require('./BaseEvaluator');
const { EvaluationResult } = require('../domain/Feedback');
const https = require('https');

const SYSTEM_PROMPT = `You are a senior software engineer evaluating a Low-Level Design (LLD) submission.
Your job is to provide structured, fair, and actionable feedback on the candidate's design.
Focus exclusively on: class responsibilities, abstraction quality, interface design, design patterns, extensibility, and trade-off reasoning.
Do NOT penalise for missing HLD concerns like databases, deployment, or scaling.

Return a JSON object with this exact shape:
{
  "score": <integer 0-100>,
  "dimensions": {
    "abstraction": <0-100>,
    "responsibilities": <0-100>,
    "extensibility": <0-100>,
    "patterns": <0-100>,
    "tradeoffs": <0-100>
  },
  "items": [
    {
      "category": "<dimension name>",
      "observation": "<what you noticed>",
      "suggestion": "<concrete improvement>",
      "severity": "strength | info | warning | error"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}
Return ONLY valid JSON. No markdown fences.`;

class AIEvaluator extends BaseEvaluator {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  name() {
    return 'ai';
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async evaluate(attempt, problem) {
    if (!this.isAvailable()) {
      throw new Error('AI evaluator is not available: OPENAI_API_KEY not set');
    }

    const userMessage = [
      `Problem: ${problem.title}`,
      ``,
      `Problem Description:`,
      problem.description,
      ``,
      `Requirements:`,
      problem.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n'),
      ``,
      `Candidate Submission:`,
      attempt.solution,
    ].join('\n');

    const raw = await this._callOpenAI(userMessage);
    const parsed = this._parseResponse(raw);

    return new EvaluationResult({
      attemptId: attempt.id,
      score: this._clamp(parsed.score),
      dimensions: parsed.dimensions || {},
      items: parsed.items || [],
      summary: parsed.summary || '',
      evaluatorType: this.name(),
    });
  }

  _callOpenAI(userMessage) {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.openai.com',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(body),
          },
        },
        res => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode !== 200) {
              return reject(new Error(`OpenAI API error ${res.statusCode}: ${data}`));
            }
            try {
              const json = JSON.parse(data);
              resolve(json.choices[0].message.content);
            } catch (e) {
              reject(new Error('Failed to parse OpenAI response'));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  _parseResponse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`AI evaluator returned non-JSON response: ${raw.slice(0, 200)}`);
    }
  }
}

module.exports = AIEvaluator;
