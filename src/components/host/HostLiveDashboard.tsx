import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Clock,
  Play,
  Pause,
  Flag,
  Copy,
  Check,
  Sparkles,
  Download,
  Share2,
  HelpCircle,
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizRoom, QuizQuestion, StudentRecord } from '../../types/quiz';

interface HostLiveDashboardProps {
  roomId: string;
  hostToken: string;
  initialRoom?: QuizRoom | null;
  onExitRoom: () => void;
}

export const HostLiveDashboard: React.FC<HostLiveDashboardProps> = ({
  roomId,
  hostToken,
  initialRoom,
  onExitRoom,
}) => {
  const [roomData, setRoomData] = useState<QuizRoom | null>(initialRoom || null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQuestionKey, setShowQuestionKey] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const previousLeaderRef = useRef<string | null>(null);

  // Fetch full room data and leaderboard
  const refreshRoomData = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}?hostToken=${hostToken}`);
      if (res.ok) {
        const data = await res.json();
        // Fetch full leaderboard rankings
        const lbRes = await fetch(`/api/rooms/${roomId}/leaderboard`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          // Merge
          setRoomData((prev) => {
            const studentsMap: Record<string, StudentRecord> = {};
            lbData.rankings.forEach((s: StudentRecord) => {
              studentsMap[s.id] = s;
            });
            return {
              ...(prev || data),
              ...data,
              students: studentsMap,
            };
          });

          // Check if leader changed for confetti
          const topStudent = lbData.rankings.find((s: StudentRecord) => s.status === 'submitted');
          if (topStudent && topStudent.name !== previousLeaderRef.current && lbData.rankings.length > 1) {
            previousLeaderRef.current = topStudent.name;
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing room:', err);
    }
  };

  // Setup SSE stream and polling fallback
  useEffect(() => {
    refreshRoomData();

    // 1. Connect SSE
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/rooms/${roomId}/events`);
      eventSource.addEventListener('student_joined', (e: any) => {
        const payload = JSON.parse(e.data);
        setEventLog((prev) => [`👋 ${payload.student.name} joined the arena`, ...prev.slice(0, 15)]);
        refreshRoomData();
      });

      eventSource.addEventListener('student_submitted', (e: any) => {
        const payload = JSON.parse(e.data);
        setEventLog((prev) => [
          `🏆 ${payload.studentName} submitted with ${payload.accuracy}% accuracy (${payload.score} pts)`,
          ...prev.slice(0, 15),
        ]);
        refreshRoomData();
      });

      eventSource.addEventListener('status_changed', () => {
        refreshRoomData();
      });
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    // 2. Reliable Polling fallback
    const interval = setInterval(refreshRoomData, 2500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [roomId]);

  // Host Action: Change Status
  const handleUpdateStatus = async (newStatus: 'waiting' | 'active' | 'ended') => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostToken, status: newStatus }),
      });
      if (res.ok) {
        refreshRoomData();
        if (newStatus === 'ended') {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Host Action: Simulate Student Demo
  const handleSimulateStudent = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/simulate-student`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshRoomData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyStudentLink = () => {
    const studentUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openStudentTab = () => {
    window.open(`${window.location.origin}?room=${roomId}`, '_blank');
  };

  const exportCsv = () => {
    if (!roomData) return;
    const students = Object.values(roomData.students);
    const headers = 'Rank,Student Name,Status,Score,Accuracy (%),Time (seconds)\n';
    const rows = students
      .map(
        (s, i) =>
          `${s.rank || i + 1},"${s.name}",${s.status},${s.score},${s.accuracy}%,${s.timeTakenSeconds}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leaderboard_${roomData.title.replace(/\s+/g, '_')}_${roomId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studentsList = Object.values(roomData?.students || {}).sort((a, b) => {
    if (a.status === 'submitted' && b.status !== 'submitted') return -1;
    if (b.status === 'submitted' && a.status !== 'submitted') return 1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  const submittedStudents = studentsList.filter((s) => s.status === 'submitted');
  const top1 = submittedStudents[0];
  const top2 = submittedStudents[1];
  const top3 = submittedStudents[2];

  const avgScore =
    submittedStudents.length > 0
      ? Math.round(submittedStudents.reduce((acc, s) => acc + s.score, 0) / submittedStudents.length)
      : 0;

  const avgAccuracy =
    submittedStudents.length > 0
      ? Math.round(submittedStudents.reduce((acc, s) => acc + s.accuracy, 0) / submittedStudents.length)
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar: Room Code & Action Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Code and Status */}
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full lg:w-auto">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  roomData?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : roomData?.status === 'ended'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    roomData?.status === 'active'
                      ? 'bg-emerald-400 animate-pulse'
                      : roomData?.status === 'ended'
                      ? 'bg-purple-400'
                      : 'bg-amber-400 animate-ping'
                  }`}
                />
                {roomData?.status === 'active'
                  ? 'QUIZ IN PROGRESS'
                  : roomData?.status === 'ended'
                  ? 'FINALIZED'
                  : 'WAITING FOR PLAYERS'}
              </span>

              <span className="text-xs text-slate-400">
                {roomData?.questions?.length || 0} Questions
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {roomData?.settings?.timerMode === 'per-question'
                  ? `${roomData.settings.perQuestionSeconds || 30}s / question`
                  : roomData?.settings?.timerMode === 'per-quiz'
                  ? `${roomData.settings.totalQuizMinutes || 5} min total limit`
                  : 'Self-Paced'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              {roomData?.title || 'Live Quiz Arena'}
            </h2>

            {/* Room Code Display */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Room PIN:
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-indigo-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {roomId}
              </span>
              <button
                onClick={copyRoomCode}
                title="Copy Room PIN"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Host Controls */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full lg:w-auto">
          {roomData?.status === 'waiting' && (
            <button
              onClick={() => handleUpdateStatus('active')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Quiz Now</span>
            </button>
          )}

          {roomData?.status === 'active' && (
            <>
              <button
                onClick={() => handleUpdateStatus('ended')}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>End & Finalize</span>
              </button>
            </>
          )}

          {roomData?.status === 'ended' && (
            <button
              onClick={() => handleUpdateStatus('active')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Re-open Quiz</span>
            </button>
          )}

          {/* Quick student test action */}
          <button
            onClick={openStudentTab}
            title="Open Student Join screen in a new tab to test play"
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Join as Student</span>
          </button>

          {/* Demo simulate button */}
          <button
            onClick={handleSimulateStudent}
            disabled={isSimulating}
            title="Inject a demo student submission to see live rank shifts"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Demo Student</span>
          </button>

          <button
            onClick={copyStudentLink}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Copy Student Invite Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={exportCsv}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Export CSV Results"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Students Joined</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{studentsList.length}</p>
          <p className="text-xs text-slate-500">Connected in room</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Submissions</span>
            <Flag className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {submittedStudents.length}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {studentsList.length || 0}
            </span>
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${
                  studentsList.length > 0
                    ? Math.round((submittedStudents.length / studentsList.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Average Score</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{avgScore} pts</p>
          <p className="text-xs text-slate-500">Class performance mean</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Average Accuracy</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400">{avgAccuracy}%</p>
          <p className="text-xs text-slate-500">Correct answers ratio</p>
        </div>
      </div>

      {/* LEADERSHIP BOARD - Real-Time Rankings */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Real-Time Leadership Dashboard</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live standings ranked by Total Score, Accuracy %, and Completion Velocity
            </p>
          </div>

          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync Active
          </span>
        </div>

        {/* Podium for Top 3 (Shown if at least 1 student has submitted) */}
        {submittedStudents.length > 0 && (
          <div className="pt-2 pb-6 border-b border-slate-800/80">
            <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 sm:gap-4 items-end text-center">
              {/* 2nd Place (Silver) */}
              <div className="flex flex-col items-center">
                {top2 ? (
                  <div className="space-y-2 w-full">
                    <div className="relative inline-block">
                      <span className="text-3xl sm:text-4xl">{top2.avatar}</span>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-950 text-xs font-black flex items-center justify-center border border-white">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white truncate px-1">
                        {top2.name}
                      </p>
                      <p className="text-xs font-black text-slate-300">{top2.score} pts</p>
                    </div>
                    <div className="h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-slate-400 flex items-center justify-center text-slate-300 font-black text-sm">
                      2nd
                    </div>
                  </div>
                ) : (
                  <div className="w-full opacity-40">
                    <div className="text-2xl mb-2">🥈</div>
                    <div className="h-16 rounded-t-2xl bg-slate-800/40 border-t border-slate-700 flex items-center justify-center text-xs text-slate-500">
                      Empty
                    </div>
                  </div>
                )}
              </div>

              {/* 1st Place (Gold Champion) */}
              <div className="flex flex-col items-center -mt-4">
                {top1 ? (
                  <div className="space-y-2 w-full">
                    <div className="relative inline-block">
                      <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1 animate-bounce">
                        👑
                      </div>
                      <span className="text-4xl sm:text-5xl">{top1.avatar}</span>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center border-2 border-amber-200 shadow-md">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-black text-amber-300 truncate px-1">
                        {top1.name}
                      </p>
                      <p className="text-sm font-black text-white">{top1.score} pts</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        {top1.accuracy}% Accuracy
                      </span>
                    </div>
                    <div className="h-28 sm:h-32 rounded-t-2xl bg-gradient-to-t from-amber-600 to-amber-400 border-t-4 border-amber-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                      1st 🏆
                    </div>
                  </div>
                ) : (
                  <div className="w-full opacity-40">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="h-24 rounded-t-2xl bg-slate-800/40 border-t border-slate-700 flex items-center justify-center text-xs text-slate-500">
                      Waiting...
                    </div>
                  </div>
                )}
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="flex flex-col items-center">
                {top3 ? (
                  <div className="space-y-2 w-full">
                    <div className="relative inline-block">
                      <span className="text-3xl sm:text-4xl">{top3.avatar}</span>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center border border-amber-500">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white truncate px-1">
                        {top3.name}
                      </p>
                      <p className="text-xs font-black text-amber-500">{top3.score} pts</p>
                    </div>
                    <div className="h-16 sm:h-20 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-900/60 border-t-2 border-amber-700 flex items-center justify-center text-amber-500 font-black text-sm">
                      3rd
                    </div>
                  </div>
                ) : (
                  <div className="w-full opacity-40">
                    <div className="text-2xl mb-2">🥉</div>
                    <div className="h-14 rounded-t-2xl bg-slate-800/40 border-t border-slate-700 flex items-center justify-center text-xs text-slate-500">
                      Empty
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {studentsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-base font-semibold text-slate-400">
                      No students have joined yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Share the Room PIN <strong className="text-indigo-400">{roomId}</strong> or click "Join as Student" above.
                    </p>
                  </td>
                </tr>
              ) : (
                studentsList.map((st, index) => {
                  const isSubmitted = st.status === 'submitted';
                  const rank = st.rank || index + 1;
                  const isPodium = isSubmitted && rank <= 3;

                  return (
                    <tr
                      key={st.id}
                      className={`transition-colors ${
                        isPodium
                          ? rank === 1
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : rank === 2
                            ? 'bg-slate-300/5 hover:bg-slate-300/10'
                            : 'bg-amber-700/5 hover:bg-amber-700/10'
                          : 'hover:bg-slate-850'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isSubmitted ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                              rank === 1
                                ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                                : rank === 2
                                ? 'bg-slate-300 text-slate-950'
                                : rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{rank}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{st.avatar}</span>
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {st.name}
                              {rank === 1 && isSubmitted && (
                                <span className="text-xs text-amber-400">👑</span>
                              )}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              Joined {Math.round((Date.now() - st.joinedAt) / 1000)}s ago
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Solving...
                          </span>
                        )}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">
                              {st.accuracy}%
                            </span>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${
                                  st.accuracy >= 80
                                    ? 'bg-emerald-400'
                                    : st.accuracy >= 60
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                                }`}
                                style={{ width: `${st.accuracy}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-base font-black text-indigo-400">
                          {isSubmitted ? st.score : 0}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">pts</span>
                      </td>

                      {/* Time Taken */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {isSubmitted ? `${st.timeTakenSeconds}s` : 'active'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Questions & Explanations Key Accordion */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <button
          onClick={() => setShowQuestionKey(!showQuestionKey)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Review Questions, Correct Answers & Explanations Key
              </h4>
              <p className="text-xs text-slate-400">
                View verified explanations provided to students after they submit
              </p>
            </div>
          </div>
          {showQuestionKey ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showQuestionKey && roomData?.questions && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {roomData.questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h5 className="text-sm font-semibold text-white">
                      {q.questionText}
                    </h5>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Answer: Option {String.fromCharCode(65 + q.correctAnswerIndex)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-lg border ${
                        oIdx === q.correctAnswerIndex
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Explanation:
                  </span>
                  <p className="text-indigo-100 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Activity Feed */}
      {eventLog.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
          <span className="font-semibold uppercase tracking-wider text-slate-500">
            Live Stream Activity Log
          </span>
          <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-slate-300">
            {eventLog.map((log, i) => (
              <div key={i} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
