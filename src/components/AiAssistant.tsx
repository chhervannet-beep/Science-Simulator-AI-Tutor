import React, { useState, useEffect } from "react";
import { SubjectType, QuizQuestion } from "../types";
import { Sparkles, Send, Brain, CheckCircle2, XCircle, RefreshCw, Loader2, Award, BookOpen, History, Trash2, Clock, MessageSquare, ChevronRight } from "lucide-react";
import MathRenderer from "./MathRenderer";

interface HistoryItem {
  id: string;
  timestamp: string;
  title: string;
  subject: SubjectType;
  content: string;
  subtitle: string;
  userQuestion?: string;
}

const getSubjectKhmerName = (sub: SubjectType): string => {
  const mapping: Record<SubjectType, string> = {
    math: "អនុគមន៍ត្រីកោណមាត្រ",
    physics: "ចលនាគប់គ្រាប់ផ្លោង",
    chemistry: "ការសាងសង់អាតូម",
    biology: "ប្រព័ន្ធអេកូឡូស៊ីសត្វព្រៃ",
    complex: "ចំនួនកុំផ្លិច និងការអនុវត្ត",
    limits: "លីមីតនៃអនុគមន៍",
    continuity: "ភាពជាប់នៃអនុគមន៍",
    derivative: "ដេរីវេនៃអនុគមន៍",
    integral: "អាំងតេក្រាលមិនកំណត់",
    definite_integral: "អាំងតេក្រាលកំណត់",
    differential_eq: "សមីការឌីផេរ៉ង់ស្យែល",
    differential_eq2: "សមីការឌីផេរ៉ង់ស្យែលលំដាប់២",
    probability: "ប្រូបាប និងស្ថិតិ",
    function_variation: "អថេរភាព និងក្រាហ្វនៃអនុគមន៍"
  };
  return mapping[sub] || sub;
};

const formatParamsSubtitle = (sub: SubjectType, data: any): string => {
  if (!data) return "";
  const parts: string[] = [];
  if (data.mode) {
    const modeMap: Record<string, string> = {
      circle: "រង្វង់",
      ellipse: "អេលីប",
      parabola: "ប៉ារ៉ាបូល",
      hyperbola: "អ៊ីពែបូល",
      math: "គណិតវិទ្យា",
      realworld: "ជីវិតពិត",
      indeterminate: "ទម្រង់មិនកំណត់",
      asymptote: "អសីមតូត",
      derivative: "ដេរីវេ",
      integral: "អាំងតេក្រាល",
      application: "កម្មវិធីអនុវត្ត",
      foundation: "គ្រឹះស្ថាន",
      realworld_cont: "ជីវិតពិត",
      theorems: "ទ្រឹស្តីបទ",
      stability: "ស្ថិរភាព",
      discontinuity: "ភាពមិនជាប់",
      rate: "អត្រាប្រែប្រួល",
      optimization: "អតិបរមា/អប្បបរមា",
      motion: "ចលនា",
      economics: "សេដ្ឋកិច្ច",
      engineering: "វិស្វកម្ម",
      area: "ក្រឡាផ្ទៃ",
      volume: "មាឌ",
      why_learn: "ហេតុអ្វីសិក្សា",
      forms: "ទម្រង់សមីការ",
      population: "កំណើនប្រជាជន",
      cooling: "ច្បាប់លំនឹងកម្តៅ",
      circuits: "សៀគ្វីអគ្គិសនី",
      concept: "គំនិតគ្រឹះ",
      spring_mass: "លំយោលរ៉ឺស័រ",
      rlc_circuit: "សៀគ្វី RLC",
      wave: "រលកសញ្ញា",
      decision: "ការសម្រេចចិត្ត",
      risk: "ហានិភ័យ",
      randomness: "ភាពចៃដន្យ",
      ai_science: "វិទ្យាសាស្ត្រ AI",
      applications: "កម្មវិធីផ្សេងៗ",
      logarithmic: "លោការីត",
      exponential: "អិចស្ប៉ូណង់ស្យែល",
      rational: "សនិទាន"
    };
    parts.push(`របៀប៖ ${modeMap[data.mode] || data.mode}`);
  }
  if (sub === "physics") {
    if (data.velocity !== undefined) parts.push(`v₀: ${data.velocity}m/s`);
    if (data.angle !== undefined) parts.push(`θ: ${data.angle}°`);
  } else if (sub === "math") {
    if (data.amplitude !== undefined) parts.push(`Amp: ${data.amplitude}`);
    if (data.frequency !== undefined) parts.push(`Freq: ${data.frequency}Hz`);
  } else if (sub === "chemistry") {
    if (data.protons !== undefined) parts.push(`P: ${data.protons}`);
    if (data.neutrons !== undefined) parts.push(`N: ${data.neutrons}`);
    if (data.electrons !== undefined) parts.push(`E: ${data.electrons}`);
  } else if (sub === "biology") {
    if (data.rabbits !== undefined) parts.push(`ទន្សាយ: ${Math.round(data.rabbits)}`);
    if (data.wolves !== undefined) parts.push(`ចចក: ${Math.round(data.wolves)}`);
  } else {
    if (data.xVal !== undefined) parts.push(`x: ${data.xVal.toFixed(1)}`);
    if (data.param2 !== undefined) parts.push(`p2: ${data.param2.toFixed(1)}`);
  }
  return parts.join(" | ");
};

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

  // History states
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filterHistoryBySubject, setFilterHistoryBySubject] = useState<boolean>(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("science_sim_chat_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // Helper to parse **bold**, $inline math$, and $$block math$$
  const renderTextWithMath = (text: string) => {
    if (!text) return "";

    const trimmed = text.trim();
    // If it's a stand-alone block math, render as block
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      const formula = trimmed.slice(2, -2);
      return <MathRenderer key={text} formula={formula} block={true} />;
    }

    // Capture standard Markdown elements: block math, inline math, bold
    const tokenRegex = /(\$\$.*?\$\$|\$.*?\$|\*\*.*?\*\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const formula = part.slice(2, -2);
        return <MathRenderer key={idx} formula={formula} block={true} />;
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        const formula = part.slice(1, -1);
        return <MathRenderer key={idx} formula={formula} block={false} />;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={idx} className="text-teal-400 font-bold">{boldText}</strong>;
      }
      return part;
    });
  };

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
        const cleanLine = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
            {renderTextWithMath(cleanLine)}
          </li>
        );
      }

      // Regular paragraph
      if (trimmed.length === 0) return <div key={idx} className="h-2" />;
      
      return <div key={idx} className="text-xs text-slate-300 leading-relaxed mb-2">{renderTextWithMath(trimmed)}</div>;
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
      const resultText = data.explanation || "មិនអាចទាញយកការពន្យល់បានទេ។";
      setExplanation(resultText);

      // Save to history!
      if (data.explanation) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
        const dateStr = now.toLocaleDateString("km-KH", { month: "numeric", day: "numeric" });
        
        const titleText = questionText 
          ? `សំណួរ៖ "${questionText}"`
          : `ការពន្យល់៖ ${getSubjectKhmerName(subject)}`;

        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          timestamp: `${dateStr}, ${timeStr}`,
          title: titleText,
          subject,
          content: resultText,
          subtitle: formatParamsSubtitle(subject, simulationData),
          userQuestion: questionText || undefined
        };

        setHistory((prev) => {
          const updated = [newItem, ...prev].slice(0, 50); // limit to last 50 items
          try {
            localStorage.setItem("science_sim_chat_history", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to persist chat history:", e);
          }
          return updated;
        });
      }
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

  const handleClearHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("science_sim_chat_history", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save history:", err);
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    if (window.confirm("តើអ្នកពិតជាចង់លុបប្រវត្តិសួរឆ្លើយទាំងអស់មែនទេ?")) {
      setHistory([]);
      try {
        localStorage.removeItem("science_sim_chat_history");
      } catch (err) {
        console.error("Failed to clear history:", err);
      }
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setExplanation(item.content);
    setShowHistory(false);
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

        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            id="btn-ai-toggle-history"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              showHistory
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
            }`}
            title="ប្រវត្តិសួរឆ្លើយ (Chat History)"
          >
            <History className="w-3.5 h-3.5" />
            <span className="font-sans text-[11px]">ប្រវត្តិសួរឆ្លើយ</span>
          </button>

          {/* Score banner */}
          {quizScore.total > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 font-mono text-[10px] text-slate-300">
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              <span>ពិន្ទុ៖ {quizScore.correct}/{quizScore.total}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content split into Explanation/Quiz tabs vs History View */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 font-sans">ប្រវត្តិការសួរឆ្លើយ (History Logs)</h3>
            </div>
            {history.length > 0 && (
              <button
                id="btn-ai-clear-all-history"
                onClick={handleClearAllHistory}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-sans cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                លុបទាំងអស់
              </button>
            )}
          </div>

          {/* Filter options */}
          {history.length > 0 && (
            <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 text-[11px] font-sans">តម្រងបង្ហាញ៖</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterHistoryBySubject(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans transition-all cursor-pointer ${
                    filterHistoryBySubject
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  មុខវិជ្ជាបច្ចុប្បន្ន ({getSubjectKhmerName(subject)})
                </button>
                <button
                  onClick={() => setFilterHistoryBySubject(false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans transition-all cursor-pointer ${
                    !filterHistoryBySubject
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  គ្រប់មុខវិជ្ជាទាំងអស់
                </button>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="space-y-2.5">
            {(() => {
              const filtered = filterHistoryBySubject
                ? history.filter((item) => item.subject === subject)
                : history;

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                    <Clock className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs text-slate-400 font-sans">មិនទាន់មានប្រវត្តិសួរនាំនៅឡើយទេ</p>
                    <p className="text-[10px] text-slate-600 font-sans mt-1 max-w-xs">
                      {filterHistoryBySubject 
                        ? `មិនទាន់មានប្រវត្តិសម្រាប់ "${getSubjectKhmerName(subject)}" ទេ។ សាកល្បងសួរគ្រូ AI ឥឡូវនេះ!`
                        : "រាល់ការពន្យល់ និងសំណួរដែលអ្នកបានសួរនឹងបង្ហាញនៅទីនេះ។"}
                    </p>
                  </div>
                );
              }

              return filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-xl p-3.5 transition-all cursor-pointer flex justify-between items-start gap-3 shadow-lg hover:shadow-cyan-500/5 duration-200"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20 font-sans font-medium">
                        {getSubjectKhmerName(item.subject)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 font-sans leading-snug group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight bg-black/20 px-2 py-0.5 rounded inline-block">
                        {item.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans pt-1">
                      {item.content.replace(/[#*`$-]/g, "")}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-full min-h-[50px]">
                    <button
                      onClick={(e) => handleClearHistoryItem(item.id, e)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="លុបប្រវត្តិនេះ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
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
      )}

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
