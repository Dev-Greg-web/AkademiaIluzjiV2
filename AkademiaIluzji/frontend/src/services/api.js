// API Client for Akademia Iluzji Backend

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Błąd serwera (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Techniques
  getTechniques: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    const qs = query.toString();
    return request(`/techniques${qs ? `?${qs}` : ''}`);
  },
  getTechnique: (id) => request(`/techniques/${id}`),
  createTechnique: (data) => request('/techniques', { method: 'POST', body: JSON.stringify(data) }),
  updateTechnique: (id, data) => request(`/techniques/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTechniqueLevel: (id, user_level) => request(`/techniques/${id}/level`, { method: 'PATCH', body: JSON.stringify({ user_level }) }),
  deleteTechnique: (id) => request(`/techniques/${id}`, { method: 'DELETE' }),

  // Problems
  addProblem: (techId, problem_text) => request(`/techniques/${techId}/problems`, { method: 'POST', body: JSON.stringify({ problem_text }) }),
  updateProblem: (problemId, data) => request(`/problems/${problemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProblem: (problemId) => request(`/problems/${problemId}`, { method: 'DELETE' }),

  // Training
  generateTrainingPlan: (duration_minutes = 30) => request('/training/generate', { method: 'POST', body: JSON.stringify({ duration_minutes }) }),
  startTraining: () => request('/training/start', { method: 'POST' }),
  finishTraining: (data) => request('/training/finish', { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (limit = 30, offset = 0) => request(`/training/sessions?limit=${limit}&offset=${offset}`),

  // Routines
  getRoutines: () => request('/routines'),
  getRoutine: (id) => request(`/routines/${id}`),
  createRoutine: (data) => request('/routines', { method: 'POST', body: JSON.stringify(data) }),
  updateRoutine: (id, data) => request(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoutine: (id) => request(`/routines/${id}`, { method: 'DELETE' }),

  // Progress
  getProgressSummary: () => request('/progress/summary'),
  getActivity30Days: () => request('/progress/activity-30-days'),
  getTopTrained: () => request('/progress/top-trained'),
  getNeedsAttention: () => request('/progress/needs-attention'),
  getCategoriesBreakdown: () => request('/progress/categories'),

  // GPT Context
  getContext: (type = 'quick') => request(`/context?type=${type}`),
  exportContextTxt: async (type = 'quick') => {
    const res = await fetch(`${BASE_URL}/context/export-txt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    if (!res.ok) throw new Error('Błąd pobierania pliku');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akademia_iluzji_kontekst_${type}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Notes
  getNotes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.technique_id) query.append('technique_id', params.technique_id);
    if (params.routine_id) query.append('routine_id', params.routine_id);
    const qs = query.toString();
    return request(`/notes${qs ? `?${qs}` : ''}`);
  },
  createNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Settings / Backup
  exportJson: async () => {
    const res = await fetch(`${BASE_URL}/settings/export-json`);
    if (!res.ok) throw new Error('Błąd eksportu bazy');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akademia_iluzji_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  importJson: (jsonData) => request('/settings/import-json', { method: 'POST', body: JSON.stringify(jsonData) }),
  resetDatabase: () => request('/settings/reset', { method: 'POST' })
};
