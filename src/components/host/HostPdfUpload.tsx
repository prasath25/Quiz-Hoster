import React, { useState } from 'react';
import {
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { QuizQuestion, PdfFormatCheck, RoomSettings } from '../../types/quiz';
import { SAMPLE_QUIZZES } from '../../data/sampleQuizzes';

interface HostPdfUploadProps {
  onQuizReady: (data: {
    title: string;
    description: string;
    questions: QuizQuestion[];
    pdfFormatCheck: PdfFormatCheck;
    settings: RoomSettings;
  }) => void;
}

export const HostPdfUpload: React.FC<HostPdfUploadProps> = ({ onQuizReady }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted/Parsed State
  const [parsedData, setParsedData] = useState<{
    title: string;
    questions: QuizQuestion[];
    pdfFormatCheck: PdfFormatCheck;
  } | null>(null);

  // UI state for accordion
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Room settings state
  const [roomTitle, setRoomTitle] = useState('');
  const [timerMode, setTimerMode] = useState<'per-question' | 'per-quiz' | 'none'>('per-question');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(30);
  const [totalQuizMinutes, setTotalQuizMinutes] = useState(5);
  const [autoAdvanceOnTimeout, setAutoAdvanceOnTimeout] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  // Handle PDF file upload
  const processPdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('PDF file is too large. Please upload a file under 25MB.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Read file as Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;

      const response = await fetch('/api/quiz/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: file.name,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Failed to process PDF' }));
        throw new Error(errJson.error || 'Server error while parsing PDF');
      }

      const result = await response.json();
      if (result.success && result.questions && result.questions.length > 0) {
        setParsedData({
          title: result.pdfFormatCheck.detectedTitle || file.name.replace(/\.pdf$/i, ''),
          questions: result.questions,
          pdfFormatCheck: result.pdfFormatCheck,
        });
        setRoomTitle(result.pdfFormatCheck.detectedTitle || file.name.replace(/\.pdf$/i, ''));
        setExpandedQuestionId(result.questions[0]?.id || null);
      } else {
        throw new Error('Could not identify valid quiz questions in this PDF.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error parsing PDF. Please verify the document format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPdfFile(e.target.files[0]);
    }
  };

  const loadSamplePreset = (presetId: string) => {
    const preset = SAMPLE_QUIZZES.find((p) => p.id === presetId);
    if (!preset) return;
    setParsedData({
      title: preset.title,
      questions: preset.questions,
      pdfFormatCheck: preset.pdfFormatCheck,
    });
    setRoomTitle(preset.title);
    setExpandedQuestionId(preset.questions[0]?.id || null);
    setErrorMessage(null);
  };

  const handleCreateRoom = () => {
    if (!parsedData) return;
    onQuizReady({
      title: roomTitle.trim() || parsedData.title,
      description: `Live Quiz with ${parsedData.questions.length} questions`,
      questions: parsedData.questions,
      pdfFormatCheck: parsedData.pdfFormatCheck,
      settings: {
        timerMode,
        perQuestionSeconds,
        totalQuizMinutes,
        autoAdvanceOnTimeout,
        timeLimitSeconds: timerMode === 'per-question' ? perQuestionSeconds : 0,
        shuffleQuestions,
        allowReview: true,
        passingScorePercent: 70,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Intro Hero */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          Automated PDF Format Verification & Extraction
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Upload Quiz PDF & Launch Live Arena
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Upload any examination paper, syllabus test, or question bank PDF. Our system checks its layout format, extracts questions, marks the right answers, and prepares deep pedagogical explanations for students.
        </p>
      </div>

      {/* Upload Box or Parsed Preview */}
      {!parsedData ? (
        <div className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                {isProcessing ? (
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileUp className="w-8 h-8 text-white" />
                )}
              </div>

              {isProcessing ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Analyzing PDF Document & Verifying Format...</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    Scanning structure, validating question formatting, extracting multiple choices, and compiling pedagogical explanations...
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    Drop your Quiz PDF here, or <span className="text-indigo-400 underline">browse files</span>
                  </h3>
                  <p className="text-sm text-slate-400">
                    Supports multiple-choice question sheets, test papers, or question banks up to 25MB
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Format Consistency Audit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Automated Explanations
                </span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Start Presets */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Or Try Sample Formatted Quiz PDFs Instantly
              </span>
              <span className="text-xs text-slate-500">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAMPLE_QUIZZES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => loadSamplePreset(sample.id)}
                  className="group text-left p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all flex items-start gap-4 cursor-pointer shadow-sm hover:shadow-indigo-500/10"
                >
                  <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700/80 group-hover:scale-110 transition-transform">
                    {sample.icon}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {sample.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {sample.questions.length} Questions
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {sample.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Parsed Preview & Format Verification Section */
        <div className="space-y-6">
          {/* Format Audit Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Format Verified
                    </span>
                    <span className="text-xs text-slate-400">
                      Confidence Score: <strong className="text-white">{parsedData.pdfFormatCheck.confidenceScore}%</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {parsedData.pdfFormatCheck.detectedTitle}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setParsedData(null)}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload Different PDF
              </button>
            </div>

            {/* Audit Summary & Issues */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <Layers className="w-4 h-4 text-indigo-400" /> Total Questions Extracted
                </span>
                <p className="text-2xl font-black text-white">
                  {parsedData.questions.length}
                </p>
                <p className="text-xs text-slate-500">4 options per question</p>
              </div>

              <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <FileText className="w-4 h-4 text-emerald-400" /> Format Audit Report
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {parsedData.pdfFormatCheck.formatCheckSummary}
                </p>
                {parsedData.pdfFormatCheck.formatIssues.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-800/80">
                    {parsedData.pdfFormatCheck.formatIssues.map((issue, i) => (
                      <div key={i} className="text-xs text-indigo-300/90 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room Settings Controls */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Room & Timer Configuration</span>
              </h4>
              <span className="text-xs text-indigo-400 font-semibold">
                {timerMode === 'per-question'
                  ? `⚡ ${perQuestionSeconds}s per question`
                  : timerMode === 'per-quiz'
                  ? `⏳ ${totalQuizMinutes} mins total quiz timer`
                  : '🧘 Self-paced (untimed)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Quiz Room Title (Shown to Students)
              </label>
              <input
                type="text"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="e.g. Science Midterm Exam"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm"
              />
            </div>

            {/* Timer Mode Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400">
                Countdown Timer Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Per-Question Timer */}
                <button
                  type="button"
                  onClick={() => setTimerMode('per-question')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                    timerMode === 'per-question'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">⚡</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        timerMode === 'per-question'
                          ? 'border-indigo-400 bg-indigo-500'
                          : 'border-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Per-Question Timer</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fixed countdown resets for each question item.
                    </p>
                  </div>
                </button>

                {/* 2. Per-Quiz Timer */}
                <button
                  type="button"
                  onClick={() => setTimerMode('per-quiz')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                    timerMode === 'per-quiz'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">⏳</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        timerMode === 'per-quiz'
                          ? 'border-indigo-400 bg-indigo-500'
                          : 'border-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Per-Quiz Total Timer</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Single countdown clock for the entire test.
                    </p>
                  </div>
                </button>

                {/* 3. Self-Paced (None) */}
                <button
                  type="button"
                  onClick={() => setTimerMode('none')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                    timerMode === 'none'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🧘</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        timerMode === 'none'
                          ? 'border-indigo-400 bg-indigo-500'
                          : 'border-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Self-Paced / Untimed</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Students take their time without countdown pressure.
                    </p>
                  </div>
                </button>
              </div>

              {/* Sub-settings based on chosen Timer Mode */}
              {timerMode === 'per-question' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white">
                        Seconds Allowed Per Question
                      </span>
                      <p className="text-xs text-slate-400">
                        Select a preset or enter custom seconds for each question
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[15, 30, 45, 60, 90].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setPerQuestionSeconds(sec)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                            perQuestionSeconds === sec
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={perQuestionSeconds}
                          onChange={(e) => setPerQuestionSeconds(Math.max(5, Number(e.target.value)))}
                          className="w-16 px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center"
                        />
                        <span className="text-xs text-slate-400">sec</span>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={autoAdvanceOnTimeout}
                      onChange={(e) => setAutoAdvanceOnTimeout(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      <strong>Auto-advance to next question</strong> when time runs out (auto-submits on the last question)
                    </span>
                  </label>
                </div>
              )}

              {timerMode === 'per-quiz' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white">
                        Total Quiz Duration Limit
                      </span>
                      <p className="text-xs text-slate-400">
                        Quiz will auto-submit when the countdown reaches 0:00
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[2, 5, 10, 15, 20].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setTotalQuizMinutes(min)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                            totalQuizMinutes === min
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {min}m
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={totalQuizMinutes}
                          onChange={(e) => setTotalQuizMinutes(Math.max(1, Number(e.target.value)))}
                          className="w-16 px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center"
                        />
                        <span className="text-xs text-slate-400">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions Inspector with Explanations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Extracted Questions & Explanations Preview</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {parsedData.questions.length} Items
                </span>
              </h4>
              <span className="text-xs text-slate-400">
                Correct answers and explanations verified
              </span>
            </div>

            <div className="space-y-3">
              {parsedData.questions.map((q, idx) => {
                const isExpanded = expandedQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-200 line-clamp-1">
                          {q.questionText}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Key: {String.fromCharCode(65 + q.correctAnswerIndex)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                        {/* Question Text */}
                        <p className="text-sm font-medium text-white">
                          {q.questionText}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctAnswerIndex;
                            const letter = String.fromCharCode(65 + oIdx);
                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-lg text-xs flex items-center gap-3 border ${
                                  isCorrect
                                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 font-semibold'
                                    : 'bg-slate-900 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Pedagogical Explanation Box */}
                        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Pedagogical Explanation (Provided to students upon submission):
                          </div>
                          <p className="text-xs text-indigo-100 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Launch CTA */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Everything is Ready!
              </h3>
              <p className="text-xs text-indigo-200">
                Click below to generate your room code and display the live leadership dashboard.
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <span>Launch Room & Open Leaderboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
