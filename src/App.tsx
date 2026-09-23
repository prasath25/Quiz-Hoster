/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Award
} from 'lucide-react';
import { HostPdfUpload } from './components/host/HostPdfUpload';
import { HostLiveDashboard } from './components/host/HostLiveDashboard';
import { StudentJoin } from './components/student/StudentJoin';
import { StudentWaitingLobby } from './components/student/StudentWaitingLobby';
import { StudentQuizPlayer } from './components/student/StudentQuizPlayer';
import { StudentResultsReview } from './components/student/StudentResultsReview';
import { QuizRoom, QuizQuestion, SubmissionResult, PdfFormatCheck, RoomSettings } from './types/quiz';

type AppView =
  | 'host-upload'
  | 'host-live'
  | 'student-join'
  | 'student-lobby'
  | 'student-player'
  | 'student-results';

export default function App() {
  const [activeTab, setActiveTab] = useState<'host' | 'student'>('host');
  const [currentView, setCurrentView] = useState<AppView>('host-upload');

  // Host state
  const [activeRoomId, setActiveRoomId] = useState<string | null>('742918');
  const [hostToken, setHostToken] = useState<string>('host-sample-token');
  const [activeRoom, setActiveRoom] = useState<QuizRoom | null>(null);

  // Student state
  const [studentSession, setStudentSession] = useState<{
    studentId: string;
    studentName: string;
    avatar: string;
    roomId: string;
    roomTitle: string;
    settings?: RoomSettings;
    questions?: QuizQuestion[];
  } | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Parse URL query parameter for ?room=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setActiveTab('student');
      setCurrentView('student-join');
      setActiveRoomId(roomParam.trim());
    }
  }, []);

  // When host creates room
  const handleHostQuizReady = async (data: {
    title: string;
    description: string;
    questions: QuizQuestion[];
    pdfFormatCheck: PdfFormatCheck;
    settings: RoomSettings;
  }) => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to create quiz room.');
      }

      const resData = await res.json();
      setActiveRoomId(resData.roomId);
      setHostToken(resData.hostToken);
      setActiveRoom(resData.room);
      setCurrentView('host-live');
    } catch (err) {
      console.error(err);
      alert('Error creating room. Please try again.');
    }
  };

  // Student joins room
  const handleStudentJoined = async (data: {
    studentId: string;
    studentName: string;
    avatar: string;
    roomId: string;
    roomTitle: string;
  }) => {
    try {
      const res = await fetch(`/api/rooms/${data.roomId}?studentId=${data.studentId}`);
      if (res.ok) {
        const roomData = await res.json();
        setStudentSession({
          ...data,
          settings: roomData.settings,
          questions: roomData.questions || [],
        });

        if (roomData.status === 'active') {
          setCurrentView('student-player');
        } else {
          setCurrentView('student-lobby');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Student starts quiz from lobby
  const handleStartTakingQuiz = async () => {
    if (!studentSession) return;
    try {
      const res = await fetch(`/api/rooms/${studentSession.roomId}?studentId=${studentSession.studentId}`);
      if (res.ok) {
        const roomData = await res.json();
        setStudentSession((prev) => (prev ? {
          ...prev,
          settings: roomData.settings,
          questions: roomData.questions
        } : null));
        setCurrentView('student-player');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Student submits quiz
  const handleQuizSubmitted = (result: SubmissionResult) => {
    setSubmissionResult(result);
    setCurrentView('student-results');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => {
              setActiveTab('host');
              setCurrentView('host-upload');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">QuizArena</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                PDF Upload • Format Verification • Live Leaderboard
              </p>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('host');
                if (currentView !== 'host-live') setCurrentView('host-upload');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'host'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Host Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('student');
                if (!studentSession) setCurrentView('student-join');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Arena</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* HOST MODE */}
        {activeTab === 'host' && (
          <div>
            {currentView === 'host-upload' && (
              <HostPdfUpload onQuizReady={handleHostQuizReady} />
            )}

            {currentView === 'host-live' && activeRoomId && (
              <HostLiveDashboard
                roomId={activeRoomId}
                hostToken={hostToken}
                initialRoom={activeRoom}
                onExitRoom={() => setCurrentView('host-upload')}
              />
            )}
          </div>
        )}

        {/* STUDENT MODE */}
        {activeTab === 'student' && (
          <div>
            {currentView === 'student-join' && (
              <StudentJoin
                initialRoomCode={activeRoomId || '742918'}
                onJoined={handleStudentJoined}
              />
            )}

            {currentView === 'student-lobby' && studentSession && (
              <StudentWaitingLobby
                roomId={studentSession.roomId}
                studentId={studentSession.studentId}
                studentName={studentSession.studentName}
                avatar={studentSession.avatar}
                roomTitle={studentSession.roomTitle}
                onQuizStarted={handleStartTakingQuiz}
              />
            )}

            {currentView === 'student-player' && studentSession && (
              <StudentQuizPlayer
                roomId={studentSession.roomId}
                studentId={studentSession.studentId}
                studentName={studentSession.studentName}
                avatar={studentSession.avatar}
                roomTitle={studentSession.roomTitle}
                settings={studentSession.settings}
                questions={studentSession.questions || []}
                onCompleted={handleQuizSubmitted}
              />
            )}

            {currentView === 'student-results' && studentSession && submissionResult && (
              <StudentResultsReview
                roomId={studentSession.roomId}
                studentId={studentSession.studentId}
                studentName={studentSession.studentName}
                avatar={studentSession.avatar}
                result={submissionResult}
                onExit={() => {
                  setStudentSession(null);
                  setCurrentView('student-join');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>QuizArena Assessment Engine • Real-Time Leaderboard</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Automated PDF Format Verification</span>
            <span>•</span>
            <span>Right Answers & Explanations Key</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
