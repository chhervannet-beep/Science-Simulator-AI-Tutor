import React, { useEffect, useRef, useState } from "react";
import { IntegralSimState } from "../types";
import { 
  Sparkles, 
  TrendingUp,
  LineChart,
  FunctionSquare,
  Activity,
  Calculator,
  Building2,
  Car
} from "lucide-react";

interface IntegralSimProps {
  state: IntegralSimState;
  onChange: (state: IntegralSimState) => void;
  onExplainRequest: () => void;
}

export default function IntegralSim({ state, onChange, onExplainRequest }: IntegralSimProps) {
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

    if (state.mode === "foundation") {
      drawFoundation(ctx, width, height, state.xVal);
    } else if (state.mode === "physics") {
      drawPhysics(ctx, width, height, time);
    } else if (state.mode === "engineering") {
      drawEngineering(ctx, width, height, state.xVal);
    } else if (state.mode === "economics") {
      drawEconomics(ctx, width, height, state.xVal);
    }

  }, [state.mode, state.xVal, state.param2, time]);

  const handleModeChange = (mode: IntegralSimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const drawFoundation = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = w / 2;
    const cy = h / 2 + 50;
    
    const mappedX = (xVal / 100) * 300 - 150; // -150 to 150
    const scaledX = mappedX / 50;

    // Derivative f'(x) = 2x
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8"; // Blue
    ctx.lineWidth = 2;
    for (let x = -200; x <= 200; x += 5) {
      const sx = x / 50;
      const sy = 2 * sx;
      if (x === -200) ctx.moveTo(cx + x, cy - sy * 30);
      else ctx.lineTo(cx + x, cy - sy * 30);
    }
    ctx.stroke();

    // Integral F(x) = x^2 + C (We will vary C based on time or fixed to 0)
    ctx.beginPath();
    ctx.strokeStyle = "#a855f7"; // Purple
    ctx.lineWidth = 3;
    for (let x = -200; x <= 200; x += 5) {
      const sx = x / 50;
      const sy = sx * sx - 2; // -2 is our C
      if (x === -200) ctx.moveTo(cx + x, cy - sy * 30);
      else ctx.lineTo(cx + x, cy - sy * 30);
    }
    ctx.stroke();
    
    // Draw another primitive (different C)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)"; // Faded purple
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let x = -200; x <= 200; x += 5) {
      const sx = x / 50;
      const sy = sx * sx + 1; // +1 is another C
      if (x === -200) ctx.moveTo(cx + x, cy - sy * 30);
      else ctx.lineTo(cx + x, cy - sy * 30);
    }
    ctx.stroke();
    ctx.setLineDash([]);


    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("គ្រឹះនៃគណិតវិទ្យាជាន់ខ្ពស់ (Foundation of Higher Math)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("អនុគមន៍ f(x) = 2x", 20, 60);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("ព្រីមីទីវ (អនុគមន៍ដើម) F(x) = x² + C", 20, 80);
    
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("អាំងតេក្រាលគឺជាប្រតិបត្តិការច្រាសនៃដេរីវេ (Reverse of Derivative)", 20, 110);
    ctx.fillText("ដោះស្រាយសមីការឌីផេរ៉ង់ស្យែល និងជាផ្នែកសំខាន់នៃ Calculus II", 20, 130);
  };

  const drawPhysics = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = 50;
    const cy = h - 50;
    
    const speed = 50; 
    const tMod = (t * speed) % 300; 

    // Car (Rectangle)
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(cx + tMod - 20, cy - 20, 40, 20);
    // Wheels
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx + tMod - 10, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + tMod + 10, cy, 6, 0, Math.PI * 2); ctx.fill();
    
    // Draw integral area for velocity -> position
    ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
    ctx.fillRect(cx, cy - 100, tMod, 50);
    
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy - 100, tMod, 50);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ការអនុវត្តក្នុងរូបវិទ្យា (Applications in Physics)", 20, 30);
    
    ctx.font = "14px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`ល្បឿន v(t) = ថេរ (Constant)`, 20, 60);
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`ទីតាំង s(t) = ∫ v(t) dt = ${(tMod).toFixed(1)}m`, 20, 80);
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui";
    ctx.fillText("s(t) → v(t) → a(t)", 20, 110);
    ctx.fillText("រកទីតាំងពីល្បឿន រកល្បឿនពីសន្ទុះ", 20, 130);
  };

  const drawEngineering = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = w / 2;
    const cy = h / 2;
    
    // Drawing a gear / mechanical part volume 
    const radius = 50 + (xVal / 100) * 50;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 10;
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + time;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
      ctx.lineTo(cx + Math.cos(angle) * (radius + 15), cy + Math.sin(angle) * (radius + 15));
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 15;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 20, 0, Math.PI * 2);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ការអនុវត្តក្នុងវិស្វកម្ម (Applications in Engineering)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#facc15";
    ctx.fillText("គណនាបរិមាណសរុប (Calculate total volume)", 20, 60);
    ctx.fillText(`កាំ R = ${radius.toFixed(1)}`, 20, 80);
    ctx.fillText(`បរិមាណ V = ∫ A(x) dx សម្រាប់ការវិភាគបញ្ហា និងប្រព័ន្ធឌីណាមិក`, 20, 100);
  };

  const drawEconomics = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = 50;
    const cy = h - 50;

    const maxItems = w - 100;
    const items = (xVal / 100) * maxItems;

    // Draw Marginal Revenue MR (constant for simplicity or linear)
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8"; // Blue for Marginal Revenue
    ctx.lineWidth = 2;
    ctx.moveTo(cx, cy - 100);
    ctx.lineTo(w - 50, cy - 100);
    ctx.stroke();

    // Integral of MR is Total Revenue
    ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
    ctx.fillRect(cx, cy - 100, items, 100);
    
    // Total Revenue curve F(x) = mx
    ctx.beginPath();
    ctx.strokeStyle = "#a855f7"; // Purple for Total Revenue
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + items, cy - items * 0.5); // 0.5 slope visually
    ctx.stroke();

    // Indicator dot
    ctx.beginPath();
    ctx.fillStyle = "#a855f7";
    ctx.arc(cx + items, cy - items * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ការអនុវត្តក្នុងសេដ្ឋកិច្ច (Economics & Finance)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("ចំណូលរឹម (Marginal Revenue) MR(x) = តម្លៃថេរ", 20, 60);
    
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`ចំណូលសរុប (Total Revenue) TR(x) = ∫ MR(x) dx`, 20, 80);
    ctx.fillText(`ការព្យាករណ៍កំណើនបច្ចុប្បន្ន: ${(items * 0.5).toFixed(0)}$`, 20, 100);
    
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("ថ្លៃដើមសរុបពីថ្លៃដើមរឹម ចំណូលសរុបពីចំណូលរឹម (ការគ្រប់គ្រងហិរញ្ញវត្ថុ)", 20, 130);
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <FunctionSquare className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              អាំងតេក្រាលមិនកំណត់ <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">INDEFINITE INTEGRALS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              សារៈសំខាន់ និងការអនុវត្ត (ការរកអនុគមន៍ដើម ព្រីមីទីវ ∫ f(x)dx = F(x) + C)
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Categories / Tabs matching Infographic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleModeChange("foundation")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "foundation"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">១. គ្រឹះនៃគណិតវិទ្យា</span>
          <span className="text-xs font-bold leading-tight">Foundation</span>
        </button>
        <button
          onClick={() => handleModeChange("physics")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "physics"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">២. ក្នុងរូបវិទ្យា</span>
          <span className="text-xs font-bold leading-tight">Physics</span>
        </button>
        <button
          onClick={() => handleModeChange("engineering")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "engineering"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៣. ក្នុងវិស្វកម្ម</span>
          <span className="text-xs font-bold leading-tight">Engineering</span>
        </button>
        <button
          onClick={() => handleModeChange("economics")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "economics"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៤. ក្នុងសេដ្ឋកិច្ច</span>
          <span className="text-xs font-bold leading-tight">Economics</span>
        </button>
      </div>

      {/* Main Display Window */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 min-h-[300px]">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Interactive Controls */}
      {state.mode !== "physics" && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>អថេរប្រែប្រួល (Adjust Integration Limit / Parameter)</span>
            <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              x = {state.xVal.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={state.xVal}
            onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      )}
    </div>
  );
}
