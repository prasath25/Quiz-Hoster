import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  AlertTriangle,
  Zap,
  Hourglass,
  Timer
} from 'lucide-react';
import { QuizQuestion, SubmissionResult, RoomSettings } from '../../types/quiz';

interface StudentQuizPlayerProps {
  roomId: string;
  studentId: string;
  studentName: string;
  avatar: string;
  roomTitle: string;
  settings?: RoomSettings;
  questions: QuizQuestion[];
  onCompleted: (result: SubmissionResult) => void;
}

export const StudentQuizPlayer: React.FC<StudentQuizPlayerProps> = ({
  roomId,
  studentId,
  studentName,
  avatar,
  roomTitle,
  settings,
  questions,
  onCompleted,
}) => {
  const timerMode = settings?.timerMode || 'none';
  const perQuestionLimit = settings?.perQuestionSeconds || 30;
  const totalQuizLimit = (settings?.totalQuizMinutes || 5) * 60;
  const autoAdvance = settings?.autoAdvanceOnTimeout ?? true;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [questionTimeMap, setQuestionTimeMap] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Per-question countdown state
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number>(perQuestionLimit);

  // Per-quiz countdown state
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(totalQuizLimit);

  // Status & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeoutAlert, setTimeoutAlert] = useState<string | null>(null);

  const questionStartTimeRef = useRef(Date.now());
  const hasAutoSubmittedRef = useRef(false);

  // Core submission handler
  const performSubmit = useCallback(
    async (isTimeout = false) => {
      if (hasAutoSubmittedRef.current || isSubmitting) return;
      hasAutoSubmittedRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      // Record time for current question
      const currentQ = questions[currentIndex];
      const finalTimeMap = { ...questionTimeMap };
      if (currentQ) {
        const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
        finalTimeMap[currentQ.id] = (finalTimeMap[currentQ.id] || 0) + timeSpent;
      }

      const payloadAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
        timeTakenSeconds: finalTimeMap[q.id] || 5,
      }));

      try {
        const res = await fetch(`/api/rooms/${roomId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            answers: payloadAnswers,
            totalTimeSeconds: elapsedSeconds,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to submit quiz.');
        }

        const result: SubmissionResult = await res.json();
        onCompleted(result);
      } catch (err: any) {
        console.error(err);
        hasAutoSubmittedRef.current = false;
        setSubmitError(err.message || 'Failed to submit. Please try again.');
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      questions,
      currentIndex,
      questionTimeMap,
      selectedAnswers,
      roomId,
      studentId,
      elapsedSeconds,
      onCompleted,
    ]
  );

  // Switch question helper
  const handleSwitchQuestion = useCallback(
    (newIndex: number) => {
      const currentQ = questions[currentIndex];
      if (currentQ) {
        const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
        setQuestionTimeMap((prev) => ({
          ...prev,
          [currentQ.id]: (prev[currentQ.id] || 0) + timeSpent,
        }));
      }
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(newIndex);
      // Reset per-question countdown
      setQuestionTimeRemaining(perQuestionLimit);
    },
    [currentIndex, questions, perQuestionLimit]
  );

  // 1. Elapsed stopwatch timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Per-quiz total countdown
  useEffect(() => {
    if (timerMode !== 'per-quiz') return;

    const timer = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeoutAlert("Time's up! Submitting your answers automatically...");
          performSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerMode, performSubmit]);

  // 3. Per-question countdown
  useEffect(() => {
    if (timerMode !== 'per-question') return;

    const timer = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timeout reached for this question
          if (autoAdvance) {
            if (currentIndex < questions.length - 1) {
              setTimeoutAlert(`⏰ Time's up for Question ${currentIndex + 1}! Moving to next.`);
              setTimeout(() => setTimeoutAlert(null), 3000);
              handleSwitchQuestion(currentIndex + 1);
            } else {
              setTimeoutAlert("⏰ Time's up on the final question! Submitting your quiz...");
              performSubmit(true);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerMode, autoAdvance, currentIndex, questions.length, handleSwitchQuestion, performSubmit]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const currentQuestion = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length;

  // Format seconds MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer color indicator calculation
  let timerDisplay = '';
  let timerPercent = 100;
  let isUrgent = false;
  let isWarning = false;

  if (timerMode === 'per-question') {
    timerDisplay = `${questionTimeRemaining}s`;
    timerPercent = (questionTimeRemaining / perQuestionLimit) * 100;
    isWarning = questionTimeRemaining <= 10 && questionTimeRemaining > 5;
    isUrgent = questionTimeRemaining <= 5;
  } else if (timerMode === 'per-quiz') {
    timerDisplay = formatTime(quizTimeRemaining);
    timerPercent = (quizTimeRemaining / totalQuizLimit) * 100;
    isWarning = quizTimeRemaining <= 60 && quizTimeRemaining > 20;
    isUrgent = quizTimeRemaining <= 20;
  } else {
    timerDisplay = formatTime(elapsedSeconds);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Timeout Alert Banner */}
      {timeoutAlert && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{timeoutAlert}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-amber-500/30 px-2 py-0.5 rounded text-amber-300">
            Auto-Handled
          </span>
        </div>
      )}

      {/* Top Bar: Progress, Student Avatar & Countdown Timer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-1.5 rounded-xl bg-slate-950 border border-slate-800">
            {avatar}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-1">{studentName}</h3>
            <span className="text-xs text-indigo-400 font-medium">
              Question {currentIndex + 1} of {totalCount}
            </span>
          </div>
        </div>

        {/* TIMER DISPLAY */}
        <div className="flex items-center gap-3">
          {/* Countdown Clock Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-black transition-all ${
              isUrgent
                ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50 scale-105'
                : isWarning
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            {timerMode === 'per-question' ? (
              <Zap
                className={`w-3.5 h-3.5 ${
                  isUrgent ? 'text-rose-400 animate-bounce' : 'text-indigo-400'
                }`}
              />
            ) : timerMode === 'per-quiz' ? (
              <Hourglass
                className={`w-3.5 h-3.5 ${
                  isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'
                }`}
              />
            ) : (
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            )}

            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-semibold leading-none">
                {timerMode === 'per-question'
                  ? 'Question Timer'
                  : timerMode === 'per-quiz'
                  ? 'Quiz Countdown'
                  : 'Time Elapsed'}
              </span>
              <span className="text-sm leading-tight">{timerDisplay}</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Visual Countdown Progress Bar (if in countdown mode) */}
      {timerMode !== 'none' && (
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              isUrgent
                ? 'bg-rose-500 shadow-md shadow-rose-500'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, timerPercent))}%` }}
          />
        </div>
      )}

      {/* Question Progress Dots */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAns = selectedAnswers[q.id] !== undefined;
          const isCurr = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => handleSwitchQuestion(idx)}
              className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                isCurr
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/50'
                  : isAns
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-indigo-400">
                Multiple Choice
              </span>
              {timerMode === 'per-question' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {perQuestionLimit}s limit
                </span>
              )}
            </div>
            <span className="font-mono">{currentQuestion.points || 100} Points</span>
          </div>

          {/* Question Prompt */}
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQuestion.questionText}
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {currentQuestion.options.map((option, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isOptionSelected = selectedAnswers[currentQuestion.id] === oIdx;

              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                  className={`group w-full p-4 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-4 border ${
                    isOptionSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      isOptionSelected
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-medium leading-normal flex-1">
                    {option}
                  </span>
                  {isOptionSelected && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSwitchQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {answeredCount} of {totalCount} answered
            </span>

            {currentIndex < totalCount - 1 ? (
              <button
                onClick={() => handleSwitchQuestion(currentIndex + 1)}
                className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Review & Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-white">Ready to Submit Quiz?</h3>
              <p className="text-xs text-slate-400">
                You have answered <strong className="text-white">{answeredCount}</strong> of{' '}
                <strong className="text-white">{totalCount}</strong> questions.
              </p>
            </div>

            {answeredCount < totalCount && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  You still have {totalCount - answeredCount} unanswered questions.
                </span>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {submitError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Keep Reviewing
              </button>

              <button
                type="button"
                onClick={() => performSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Yes, Submit!</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
