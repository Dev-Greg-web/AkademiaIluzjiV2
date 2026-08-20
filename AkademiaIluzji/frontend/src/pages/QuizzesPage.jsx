import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function QuizzesPage() {
  const { showToast, fireConfetti, refreshProfile } = useApp();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = async (quizId) => {
    try {
      setLoading(true);
      const data = await api.getQuiz(quizId);
      setActiveQuiz(data);
      setUserAnswers({});
      setQuizResult(null);
    } catch (err) {
      showToast('Błąd pobierania quizu: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionText) => {
    setUserAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionText
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz.id, userAnswers);
      setQuizResult(res);
      refreshProfile();
      if (res.passed) {
        fireConfetti();
        showToast(`Quiz zdany! Zdobywasz +${res.xp_earned} XP`, 'success', res.xp_earned);
      } else {
        showToast('Nie udało się osiągnąć progu 60%. Przeanalizuj błędy i spróbuj ponownie!', 'warning');
      }
    } catch (err) {
      showToast('Błąd wysyłania odpowiedzi: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧠</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">QUIZY I TESTY WIEDZY</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Sprawdź i utrwal wiedzę teoretyczną, biomechanikę chwytów oraz psychologię iluzji.
          </p>
        </div>
      </div>

      {/* Main Container */}
      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="bg-[#12131c] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {q.category}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    {q.questions_count} pytań • +{q.xp_reward} XP
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{q.title}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{q.description || 'Brak opisu.'}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
                <span className="text-xs text-zinc-300">
                  {q.attempts_count > 0 ? `Najlepszy wynik: ${q.best_score}/${q.questions_count}` : 'Jeszcze nierozwiązywany'}
                </span>

                <button
                  onClick={() => handleStartQuiz(q.id)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Rozpocznij Test →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Active Quiz Screen */
        <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Kategoria: {activeQuiz.category}
              </span>
              <h2 className="text-xl font-bold text-white">{activeQuiz.title}</h2>
            </div>

            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
                fetchQuizzes();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-750 hover:text-white"
            >
              ← Powrót do listy
            </button>
          </div>

          {/* If Result Available */}
          {quizResult && (
            <div className={`p-5 rounded-2xl border text-center space-y-2 ${
              quizResult.passed ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}>
              <span className="text-3xl block">{quizResult.passed ? '🎉' : '⚠️'}</span>
              <h3 className="text-base font-extrabold">
                {quizResult.passed ? 'GRATULACJE! QUIZ ZDANY!' : 'NIESTETY NIE UDAŁO SIĘ ZDAĆ'}
              </h3>
              <p className="text-xs text-zinc-200">
                Twój wynik: <strong className="text-white text-sm">{quizResult.score} / {quizResult.total_questions}</strong> ({quizResult.percentage}%)
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-6">
            {activeQuiz.questions?.map((q, idx) => {
              const resItem = quizResult?.results?.find(r => r.question_id === q.id);

              return (
                <div key={q.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-100">{q.question_text}</h4>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {q.options?.map((opt, oIdx) => {
                      const isSelected = userAnswers[String(q.id)] === opt;
                      let btnStyle = 'bg-zinc-850 border-zinc-800 text-zinc-300 hover:border-zinc-700';

                      if (quizResult && resItem) {
                        if (opt.toLowerCase() === resItem.correct_answer.toLowerCase()) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isSelected && !resItem.is_correct) {
                          btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 line-through';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={!!quizResult}
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSelected && <span className="text-amber-400 font-bold">●</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation if result shown */}
                  {resItem && (
                    <div className="text-xs text-zinc-300 bg-black/40 p-3 rounded-xl border border-zinc-800/80 leading-relaxed mt-2">
                      💡 <strong className="text-zinc-200">Wyjaśnienie:</strong> {resItem.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!quizResult ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting || Object.keys(userAnswers).length < (activeQuiz.questions?.length || 1)}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs shadow-lg transition-all ${
                Object.keys(userAnswers).length >= (activeQuiz.questions?.length || 1)
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Sprawdzanie...' : 'Sprawdź Odpowiedzi i Odbierz XP →'}
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
                fetchQuizzes();
              }}
              className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-2xl transition-all"
            >
              Zakończ i Wróć do Listy Quizów
            </button>
          )}

        </div>
      )}

    </div>
  );
}
