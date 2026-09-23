import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SubmissionResult, StudentRecord } from '../../types/quiz';

interface StudentResultsReviewProps {
  roomId: string;
  studentId: string;
  studentName: string;
  avatar: string;
  result: SubmissionResult;
  onExit: () => void;
}

export const StudentResultsReview: React.FC<StudentResultsReviewProps> = ({
  roomId,
  studentId,
  studentName,
  avatar,
  result,
  onExit,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [leaderboard, setLeaderboard] = useState<StudentRecord[]>([]);
  const [liveRank, setLiveRank] = useState(result.rank);

  // Trigger celebration on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Poll live leaderboard to keep student's rank live as others finish
    const fetchLiveLeaderboard = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.rankings || []);
          const me = data.rankings?.find((s: StudentRecord) => s.id === studentId);
          if (me?.rank) {
            setLiveRank(me.rank);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLiveLeaderboard();
    const interval = setInterval(fetchLiveLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [roomId, studentId]);

  const filteredItems = (result.reviewItems || []).filter((item) => {
    if (filter === 'correct') return item.isCorrect;
    if (filter === 'incorrect') return !item.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Celebration Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <span className="text-5xl sm:text-6xl p-3 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl inline-block">
                {avatar}
              </span>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-md">
                #{liveRank}
              </span>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Quiz Submitted Successfully
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Great Effort, {studentName}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                You placed <strong className="text-amber-300">Rank #{liveRank}</strong> on the live leaderboard.
              </p>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Lobby</span>
          </button>
        </div>

        {/* Score & KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Score
            </span>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {result.score}{' '}
              <span className="text-xs text-slate-500 font-normal">/ {result.totalPoints}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Accuracy
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{result.accuracy}%</p>
            <p className="text-[11px] text-slate-500">
              {result.correctCount} of {result.totalQuestions} correct
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Completion Time
            </span>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {result.timeTakenSeconds}s
            </p>
            <p className="text-[11px] text-slate-500">Speed & accuracy scored</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Current Rank
            </span>
            <p className="text-2xl font-black text-amber-300 mt-1">
              #{liveRank}{' '}
              <span className="text-xs text-slate-500 font-normal">
                of {leaderboard.length || result.totalStudents}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: In-Depth Question & Correct Answer Review with Explanations */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Right Answers & Pedagogical Explanations</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review correct answers, your selections, and detailed conceptual explanations for each item.
            </p>
          </div>

          {/* Filter Pill */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({result.totalQuestions})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({result.correctCount})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'incorrect'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Incorrect ({result.totalQuestions - result.correctCount})
            </button>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const q = item.question;
            const studentChoice = item.studentAnswer?.selectedIndex ?? -1;
            const isCorrect = item.isCorrect;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border transition-all space-y-5 ${
                  isCorrect
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-slate-900/90 border-rose-500/30'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white leading-snug">
                      {q.questionText}
                    </h4>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                      isCorrect
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+{q.points || 100})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Missed (0 pts)</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((option, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isOfficialRight = oIdx === q.correctAnswerIndex;
                    const isMyPick = oIdx === studentChoice;

                    let cardStyle = 'bg-slate-950/60 border-slate-800/80 text-slate-300';
                    let letterStyle = 'bg-slate-800 text-slate-400';

                    if (isOfficialRight) {
                      cardStyle =
                        'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm';
                      letterStyle = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isMyPick && !isCorrect) {
                      cardStyle =
                        'bg-rose-950/40 border-rose-500/50 text-rose-200 font-semibold';
                      letterStyle = 'bg-rose-500 text-white font-black';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-colors ${cardStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${letterStyle}`}
                        >
                          {letter}
                        </span>

                        <span className="flex-1 leading-normal">{option}</span>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMyPick && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Your Pick
                            </span>
                          )}

                          {isOfficialRight && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                              Right Answer ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PEDAGOGICAL EXPLANATION BOX */}
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>In-Depth Explanation & Key Concept:</span>
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed font-normal">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Mini Leaderboard for Student */}
      {leaderboard.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Room Standings</span>
            </h4>
            <span className="text-xs text-slate-400">
              {leaderboard.filter((s) => s.status === 'submitted').length} /{' '}
              {leaderboard.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((st, i) => {
              const isMe = st.id === studentId;
              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isMe
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono text-slate-400 font-bold">
                      #{st.rank || i + 1}
                    </span>
                    <span className="text-lg">{st.avatar}</span>
                    <span className="font-semibold">{st.name}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-bold">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-indigo-300 font-bold">{st.score} pts</span>
                    <span className="text-slate-400 font-mono">{st.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
