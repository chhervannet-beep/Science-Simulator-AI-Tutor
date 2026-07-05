import React, { useEffect, useRef, useState } from "react";
import { DerivativeAppSimState } from "../types";
import { 
  Sparkles, 
  TrendingUp,
  Maximize2,
  Rocket,
  LineChart,
  Target,
  ArrowRight
} from "lucide-react";

interface DerivativeAppSimProps {
  state: DerivativeAppSimState;
  onChange: (state: DerivativeAppSimState) => void;
  onExplainRequest: () => void;
}

export default function DerivativeAppSim({ state, onChange, onExplainRequest }: DerivativeAppSimProps) {
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

    if (state.mode === "optimization") {
      drawOptimization(ctx, width, height, state.xVal);
    } else if (state.mode === "motion") {
      drawMotion(ctx, width, height, time);
    } else if (state.mode === "economics") {
      drawEconomics(ctx, width, height, state.xVal);
    } else if (state.mode === "geometry") {
      drawGeometry(ctx, width, height, state.xVal);
    }

  }, [state.mode, state.xVal, state.param2, time]);

  const handleModeChange = (mode: DerivativeAppSimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const drawOptimization = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = w / 2;
    const cy = h / 2 + 50;
    
    // Profit Curve (Parabola opening downwards)
    ctx.beginPath();
    ctx.strokeStyle = "#10b981"; // Emerald for profit
    ctx.lineWidth = 3;
    for (let x = -200; x <= 200; x += 5) {
      const y = - (x * x) / 250 + 150;
      if (x === -200) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // Cost Curve (Parabola opening upwards)
    ctx.beginPath();
    ctx.strokeStyle = "#ef4444"; // Red for cost
    ctx.lineWidth = 3;
    for (let x = -200; x <= 200; x += 5) {
      const y = (x * x) / 300 + 20;
      if (x === -200) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // Map xVal (0 to 100) to actual coordinate range -200 to 200
    const mappedX = (xVal / 100) * 400 - 200;
    
    const profitY = - (mappedX * mappedX) / 250 + 150;
    const costY = (mappedX * mappedX) / 300 + 20;

    // Draw active vertical line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx + mappedX, h - 20);
    ctx.lineTo(cx + mappedX, 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Profit dot
    ctx.beginPath();
    ctx.fillStyle = "#10b981";
    ctx.arc(cx + mappedX, cy - profitY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText("ចំណេញ", cx + mappedX + 10, cy - profitY);

    // Draw Cost dot
    ctx.beginPath();
    ctx.fillStyle = "#ef4444";
    ctx.arc(cx + mappedX, cy - costY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("ចំណាយ", cx + mappedX + 10, cy - costY);

    // Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ការរកតម្លៃអតិបរមា និងអប្បបរមា (Optimization)", 20, 30);
    ctx.font = "13px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("កាត់បន្ថយថ្លៃដើម, បង្កើនប្រាក់ចំណេញ", 20, 50);

    // Dynamic info
    ctx.fillStyle = "#facc15";
    ctx.fillText(`តម្លៃផលិតកម្ម (x): ${Math.round(xVal)}%`, 20, 80);
    ctx.fillText(`ប្រាក់ចំណេញ = ${Math.round(profitY)}`, 20, 100);
    ctx.fillText(`ថ្លៃដើម = ${Math.round(costY)}`, 20, 120);
  };

  const drawMotion = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    // Parabolic Rocket Flight
    const cx = 50;
    const cy = h - 50;
    
    const speed = 40; // time multiplier
    const tMod = (t * speed) % 200; // loop time 0 to 200
    
    // Trajectory background
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= w - 100; x += 5) {
      const y = - (x * x) / 300 + 1.2 * x;
      if (x === 0) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // Rocket position
    const rx = (tMod / 200) * (w - 100);
    const ry = - (rx * rx) / 300 + 1.2 * rx;
    
    // Velocity vector (derivative of position)
    // s(x) = -1/300 x^2 + 1.2x -> s'(x) = -2/300 x + 1.2
    const vx = 1; // arbitrary unit for x speed
    const vy = (-2/300) * rx + 1.2;

    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.moveTo(cx + rx, cy - ry);
    ctx.lineTo(cx + rx + vx * 50, cy - ry - vy * 50);
    ctx.stroke();

    // Rocket dot
    ctx.beginPath();
    ctx.fillStyle = "#f97316";
    ctx.arc(cx + rx, cy - ry, 8, 0, Math.PI * 2);
    ctx.fill();

    // Texts
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ចលនាក្នុងរូបវិទ្យា (Motion Physics)", 20, 30);
    
    ctx.font = "14px monospace";
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`ទីតាំង s(t) = ${(ry).toFixed(1)}m`, 20, 60);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`ល្បឿន v(t) = s'(t) = ${(vy).toFixed(2)}m/s`, 20, 80);
    ctx.fillStyle = "#fb7185";
    ctx.fillText(`សន្ទុះ a(t) = v'(t) = -9.8m/s²`, 20, 100);
  };

  const drawEconomics = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    // Economics Marginal Analysis
    const cx = 50;
    const cy = h - 50;

    // Marginal Revenue (MR) line
    ctx.beginPath();
    ctx.strokeStyle = "#10b981"; // Green
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy - 200);
    ctx.lineTo(w - 50, cy - 50);
    ctx.stroke();

    // Marginal Cost (MC) line (parabola)
    ctx.beginPath();
    ctx.strokeStyle = "#ef4444"; // Red
    ctx.lineWidth = 3;
    for (let x = 0; x <= w - 100; x += 5) {
      const y = ((x - 200) * (x - 200)) / 250 + 50;
      if (x === 0) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // Interaction Line
    const mappedX = (xVal / 100) * (w - 100);
    const mrY = 200 - (150 / (w - 100)) * mappedX;
    const mcY = ((mappedX - 200) * (mappedX - 200)) / 250 + 50;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx + mappedX, cy);
    ctx.lineTo(cx + mappedX, 50);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ការវិភាគក្នុងសេដ្ឋកិច្ច (Marginal Economics)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#10b981";
    ctx.fillText(`ចំណូលរឹម (Marginal Revenue) = ${mrY.toFixed(1)}`, 20, 60);
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`ថ្លៃដើមរឹម (Marginal Cost) = ${mcY.toFixed(1)}`, 20, 80);

    if (Math.abs(mrY - mcY) < 15) {
      ctx.fillStyle = "#facc15";
      ctx.fillText("ចំណុចចំណេញអតិបរមា (Max Profit Point) MR = MC", 20, 110);
    }
  };

  const drawGeometry = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    // Tangent Geometry
    const cx = w / 2;
    const cy = h / 2 + 50;

    // Draw Function f(x) = x^3 - 3x
    ctx.beginPath();
    ctx.strokeStyle = "#a855f7"; // Purple
    ctx.lineWidth = 3;
    for (let x = -200; x <= 200; x += 2) {
      const scaledX = x / 50;
      const scaledY = (Math.pow(scaledX, 3) - 3 * scaledX);
      const y = scaledY * 30; // visual scale
      if (x === -200) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // Map xVal (0-100) to -100 to 100
    const mappedX = (xVal / 100) * 300 - 150;
    const scaledX = mappedX / 50;
    const scaledY = (Math.pow(scaledX, 3) - 3 * scaledX);
    const y = scaledY * 30;

    // Derivative f'(x) = 3x^2 - 3
    const slope = (3 * Math.pow(scaledX, 2) - 3) * 0.6; // adjusted slope visual scale

    // Draw Tangent line
    ctx.beginPath();
    ctx.strokeStyle = "#eab308"; // Yellow
    ctx.lineWidth = 2;
    ctx.moveTo(cx + mappedX - 100, cy - y - slope * 100);
    ctx.lineTo(cx + mappedX + 100, cy - y + slope * 100);
    ctx.stroke();

    // Draw point
    ctx.beginPath();
    ctx.fillStyle = "#eab308";
    ctx.arc(cx + mappedX, cy - y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("ធរណីមាត្រ (Geometry & Tangent Line)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`អនុគមន៍ f(x) = x³ - 3x`, 20, 60);
    ctx.fillStyle = "#eab308";
    ctx.fillText(`មេគុណប្រាប់ទិសបន្ទាត់ប៉ះ f'(x) = ${slope.toFixed(2)}`, 20, 80);
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Rocket className="w-6 h-6 text-emerald-400 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ការអនុវត្តន៍នៃដេរីវេ <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">APPLICATIONS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ហេតុអ្វីយើងចាំបាច់រៀនពីអនុវត្តន៍ដេរីវេនៃអនុគមន៍? សិក្សាពីការវិភាគនានា។
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Categories / Tabs matching Infographic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleModeChange("optimization")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "optimization"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">១. អតិបរមា-អប្បបរមា</span>
          <span className="text-xs font-bold leading-tight">Optimization</span>
        </button>
        <button
          onClick={() => handleModeChange("motion")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "motion"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">២. ល្បឿន និងសន្ទុះ</span>
          <span className="text-xs font-bold leading-tight">Motion (រូបវិទ្យា)</span>
        </button>
        <button
          onClick={() => handleModeChange("economics")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "economics"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៣. សេដ្ឋកិច្ច</span>
          <span className="text-xs font-bold leading-tight">Economics</span>
        </button>
        <button
          onClick={() => handleModeChange("geometry")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "geometry"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៤. ការប៉ាន់ប្រមាណ</span>
          <span className="text-xs font-bold leading-tight">Geometry</span>
        </button>
      </div>

      {/* Main Display Window */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 min-h-[300px]">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Interactive Controls */}
      {state.mode !== "motion" && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>អថេរប្រែប្រួល (Adjust Value x)</span>
            <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      )}
    </div>
  );
}
