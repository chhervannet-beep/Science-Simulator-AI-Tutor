import React, { useState, useEffect } from "react";
import { SubjectType, QuizQuestion } from "../types";
import { Sparkles, Send, Brain, CheckCircle2, XCircle, RefreshCw, Loader2, Award, BookOpen } from "lucide-react";

interface AiAssistantProps {
  subject: SubjectType;
  simulationData: any;
  triggerExplainCount: number; // to auto-trigger explanation when "AI explanation" is clicked in parent
}

export default function AiAssistant({ subject, simulationData, triggerExplainCount }: AiAssistantProps) {
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplain, setLoadingExplain] = useState<boolean>(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  
  // Quiz states
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Translate basic markdown strings to readable styled HTML
  const formatMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split by lines
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-bold text-teal-300 mt-4 mb-2 border-b border-slate-800 pb-1 font-sans">{trimmed.replace("###", "").trim()}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} className="text-base font-bold text-teal-400 mt-4 mb-2 font-sans">{trimmed.replace("##", "").trim()}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2 font-sans">{trimmed.replace("#", "").trim()}</h2>;
      }

      // Bullet points
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        // Handle bolding within bullet
        const cleanLine = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
            {renderBoldText(cleanLine)}
          </li>
        );
      }

      // Regular paragraph
      if (trimmed.length === 0) return <div key={idx} className="h-2" />;
      
      return <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-2">{renderBoldText(trimmed)}</p>;
    });
  };

  // Helper to parse **bold** markers
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-teal-400 font-bold">{part}</strong>;
      }
      return part;
    });
  };

  // Fetch explanation from Express backend
  const fetchExplanation = async (questionText = "") => {
    setLoadingExplain(true);
    setExplanation("");
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          simulationData,
          userQuestion: questionText || null,
        }),
      });
      const data = await response.json();
      setExplanation(data.explanation || "មិនអាចទាញយកការពន្យល់បានទេ។");
    } catch (error) {
      console.error(error);
      setExplanation("សូមអភ័យទោស! មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេ AI។");
    } finally {
      setLoadingExplain(false);
    }
  };

  // Generate dynamic quiz based on simulation states
  const fetchQuiz = async () => {
    setLoadingQuiz(true);
    setQuiz(null);
    setSelectedAnswer(null);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          simulationData,
        }),
      });
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Handle quiz answer selection
  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedAnswer !== null || !quiz) return;
    setSelectedAnswer(optionIdx);
    
    const isCorrect = optionIdx === quiz.correctIndex;
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  // Trigger auto-explanation when active simulation demands it
  useEffect(() => {
    if (triggerExplainCount > 0) {
      fetchExplanation();
    }
  }, [triggerExplainCount]);

  // Clean quiz and explanation when subject changes
  useEffect(() => {
    setExplanation("");
    setQuiz(null);
    setSelectedAnswer(null);
  }, [subject]);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    fetchExplanation(userQuestion);
    setUserQuestion("");
  };

  return (
    <div id="ai-assistant-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Advisor Header */}
      <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans tracking-tight">
              គ្រូបង្រៀនវិទ្យាសាស្ត្រ AI (Gemini Agent)
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-widest">
              លទ្ធផលគណនាពេលវេលាពិត (Live Science Coach)
            </p>
          </div>
        </div>

        {/* Score banner */}
        {quizScore.total > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 font-mono text-[10px] text-slate-300">
            <Award className="w-3.5 h-3.5 text-yellow-500" />
            <span>ពិន្ទុ៖ {quizScore.correct}/{quizScore.total}</span>
          </div>
        )}
      </div>

      {/* Main Panel Content split into Explanation and Quiz tabs */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Core explanation area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>ការពន្យល់អំពីការពិសោធន៍ (Concept Analysis)</span>
            </div>
            {explanation && (
              <button
                id="btn-ai-refresh-explanation"
                onClick={() => fetchExplanation()}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            )}
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 min-h-[160px] flex flex-col justify-between relative shadow-inner">
            {loadingExplain ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-xl z-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-[11px] text-slate-400 font-mono">កំពុងវិភាគទិន្នន័យពិសោធន៍...</span>
              </div>
            ) : null}

            {explanation ? (
              <div className="prose prose-invert max-w-none text-slate-300 scrollbar-thin">
                {formatMarkdown(explanation)}
              </div>
            ) : !loadingExplain ? (
              <div className="flex flex-col items-center justify-center text-center py-6 px-4">
                <Brain className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-xs text-slate-400">
                  សូមចុចប៊ូតុង <span className="text-cyan-400 font-bold">"ពន្យល់ដោយគ្រូ AI"</span> នៅផ្នែកខាងលើនៃកម្មវិធីពិសោធន៍ ដើម្បីឱ្យគ្រូ AI វិភាគទ្រឹស្តីវិទ្យាសាស្ត្រ និងរូបមន្តគីមី/រូបវិទ្យា។
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Dynamic Quiz Card Generator */}
        <div className="border-t border-white/5 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>ធ្វើតេស្តចំណេះដឹងរបស់អ្នក (Science Quiz)</span>
            </div>
            <button
              id="btn-ai-start-quiz"
              onClick={fetchQuiz}
              disabled={loadingQuiz}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {loadingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              សួរតេស្តថ្មី (Get Question)
            </button>
          </div>

          <div className="bg-black/20 border border-white/10 rounded-xl p-4 min-h-[140px] relative">
            {loadingQuiz && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-xl z-10">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-[11px] text-slate-400 font-mono">កំពុងបង្កើតសំណួរថ្មីពីទិន្នន័យ...</span>
              </div>
            )}

            {quiz ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-100 leading-relaxed font-sans">{quiz.question}</h4>
                
                {/* 4 multiple choice options */}
                <div className="grid grid-cols-1 gap-2">
                  {quiz.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = quiz.correctIndex === idx;
                    const showFeedback = selectedAnswer !== null;

                    let btnClass = "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10";
                    
                    if (showFeedback) {
                      if (isCorrect) {
                        btnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5";
                      } else if (isSelected) {
                        btnClass = "bg-rose-500/10 border-rose-500 text-rose-400 font-bold shadow-lg shadow-rose-500/5";
                      } else {
                        btnClass = "bg-black/20 border-white/5 text-slate-600 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        id={`btn-quiz-option-${idx}`}
                        disabled={showFeedback}
                        onClick={() => handleAnswerSelect(idx)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span>{option}</span>
                        {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />}
                        {showFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Show quiz explanation below after answering */}
                {selectedAnswer !== null && (
                  <div className="bg-black/40 border border-white/10 p-3 rounded-lg mt-3 text-[11px] text-slate-300 leading-relaxed animate-fadeIn">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {selectedAnswer === quiz.correctIndex ? (
                        <span className="text-emerald-400">🎉 ចម្លើយត្រឹមត្រូវ!</span>
                      ) : (
                        <span className="text-rose-400">❌ មិនទាន់ត្រឹមត្រូវទេ!</span>
                      )}
                    </div>
                    <p className="text-slate-400 font-sans">{quiz.explanation}</p>
                  </div>
                )}
              </div>
            ) : !loadingQuiz ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <Brain className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 max-w-xs">
                  ចុចប៊ូតុង <span className="text-cyan-400 font-bold">"សួរតេស្តថ្មី"</span> ដើម្បីសាកល្បងសំណួរពហុជ្រើសរើស ទៅលើប្រធានបទពិសោធន៍បច្ចុប្បន្ន។
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Freeform Student Chat Bar at very bottom */}
      <form onSubmit={handleAskQuestion} className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
        <input
          id="input-ai-user-question"
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="សួរគ្រូ AI បន្ថែម... (ឧ. ហេតុអ្វីមុំ ៤៥° បាញ់បានឆ្ងាយ?)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
        />
        <button
          id="btn-ai-submit-question"
          type="submit"
          className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center flex-shrink-0"
          title="Send question to AI"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
