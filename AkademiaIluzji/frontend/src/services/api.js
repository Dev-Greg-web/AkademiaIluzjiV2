// API Client for CARD MAGIC COACH (Akademia Iluzji Backend)

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
  // Profile & Onboarding
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  completeOnboarding: (data) => request('/profile/onboarding', { method: 'POST', body: JSON.stringify(data) }),

  // Techniques & Skill Tree
  getTechniques: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.track) query.append('track', params.track);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    if (params.skill_tree_level) query.append('skill_tree_level', params.skill_tree_level);
    const qs = query.toString();
    return request(`/techniques${qs ? `?${qs}` : ''}`);
  },
  getSkillTree: () => request('/techniques/skill-tree'),
  getTechnique: (id) => request(`/techniques/${id}`),
  createTechnique: (data) => request('/techniques', { method: 'POST', body: JSON.stringify(data) }),
  updateTechnique: (id, data) => request(`/techniques/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateMasterChecklist: (id, key, value) => request(`/techniques/${id}/master-checklist`, { method: 'PATCH', body: JSON.stringify({ key, value }) }),
  updateTechniqueMastery: (id, mastery_percentage) => request(`/techniques/${id}/mastery`, { method: 'PATCH', body: JSON.stringify({ mastery_percentage }) }),
  deleteTechnique: (id) => request(`/techniques/${id}`, { method: 'DELETE' }),

  // Problems
  addProblem: (techId, problem_text, priority = 'Medium', problem_tag = 'Tension') => 
    request(`/techniques/${techId}/problems`, { method: 'POST', body: JSON.stringify({ problem_text, priority, problem_tag }) }),
  updateProblem: (problemId, data) => request(`/problems/${problemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProblem: (problemId) => request(`/problems/${problemId}`, { method: 'DELETE' }),

  // Training & Recommendations
  getNextStep: () => request('/training/next-step'),
  getReviewNeeded: () => request('/training/review-needed'),
  generateTrainingPlan: (duration_minutes = 20) => request('/training/generate', { method: 'POST', body: JSON.stringify({ duration_minutes }) }),
  startTraining: () => request('/training/start', { method: 'POST' }),
  finishTraining: (data) => request('/training/finish', { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (limit = 30, offset = 0) => request(`/training/sessions?limit=${limit}&offset=${offset}`),

  // Quizzes
  getQuizzes: () => request('/quizzes'),
  getQuiz: (id) => request(`/quizzes/${id}`),
  submitQuiz: (id, answers) => request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // Achievements
  getAchievements: () => request('/achievements'),

  // Goals
  getGoals: () => request('/goals'),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoalProgress: (id, current_value, status = 'active') => request(`/goals/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ current_value, status }) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Routines & Generator
  getRoutines: () => request('/routines'),
  getGeneratedRoutines: (effect_type = 'all', difficulty = 'all') => 
    request(`/routines/generator?effect_type=${effect_type}&difficulty=${difficulty}`),
  getRoutine: (id) => request(`/routines/${id}`),
  createRoutine: (data) => request('/routines', { method: 'POST', body: JSON.stringify(data) }),
  updateRoutine: (id, data) => request(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoutine: (id) => request(`/routines/${id}`, { method: 'DELETE' }),

  // Performance Mode
  getPerformanceSessions: () => request('/performance/sessions'),
  recordPerformanceSession: (data) => request('/performance/sessions', { method: 'POST', body: JSON.stringify(data) }),

  // Video Recordings
  getVideos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.technique_id) query.append('technique_id', params.technique_id);
    if (params.routine_id) query.append('routine_id', params.routine_id);
    const qs = query.toString();
    return request(`/videos${qs ? `?${qs}` : ''}`);
  },
  saveVideo: (data) => request('/videos', { method: 'POST', body: JSON.stringify(data) }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  // Progress
  getProgressSummary: () => request('/progress/summary'),
  getActivity30Days: () => request('/progress/activity-30-days'),
  getTopTrained: () => request('/progress/top-trained'),
  getNeedsAttention: () => request('/progress/needs-attention'),
  getCategoriesBreakdown: () => request('/progress/categories'),

  // GPT Context
  getContext: (type = 'quick', custom_data = null) => 
    request('/context', { method: 'POST', body: JSON.stringify({ type, custom_data }) }),
  exportContextTxt: async (type = 'quick', custom_data = null) => {
    const res = await fetch(`${BASE_URL}/context/export-txt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, custom_data })
    });
    if (!res.ok) throw new Error('Błąd pobierania pliku kontekstu');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card_magic_coach_kontekst_${type}.txt`;
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
    a.download = `card_magic_coach_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  importJsonFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/settings/import-json`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Błąd importu pliku');
    }
    return await res.json();
  },
  resetDatabase: () => request('/settings/reset', { method: 'POST' })
};
