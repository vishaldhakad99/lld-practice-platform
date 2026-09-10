const API = {
  async get(path) {
    const r = await fetch(path);
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || 'Request failed');
    return json;
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || 'Request failed');
    return json;
  },
  async patch(path, body) {
    const r = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || 'Request failed');
    return json;
  },
};

const state = {
  learnerId: localStorage.getItem('lld_learner') || '',
  problems: [],
  currentProblem: null,
  currentAttemptId: null,
  draftTimer: null,
};

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  
  document.getElementById('view-' + id).classList.add('active');
  window.scrollTo(0, 0);
}

function toast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function loadProblems() {
  const { problems } = await API.get('/api/problems');
  state.problems = problems;
  renderProblems(problems);
  document.getElementById('problems-wrap').style.display = '';
}

function renderProblems(problems) {
  const grid = document.getElementById('problem-grid');
  grid.innerHTML = problems.map(p => `
    <div class="problem-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.title}">
      <div class="pc-header">
        <div class="pc-title">${p.title}</div>
        <span class="difficulty-badge ${p.difficulty}">${p.difficulty}</span>
      </div>
      <p class="pc-desc">${p.description}</p>
      <div class="pc-tags">${p.tags.map(t => `<span class="pc-tag">${t}</span>`).join('')}</div>
      <div class="pc-cta">Start Attempt &rarr;</div>
    </div>
  `).join('');



  
  grid.querySelectorAll('.problem-card').forEach(card => {
    const open = () => openAttempt(card.dataset.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

async function openAttempt(problemId) {
  const problem = state.problems.find(p => p.id === problemId);
  if (!problem) return;
  state.currentProblem = problem;

  document.getElementById('attempt-problem-title').textContent = problem.title;
  const db = document.getElementById('attempt-difficulty');
  db.textContent = problem.difficulty;
  db.className = `difficulty-badge ${problem.difficulty}`;

  

  document.getElementById('prob-description').textContent = problem.description;
  document.getElementById('prob-requirements').innerHTML =
    problem.requirements.map(r => `<li>${r}</li>`).join('');
  document.getElementById('prob-hints').innerHTML =
    problem.hints.map(h => `<li>${h}</li>`).join('');

  
  document.getElementById('prob-constraints').innerHTML =
    problem.constraints.map(c => `<li>${c}</li>`).join('');

  document.getElementById('solution-editor').value = '';
  document.getElementById('char-count').textContent = '0 chars';
  document.getElementById('editor-status').textContent = '';
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('submit-btn').innerHTML = 'Submit for Feedback';

  try {
    const { attempt } = await API.post('/api/attempts', {
      problemId,
      learnerId: state.learnerId,
    });
    state.currentAttemptId = attempt.id;
  } catch (err) {
    toast('Failed to start attempt: ' + err.message);
    return;
  }

  showView('attempt');
}

function setupEditor() {
  const editor = document.getElementById('solution-editor');
  const counter = document.getElementById('char-count');


  
  const status = document.getElementById('editor-status');

  editor.addEventListener('input', () => {
    counter.textContent = editor.value.length + ' chars';
    clearTimeout(state.draftTimer);
    state.draftTimer = setTimeout(() => autosaveDraft(editor.value, status), 1800);
  });

  document.getElementById('save-draft-btn').addEventListener('click', () => {
    autosaveDraft(editor.value, status, true);
  });

  document.getElementById('submit-btn').addEventListener('click', () => submitSolution());
}

async function autosaveDraft(solution, statusEl, manual = false) {
  if (!state.currentAttemptId) return;
  statusEl.textContent = 'Saving...';
  statusEl.className = 'editor-status status-saving';
  try {
    await API.patch(`/api/attempts/${state.currentAttemptId}/draft`, { solution });
    statusEl.textContent = manual ? 'Draft saved.' : 'Draft auto-saved.';


    
    statusEl.className = 'editor-status status-saved';
    if (manual) toast('Draft saved.');
  } catch (err) {
    statusEl.textContent = 'Save failed: ' + err.message;
    statusEl.className = 'editor-status status-error';
  }
}

async function submitSolution() {
  const solution = document.getElementById('solution-editor').value;
  if (solution.trim().length < 50) {
    toast('Solution must be at least 50 characters.');
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Evaluating...';
  document.getElementById('editor-status').textContent = '';

  try {
    await API.patch(`/api/attempts/${state.currentAttemptId}/draft`, { solution });
    const { evaluation } = await API.post(`/api/attempts/${state.currentAttemptId}/submit`, {});
    showFeedback(evaluation);
  } catch (err) {
    toast('Submission failed: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = 'Submit for Feedback';
  }
}

async function showFeedback(evaluation) {
  document.getElementById('fb-problem-title').textContent = state.currentProblem?.title || '';

  const score = evaluation.score;
  const grade = evaluation.grade;
  document.getElementById('score-num').textContent = score;
  document.getElementById('score-grade').textContent = 'Grade ' + grade;
  document.getElementById('score-summary').textContent = evaluation.summary;

  const circumference = 327;
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => {
    document.getElementById('ring-fill').style.strokeDashoffset = offset;
  }, 100);

  const dimEl = document.getElementById('dimensions');
  dimEl.innerHTML = Object.entries(evaluation.dimensions || {}).map(([k, v]) => `
    <div class="dim-item">
      <div class="dim-name">${k}</div>
      <div class="dim-score">${v}</div>
      <div class="dim-bar"><div class="dim-bar-fill" style="width:${v}%"></div></div>
    </div>
  `).join('');

  const itemsEl = document.getElementById('feedback-items');
  const items = evaluation.items || [];
  if (items.length === 0) {
    itemsEl.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">No detailed feedback items.</p>';
  } else {
    itemsEl.innerHTML = items.map(item => `
      <div class="fi-card ${item.severity || 'info'}">
        <div class="fi-header">
          <span class="fi-cat ${item.severity || 'info'}">${item.category}</span>
          ${item.source ? `<span class="fi-source">${item.source}</span>` : ''}
        </div>
        <div class="fi-obs">${item.observation}</div>
        <div class="fi-sug">${item.suggestion}</div>
      </div>
    `).join('');
  }

  await loadHistory();
  showView('feedback');
}

async function loadHistory() {
  const listEl = document.getElementById('history-list');
  try {
    const { history } = await API.get(
      `/api/attempts?learnerId=${encodeURIComponent(state.learnerId)}&problemId=${state.currentProblem?.id || ''}`
    );
    if (!history.length) {
      listEl.innerHTML = '<div class="empty-history">No previous attempts yet.</div>';
      return;
    }
    listEl.innerHTML = history.map((h, i) => {
      const a = h.attempt;
      const score = h.feedback ? h.feedback.score : null;
      return `
        <div class="hist-item" data-attempt-id="${a.id}">
          <div class="hist-num">#${history.length - i}</div>
          <div class="hist-meta">
            <div class="hist-time">${timeAgo(a.submittedAt || a.createdAt)}</div>
            <div class="hist-status">${a.status}</div>
          </div>
          <div class="hist-score">${score !== null ? score + '/100' : '—'}</div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.hist-item').forEach(item => {
      item.addEventListener('click', () => loadPastAttempt(item.dataset.attemptId));
    });
  } catch (err) {
    listEl.innerHTML = '<div class="empty-history">Could not load history.</div>';
  }
}

async function loadPastAttempt(attemptId) {
  try {
    const { attempt, feedback } = await API.get(`/api/attempts/${attemptId}`);
    if (feedback) {
      state.currentAttemptId = attempt.id;
      showFeedback(feedback);
    }
  } catch (err) {
    toast('Could not load attempt: ' + err.message);
  }
}

function setupNav() {
  document.getElementById('back-to-problems').addEventListener('click', () => showView('home'));
  document.getElementById('back-from-feedback').addEventListener('click', () => {
    if (state.currentProblem) {
      openAttempt(state.currentProblem.id);
    } else {
      showView('home');
    }
  });
}

function setupLearnerForm() {
  const input = document.getElementById('learner-input');
  const btn = document.getElementById('start-btn');
  const badge = document.getElementById('learner-badge');

  if (state.learnerId) {
    input.value = state.learnerId;
    badge.textContent = state.learnerId;
    loadProblems();
  }

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) { toast('Enter your name or ID to continue.'); return; }
    state.learnerId = val;
    localStorage.setItem('lld_learner', val);
    badge.textContent = val;
    loadProblems();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupLearnerForm();
  setupEditor();
  setupNav();
  showView('home');
});
