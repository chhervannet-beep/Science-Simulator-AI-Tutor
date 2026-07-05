import React, { useEffect, useRef, useState } from "react";
import { DifferentialEqSimState } from "../types";
import { 
  Sparkles, 
  Activity,
  Lightbulb,
  FileText,
  Users,
  Thermometer,
  Zap,
  Rocket
} from "lucide-react";

interface DifferentialEqSimProps {
  state: DifferentialEqSimState;
  onChange: (state: DifferentialEqSimState) => void;
  onExplainRequest: () => void;
}

export default function DifferentialEqSim({ state, onChange, onExplainRequest }: DifferentialEqSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const update = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setTime((prev) => prev + delta);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Main Drawing Function on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (state.mode === "why_learn") {
      drawWhyLearn(ctx, width, height, time);
    } else if (state.mode === "forms") {
      drawForms(ctx, width, height);
    } else if (state.mode === "population") {
      drawPopulation(ctx, width, height, state.xVal);
    } else if (state.mode === "cooling") {
      drawCooling(ctx, width, height, state.xVal);
    } else if (state.mode === "circuits") {
      drawCircuits(ctx, width, height, time);
    } else if (state.mode === "motion") {
      drawMotion(ctx, width, height, time);
    }

  }, [state.mode, state.xVal, state.param2, time]);

  const handleModeChange = (mode: DifferentialEqSimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const drawWhyLearn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("ហេតុអ្វីត្រូវរៀន សមីការឌីផេរ៉ង់ស្យែល?", 20, 30);
    
    ctx.font = "15px system-ui";
    ctx.fillStyle = "#facc15";
    ctx.fillText("១. យល់អំពីអត្រាប្រែប្រួល", 20, 60);
    ctx.fillStyle = "#a3e635";
    ctx.fillText("២. ការទស្សន៍ទាយនិន្នាការ", 20, 80);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("៣. ដោះស្រាយបញ្ហាជីវិតពិត", 20, 100);
    ctx.fillStyle = "#f472b6";
    ctx.fillText("៤. មូលដ្ឋាន Calculus ខ្ពស់", 20, 120);

    // Draw some dynamic elements
    const cx = w / 2 + 50;
    const cy = h / 2 + 50;

    // Vector field background
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    for (let x = w / 2; x < w; x += 30) {
      for (let y = 0; y < h; y += 30) {
        const dx = (y - cy) * 0.05;
        const dy = -(x - cx) * 0.05;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (dx/len)*15, y + (dy/len)*15);
          ctx.stroke();
        }
      }
    }

    // Animated trend line
    ctx.beginPath();
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 3;
    const progress = (t * 50) % (w/2 - 20);
    for (let i = 0; i < progress; i += 5) {
      const y = cy - Math.sin(i * 0.05 + t) * 30 - i * 0.5;
      if (i === 0) ctx.moveTo(w/2 + 10 + i, y);
      else ctx.lineTo(w/2 + 10 + i, y);
    }
    ctx.stroke();
  };

  const drawForms = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("និយមន័យ និងទម្រង់ (Definition & Forms)", 20, 30);
    
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px system-ui";
    ctx.fillText("សមីការឌីផេរ៉ង់ស្យែល គឺជាសមីការដែលមានអនុគមន៍ និងដេរីវេរបស់វា។", 20, 60);

    // Standard Form Box
    ctx.fillStyle = "rgba(14, 165, 233, 0.1)";
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 80, 250, 70, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ទម្រង់ស្តង់ដា (Standard Form)", 35, 105);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.fillText("y' + p(x)y = g(x)", 35, 135);

    // Separable Form Box
    ctx.fillStyle = "rgba(168, 85, 247, 0.1)";
    ctx.strokeStyle = "#a855f7";
    ctx.beginPath();
    ctx.roundRect(290, 80, 280, 70, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ទម្រង់ដាច់ដោយឡែក (Separable)", 305, 105);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.fillText("dy/dx = M(x)N(y)", 305, 135);

    // Solving Methods
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("វិធីសាស្ត្រដោះស្រាយ:", 20, 190);
    
    ctx.fillStyle = "#facc15";
    ctx.font = "15px system-ui";
    ctx.fillText("១. ដាច់ដោយឡែក (Separable Variables)", 30, 220);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px monospace";
    ctx.fillText("∫ 1/N(y) dy = ∫ M(x) dx", 40, 245);

    ctx.fillStyle = "#facc15";
    ctx.font = "15px system-ui";
    ctx.fillText("២. កត្តាអាំងតេក្រាល (Integrating Factor)", 30, 280);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px monospace";
    ctx.fillText("I(x) = e^(∫ p(x) dx)", 40, 305);
  };

  const drawPopulation = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("ការលូតលាស់នៃចំនួនប្រជាជន (Population Growth)", 20, 30);
    
    ctx.fillStyle = "#a3e635";
    ctx.font = "16px monospace";
    ctx.fillText("P' = kP  =>  P(t) = P₀e^(kt)", 20, 60);

    const k = (xVal / 100) * 0.05; // Growth rate
    
    // Draw Graph
    const cx = 50;
    const cy = h - 50;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, 80);
    ctx.lineTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 3;
    const P0 = 20; // Initial population scale
    for (let t = 0; t <= w - 100; t += 5) {
      const P = P0 * Math.exp(k * t);
      if (cy - P < 80) break; // Don't draw out of bounds
      if (t === 0) ctx.moveTo(cx + t, cy - P);
      else ctx.lineTo(cx + t, cy - P);
    }
    ctx.stroke();
  };

  const drawCooling = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("ច្បាប់ត្រជាក់របស់ញូតុន (Newton's Law of Cooling)", 20, 30);
    
    ctx.fillStyle = "#38bdf8";
    ctx.font = "16px monospace";
    ctx.fillText("T' = -k(T - Tm)", 20, 60);

    const k = (xVal / 100) * 0.1; // Cooling rate
    const Tm = 30; // Ambient temp (room temp)
    const T0 = 200; // Initial temp
    
    // Draw Graph
    const cx = 50;
    const cy = h - 50;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, 80);
    ctx.lineTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    // Ambient temp line
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx, cy - Tm);
    ctx.lineTo(w - 50, cy - Tm);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui";
    ctx.fillText("Tm (Room Temp)", w - 140, cy - Tm - 5);

    ctx.beginPath();
    ctx.strokeStyle = "#f43f5e"; // Hot turning cool
    ctx.lineWidth = 3;
    
    for (let t = 0; t <= w - 100; t += 5) {
      const T = Tm + (T0 - Tm) * Math.exp(-k * t);
      if (t === 0) ctx.moveTo(cx + t, cy - T);
      else ctx.lineTo(cx + t, cy - T);
    }
    ctx.stroke();
  };

  const drawCircuits = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("សៀគ្វីអគ្គិសនី (Electrical Circuits)", 20, 30);
    
    ctx.fillStyle = "#facc15";
    ctx.font = "16px monospace";
    ctx.fillText("V = IR + L(di/dt)  (RL Circuit)", 20, 60);

    // Draw Graph of Current i(t) = (V/R)(1 - e^(-Rt/L))
    const cx = 50;
    const cy = h - 50;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, 80);
    ctx.lineTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    const maxI = 150;
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx, cy - maxI);
    ctx.lineTo(w - 50, cy - maxI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    const rate = 0.03;
    for (let x = 0; x <= w - 100; x += 5) {
      const I = maxI * (1 - Math.exp(-rate * x));
      if (x === 0) ctx.moveTo(cx + x, cy - I);
      else ctx.lineTo(cx + x, cy - I);
    }
    ctx.stroke();
  };

  const drawMotion = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("ល្បឿន និងសន្ទុះ (Velocity & Acceleration)", 20, 30);
    
    ctx.fillStyle = "#818cf8";
    ctx.font = "16px monospace";
    ctx.fillText("v' = a", 20, 60);
    ctx.fillText("s' = v", 20, 80);

    // Draw Rocket moving
    const cx = 50;
    const cy = h - 50;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, 100);
    ctx.lineTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    const tMod = (t * 20) % (w - 100);
    const accel = 0.05;
    const vel = accel * tMod;
    const pos = 0.5 * accel * tMod * tMod;

    // Draw parabola of position
    ctx.beginPath();
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    for (let x = 0; x <= tMod; x += 2) {
      const p = 0.5 * accel * x * x;
      if (cy - p < 100) break;
      if (x === 0) ctx.moveTo(cx + x, cy - p);
      else ctx.lineTo(cx + x, cy - p);
    }
    ctx.stroke();

    // Rocket Icon
    const rx = cx + tMod;
    const ry = cy - pos;
    if (ry >= 100) {
      ctx.fillStyle = "#fff";
      ctx.font = "20px system-ui";
      ctx.fillText("🚀", rx - 10, ry + 10);
    }
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
            <Activity className="w-6 h-6 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              សមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី១ <span className="text-xs bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded-full font-medium">1ST ORDER DIFFERENTIAL EQ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ហេតុអ្វីត្រូវរៀន សមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី១ នៃអនុគមន៍?
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-fuchsia-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Categories / Tabs matching Infographic */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleModeChange("why_learn")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "why_learn"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Lightbulb className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">ហេតុអ្វីត្រូវរៀន?</span>
          <span className="text-xs font-bold leading-tight">Why Learn</span>
        </button>
        <button
          onClick={() => handleModeChange("forms")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "forms"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">ទម្រង់</span>
          <span className="text-xs font-bold leading-tight">Forms</span>
        </button>
        <button
          onClick={() => handleModeChange("population")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "population"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">ប្រជាជន</span>
          <span className="text-xs font-bold leading-tight">Population</span>
        </button>
        <button
          onClick={() => handleModeChange("cooling")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "cooling"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Thermometer className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">ច្បាប់ត្រជាក់</span>
          <span className="text-xs font-bold leading-tight">Cooling</span>
        </button>
        <button
          onClick={() => handleModeChange("circuits")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "circuits"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Zap className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">សៀគ្វីអគ្គិសនី</span>
          <span className="text-xs font-bold leading-tight">Circuits</span>
        </button>
        <button
          onClick={() => handleModeChange("motion")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "motion"
              ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Rocket className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-mono opacity-60">ល្បឿន និងសន្ទុះ</span>
          <span className="text-xs font-bold leading-tight">Motion</span>
        </button>
      </div>

      {/* Main Display Window */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 min-h-[300px]">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Interactive Controls */}
      {(state.mode === "population" || state.mode === "cooling") && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>អត្រាប្រែប្រួល (Rate k)</span>
            <span className="text-fuchsia-400 font-mono bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
              k = {(state.xVal / 100).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={state.xVal}
            onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
          />
        </div>
      )}
    </div>
  );
}
