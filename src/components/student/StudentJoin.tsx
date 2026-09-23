import React, { useState, useEffect } from 'react';
import { LogIn, Sparkles, User, Hash, AlertCircle, ArrowRight } from 'lucide-react';

interface StudentJoinProps {
  initialRoomCode?: string;
  onJoined: (data: {
    studentId: string;
    studentName: string;
    avatar: string;
    roomId: string;
    roomTitle: string;
  }) => void;
}

const AVATARS = ['🚀', '🦉', '🦊', '⚡', '🎯', '🐯', '🐬', '🌟', '🦄', '🔥', '👑', '👾'];

export const StudentJoin: React.FC<StudentJoinProps> = ({ initialRoomCode, onJoined }) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [studentName, setStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    const cleanName = studentName.trim();

    if (!cleanCode) {
      setErrorMessage('Please enter a 6-digit Room PIN.');
      return;
    }

    if (!cleanName) {
      setErrorMessage('Please enter your name or nickname.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          avatar: selectedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room. Please check the code.');
      }

      onJoined({
        studentId: data.studentId,
        studentName: cleanName,
        avatar: selectedAvatar,
        roomId: cleanCode,
        roomTitle: data.room?.title || 'Live Quiz',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not join the quiz room.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Join Quiz Arena</h2>
          <p className="text-xs text-slate-400">
            Enter the 6-digit Room PIN provided by your host or teacher
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room PIN Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              Room PIN
            </label>
            <input
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
              placeholder="e.g. 742918"
              className="w-full text-center tracking-widest font-mono text-2xl font-black py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-indigo-400 placeholder:text-slate-600 uppercase"
              required
            />
          </div>

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Your Name / Nickname
            </label>
            <input
              type="text"
              maxLength={24}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm placeholder:text-slate-600 font-medium"
              required
            />
          </div>

          {/* Avatar Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Choose Your Mascot Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`text-2xl p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    selectedAvatar === av
                      ? 'bg-indigo-600/30 border-2 border-indigo-500 scale-110 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Quiz Arena</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Room link */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setRoomCode('742918');
              if (!studentName) setStudentName('Player One');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            Quick Test: Fill Active Demo Room (742918)
          </button>
        </div>
      </div>
    </div>
  );
};
