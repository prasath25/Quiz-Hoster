import React, { useEffect, useState } from 'react';
import { Users, Clock, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StudentWaitingLobbyProps {
  roomId: string;
  studentId: string;
  studentName: string;
  avatar: string;
  roomTitle: string;
  onQuizStarted: () => void;
}

export const StudentWaitingLobby: React.FC<StudentWaitingLobbyProps> = ({
  roomId,
  studentId,
  studentName,
  avatar,
  roomTitle,
  onQuizStarted,
}) => {
  const [participantCount, setParticipantCount] = useState(1);
  const [questionCount, setQuestionCount] = useState(5);
  const [timerBadge, setTimerBadge] = useState<string>('Self-Paced');

  useEffect(() => {
    // Poll room status every 2 seconds
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}?studentId=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setParticipantCount(data.studentCount || 1);
          setQuestionCount(data.questionCount || 5);
          if (data.settings?.timerMode === 'per-question') {
            setTimerBadge(`⚡ ${data.settings.perQuestionSeconds || 30}s Countdown Per Question`);
          } else if (data.settings?.timerMode === 'per-quiz') {
            setTimerBadge(`⏳ ${data.settings.totalQuizMinutes || 5} Mins Total Quiz Timer`);
          } else {
            setTimerBadge('🧘 Self-Paced (Untimed)');
          }

          if (data.status === 'active') {
            onQuizStarted();
          }
        }
      } catch (err) {
        console.error('Error polling room in lobby:', err);
      }
    };

    checkStatus();

    // SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/rooms/${roomId}/events`);
      eventSource.addEventListener('status_changed', (e: any) => {
        const payload = JSON.parse(e.data);
        if (payload.status === 'active') {
          onQuizStarted();
        }
      });
      eventSource.addEventListener('student_joined', (e: any) => {
        const payload = JSON.parse(e.data);
        if (payload.studentCount) {
          setParticipantCount(payload.studentCount);
        }
      });
    } catch {
      // Fallback handles it
    }

    const interval = setInterval(checkStatus, 2000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [roomId, studentId, onQuizStarted]);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-8">
      {/* Waiting Mascot Avatar */}
      <div className="relative inline-block">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-1 mx-auto shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-5xl animate-bounce">
            {avatar}
          </div>
        </div>
        <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1 border-2 border-slate-950 shadow-md">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          READY
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Welcome to the Arena, <span className="text-indigo-400">{studentName}</span>!
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          You are successfully connected. The quiz will begin as soon as your host starts the session.
        </p>
      </div>

      {/* Room Details Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Session
          </span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            PIN: {roomId}
          </span>
        </div>

        <div>
          <h4 className="text-base font-bold text-white">{roomTitle}</h4>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">
              Verified PDF Question Sheet ({questionCount} Questions)
            </p>
            <span>•</span>
            <span className="text-xs font-semibold text-indigo-400">
              {timerBadge}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Classmates In</p>
              <p className="text-lg font-black text-white">{participantCount}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Status</p>
              <p className="text-xs font-bold text-emerald-400">Waiting for Host...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>After submitting, you'll receive full explanations for every single question!</span>
      </div>
    </div>
  );
};
