import React, { useState } from "react";
import { 
  SubjectType, 
  MathSimState, 
  PhysicsSimState, 
  ChemSimState, 
  BioSimState,
  ComplexSimState,
  LimitsSimState,
  ContinuitySimState,
  DerivativeSimState
} from "./types";
import MathSim from "./components/MathSim";
import PhysicsSim from "./components/PhysicsSim";
import ChemSim from "./components/ChemSim";
import BioSim from "./components/BioSim";
import ComplexSim from "./components/ComplexSim";
import LimitsSim from "./components/LimitsSim";
import ContinuitySim from "./components/ContinuitySim";
import DerivativeSim from "./components/DerivativeSim";
import AiAssistant from "./components/AiAssistant";
import { 
  Compass, 
  Atom, 
  Leaf, 
  Activity, 
  HelpCircle, 
  GraduationCap, 
  Sparkles,
  Info,
  Layers,
  TrendingUp
} from "lucide-react";

export default function App() {
  const [activeSubject, setActiveSubject] = useState<SubjectType>("math");
  const [mathSubTopic, setMathSubTopic] = useState<"trig" | "complex" | "limits" | "continuity" | "derivative">("trig");
  const [triggerExplainCount, setTriggerExplainCount] = useState<number>(0);

  // 1. Mathematics Initial State
  const [mathState, setMathState] = useState<MathSimState>({
    amplitude: 1.0,
    frequency: 1.2,
    phase: 0,
    waveType: "sine",
    showUnitCircle: true,
  });

  // 2. Physics Initial State
  const [physicsState, setPhysicsState] = useState<PhysicsSimState>({
    angle: 45,
    velocity: 15,
    gravity: 9.8,
    airResistance: false,
    mass: 1.0,
  });

  // 3. Chemistry Initial State
  const [chemState, setChemState] = useState<ChemSimState>({
    protons: 1, // Hydrogen
    neutrons: 0,
    electrons: 1,
  });

  // 4. Biology Initial State
  const [bioState, setBioState] = useState<BioSimState>({
    rabbits: 30,
    foxes: 6,
    rabbitGrowthRate: 0.4,
    foxPredationRate: 0.35,
    foxMortalityRate: 0.45,
    grassGrowthRate: 0.6,
  });

  // 5. Complex Numbers Initial State
  const [complexState, setComplexState] = useState<ComplexSimState>({
    mode: "argand",
    real: 1.5,
    imag: 1.0,
    r: 30,
    l: 120,
    c: 35,
    freq: 60,
    energy: 1.5,
    angle: 0.8,
    fractalZoom: 1.0,
  });

  // 6. Limits & Calculus Initial State
  const [limitsState, setLimitsState] = useState<LimitsSimState>({
    mode: "integral",
    xVal: 1.5,
    deltaX: 1.0,
    intervals: 8,
    selectedFunction: "hole"
  });

  // 7. Continuity Initial State
  const [continuityState, setContinuityState] = useState<ContinuitySimState>({
    mode: "foundation",
    xVal: 1.5,
    epsilon: 1.0,
    delta: 1.0,
    discontinuityType: "jump",
  });

  // 8. Derivative Initial State
  const [derivativeState, setDerivativeState] = useState<DerivativeSimState>({
    mode: "rate",
    xVal: 2.0,
    param2: 1.0,
    is3d: false,
    activeSimulation: "car"
  });

  // Get active simulation parameters for AI context
  const getActiveSimulationData = () => {
    switch (activeSubject) {
      case "math":
        if (mathSubTopic === "trig") return mathState;
        if (mathSubTopic === "complex") return complexState;
        if (mathSubTopic === "limits") return limitsState;
        if (mathSubTopic === "continuity") return continuityState;
        return derivativeState;
      case "physics":
        return physicsState;
      case "chemistry":
        return chemState;
      case "biology":
        return bioState;
      case "complex":
        return complexState;
    }
  };

  const handleExplainRequest = () => {
    // Increment triggers the useEffect inside AiAssistant to fetch explanations
    setTriggerExplainCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Primary Navigation / App Brand Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  ScienceSim <span className="text-cyan-400 font-light">Pro</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider border border-cyan-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> Live AI Coach
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                ប្រព័ន្ធពិសោធន៍វិទ្យាសាស្ត្រកម្រិតខ្ពស់ និងគ្រូ AI
              </p>
            </div>
          </div>

          {/* Quick Info Ribbon & User Coordinator Profile */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 px-3.5 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
              <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>ផ្លាស់ប្តូរតម្លៃស្លាយដឺ (Sliders) រួចចុចពន្យល់ដើម្បីឱ្យគ្រូ AI វិភាគ</span>
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <div className="text-right">
                <p className="text-xs font-semibold text-white">លោកគ្រូ វណ្ណដា</p>
                <p className="text-[10px] text-slate-500">អ្នកសម្របសម្រួល</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
                VD
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Subject Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/30 p-1.5 rounded-full border border-white/10 backdrop-blur-md w-fit">
          
          <button
            id="tab-math"
            onClick={() => setActiveSubject("math")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
              activeSubject === "math"
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4" />
            គណិតវិទ្យា (Math)
          </button>

          <button
            id="tab-physics"
            onClick={() => setActiveSubject("physics")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
              activeSubject === "physics"
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Compass className="w-4 h-4" />
            រូបវិទ្យា (Physics)
          </button>

          <button
            id="tab-chemistry"
            onClick={() => setActiveSubject("chemistry")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
              activeSubject === "chemistry"
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Atom className="w-4 h-4" />
            គីមីវិទ្យា (Chemistry)
          </button>

          <button
            id="tab-biology"
            onClick={() => setActiveSubject("biology")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
              activeSubject === "biology"
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Leaf className="w-4 h-4" />
            ជីវវិទ្យា (Biology)
          </button>

        </div>

        {/* Mathematics Sub-Topics Navigation */}
        {activeSubject === "math" && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-fit animate-fade-in">
            <button
              id="subtab-trig"
              onClick={() => setMathSubTopic("trig")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                mathSubTopic === "trig"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              ត្រីកោណមាត្រ និងរង្វង់ខ្នាត (Trigonometric & Unit Circle)
            </button>
            <button
              id="subtab-complex"
              onClick={() => setMathSubTopic("complex")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                mathSubTopic === "complex"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ចំនួនកុំផ្លិច (Complex Numbers)
            </button>
            <button
              id="subtab-limits"
              onClick={() => setMathSubTopic("limits")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                mathSubTopic === "limits"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              លីមីតនៃអនុគមន៍ (Limits of Functions)
            </button>
            <button
              id="subtab-continuity"
              onClick={() => setMathSubTopic("continuity")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                mathSubTopic === "continuity"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              ភាពជាប់នៃអនុគមន៍ (Continuity of Functions)
            </button>
            <button
              id="subtab-derivative"
              onClick={() => setMathSubTopic("derivative")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                mathSubTopic === "derivative"
                  ? "bg-cyan-500/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "bg-transparent text-slate-300 border-yellow-500/40 hover:text-white hover:bg-white/5 hover:border-yellow-500/60 shadow-[0_0_8px_rgba(234,179,8,0.25)] animate-pulse"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
              ដេរីវេនៃអនុគមន៍ (Derivatives of Functions) ✨
            </button>
          </div>
        )}

        {/* Dynamic Simulator + Advisor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Active Simulation View Port (Left Column) */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
            {activeSubject === "math" && mathSubTopic === "trig" && (
              <MathSim 
                state={mathState} 
                onChange={setMathState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "math" && mathSubTopic === "complex" && (
              <ComplexSim 
                state={complexState} 
                onChange={setComplexState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "math" && mathSubTopic === "limits" && (
              <LimitsSim 
                state={limitsState} 
                onChange={setLimitsState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "math" && mathSubTopic === "continuity" && (
              <ContinuitySim 
                state={continuityState} 
                onChange={setContinuityState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "math" && mathSubTopic === "derivative" && (
              <DerivativeSim 
                state={derivativeState} 
                onChange={setDerivativeState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}
            
            {activeSubject === "physics" && (
              <PhysicsSim 
                state={physicsState} 
                onChange={setPhysicsState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "chemistry" && (
              <ChemSim 
                state={chemState} 
                onChange={setChemState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}

            {activeSubject === "biology" && (
              <BioSim 
                state={bioState} 
                onChange={setBioState} 
                onExplainRequest={handleExplainRequest} 
              />
            )}
          </div>

          {/* AI Teaching assistant sidebar (Right Column) */}
          <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
            <AiAssistant 
              subject={
                activeSubject === "math" && mathSubTopic === "complex" 
                  ? "complex" 
                  : activeSubject === "math" && mathSubTopic === "limits"
                  ? "limits"
                  : activeSubject === "math" && mathSubTopic === "continuity"
                  ? "continuity"
                  : activeSubject === "math" && mathSubTopic === "derivative"
                  ? "derivative"
                  : activeSubject
              } 
              simulationData={getActiveSimulationData()} 
              triggerExplainCount={triggerExplainCount}
            />
          </div>

        </div>

      </main>

      {/* Footer credits */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 កម្មវិធីពិសោធន៍វិទ្យាសាស្ត្រ និងគ្រូបង្រៀន AI។ បង្កើតឡើងដោយការស្រលាញ់ការអប់រំ និងបច្ចេកវិទ្យា។</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Powered by Gemini-3.5-Flash & Express Server</p>
        </div>
      </footer>

    </div>
  );
}
