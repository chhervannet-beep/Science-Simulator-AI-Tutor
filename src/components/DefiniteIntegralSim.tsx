import React, { useEffect, useRef, useState } from "react";
import { DefiniteIntegralSimState } from "../types";
import { 
  Sparkles, 
  FunctionSquare,
  Activity
} from "lucide-react";

interface DefiniteIntegralSimProps {
  state: DefiniteIntegralSimState;
  onChange: (state: DefiniteIntegralSimState) => void;
  onExplainRequest: () => void;
}

export default function DefiniteIntegralSim({ state, onChange, onExplainRequest }: DefiniteIntegralSimProps) {
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

    if (state.mode === "area") {
      drawArea(ctx, width, height, state.xVal);
    } else if (state.mode === "volume") {
      drawVolume(ctx, width, height, time);
    } else if (state.mode === "physics") {
      drawPhysics(ctx, width, height, time);
    } else if (state.mode === "engineering") {
      drawEngineering(ctx, width, height, state.xVal);
    } else if (state.mode === "economics") {
      drawEconomics(ctx, width, height, state.xVal);
    }

  }, [state.mode, state.xVal, state.param2, time]);

  const handleModeChange = (mode: DefiniteIntegralSimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const drawArea = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = 50;
    const cy = h - 100;
    
    const mappedX = (xVal / 100) * (w - 150); // width of integration
    
    // Axes
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.moveTo(cx, 50);
    ctx.lineTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    // Curve f(x) = sin(x) + some height
    ctx.beginPath();
    ctx.strokeStyle = "#a855f7"; // Purple
    ctx.lineWidth = 3;
    for (let x = 0; x <= w - 100; x += 5) {
      const sy = Math.sin(x * 0.02) * 50 + 100;
      if (x === 0) ctx.moveTo(cx + x, cy - sy);
      else ctx.lineTo(cx + x, cy - sy);
    }
    ctx.stroke();

    // Fill Area under curve from a to b
    ctx.beginPath();
    ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
    ctx.moveTo(cx + 50, cy);
    ctx.lineTo(cx + 50, cy - (Math.sin(50 * 0.02) * 50 + 100));
    
    for (let x = 50; x <= 50 + mappedX; x += 5) {
      const sy = Math.sin(x * 0.02) * 50 + 100;
      ctx.lineTo(cx + x, cy - sy);
    }
    ctx.lineTo(cx + 50 + mappedX, cy);
    ctx.closePath();
    ctx.fill();
    
    // Limits lines
    ctx.beginPath();
    ctx.strokeStyle = "#eab308";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx + 50, cy);
    ctx.lineTo(cx + 50, cy - (Math.sin(50 * 0.02) * 50 + 100));
    ctx.moveTo(cx + 50 + mappedX, cy);
    ctx.lineTo(cx + 50 + mappedX, cy - (Math.sin((50 + mappedX) * 0.02) * 50 + 100));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("១. គណនាផ្ទៃក្រឡា (Area Calculation)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#a855f7";
    ctx.fillText("អនុគមន៍ f(x)", 20, 60);
    ctx.fillStyle = "#fff";
    ctx.fillText("គណនាផ្ទៃក្រឡារូបសណ្ឋានមិនទៀងទាត់", 20, 80);
    ctx.fillStyle = "#eab308";
    ctx.fillText("∫ f(x) dx ពី a ទៅ b", 20, 100);
  };

  const drawVolume = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("២. គណនាមាឌ (Volume of Solid of Revolution)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("គណនាមាឌនៃវត្ថុដែលកើតពីការវិល", 20, 60);
    ctx.fillText("V = π ∫ [f(x)]² dx", 20, 80);

    // Draw 3D-like Vase using rotation
    const rotation = t * 2;
    const segments = 20;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + rotation;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2 + rotation;
      
      ctx.beginPath();
      for (let y = -100; y <= 100; y += 10) {
        const radius = 50 + Math.sin(y * 0.03) * 30; // Shape of vase
        const x1 = Math.cos(angle) * radius;
        const x2 = Math.cos(nextAngle) * radius;
        
        // Pseudo 3D perspective
        const px1 = cx + x1;
        const py1 = cy + y + Math.sin(angle) * 15; // tilt
        
        if (y === -100) ctx.moveTo(px1, py1);
        else ctx.lineTo(px1, py1);
      }
      ctx.strokeStyle = `hsla(${(i / segments) * 360}, 70%, 60%, 0.5)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawPhysics = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = 50;
    const cy = h - 50;
    
    const speed = 40; 
    const tMod = (t * speed) % (w - 100); 

    // Velocity Graph
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 200);
    ctx.lineTo(w - 50, cy - 200);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#a3e635"; // Lime
    ctx.lineWidth = 3;
    for (let x = 0; x <= w - 100; x += 5) {
      const v = x < 150 ? (x / 150) * 100 : 100; // Accel then const velocity
      if (x === 0) ctx.moveTo(cx + x, cy - v);
      else ctx.lineTo(cx + x, cy - v);
    }
    ctx.stroke();
    
    // Fill area under V(t)
    ctx.beginPath();
    ctx.fillStyle = "rgba(163, 230, 53, 0.2)";
    ctx.moveTo(cx, cy);
    for (let x = 0; x <= tMod; x += 5) {
      const v = x < 150 ? (x / 150) * 100 : 100;
      ctx.lineTo(cx + x, cy - v);
    }
    ctx.lineTo(cx + tMod, cy);
    ctx.closePath();
    ctx.fill();

    // Car (Moving proportional to integral)
    // Area = distance
    let distance = 0;
    if (tMod < 150) distance = 0.5 * tMod * ((tMod/150)*100);
    else distance = 0.5 * 150 * 100 + (tMod - 150) * 100;
    
    const carX = cx + distance * 0.015; // Scale distance to screen

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(carX - 20, cy - 20, 40, 20);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(carX - 10, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(carX + 10, cy, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("៣. ការអនុវត្តក្នុងរូបវិទ្យា (Physics)", 20, 30);
    
    ctx.font = "14px monospace";
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`ក្រាបល្បឿន v(t)`, 20, 60);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`ចម្ងាយ S = ∫ v(t) dt = ${(distance / 100).toFixed(1)}m`, 20, 80);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("គណនាចម្ងាយដែលចល័តបាន", 20, 110);
  };

  const drawEngineering = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = 50;
    const cy = h - 100;
    
    // Draw Suspension Bridge
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("៤. វិស្វកម្ម និងសំណង់ (Engineering & Construction)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#f97316";
    ctx.fillText("រចនាសម្ព័ន្ធសំណង់ (ដូចជា ខ្សែកាបស្ពាន)", 20, 60);
    ctx.fillText("ប្រើអាំងតេក្រាលដើម្បីរកប្រវែងខ្សែកាប (Arc Length) ឬមជ្ឈមណ្ឌលម៉ាស", 20, 80);

    // Towers
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cx + 50, cy - 150, 20, 150);
    ctx.fillRect(w - 120, cy - 150, 20, 150);
    
    // Road
    ctx.fillStyle = "#475569";
    ctx.fillRect(cx, cy, w - 100, 10);

    // Cable (Parabola)
    const cableWidth = w - 190;
    const towerX1 = cx + 60;
    const towerX2 = w - 110;

    ctx.beginPath();
    ctx.strokeStyle = "#f97316"; // Orange cable
    ctx.lineWidth = 3;
    for (let x = 0; x <= cableWidth; x += 2) {
      const scaledX = (x / cableWidth) * 2 - 1; // -1 to 1
      const y = (scaledX * scaledX) * 120;
      if (x === 0) ctx.moveTo(towerX1 + x, cy - 150 + y);
      else ctx.lineTo(towerX1 + x, cy - 150 + y);
    }
    ctx.stroke();

    // Suspension lines
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let x = 10; x <= cableWidth - 10; x += 15) {
      const scaledX = (x / cableWidth) * 2 - 1; // -1 to 1
      const y = (scaledX * scaledX) * 120;
      ctx.moveTo(towerX1 + x, cy - 150 + y);
      ctx.lineTo(towerX1 + x, cy);
    }
    ctx.stroke();
  };

  const drawEconomics = (ctx: CanvasRenderingContext2D, w: number, h: number, xVal: number) => {
    const cx = 50;
    const cy = h - 50;

    const eqX = 200; // Equilibrium X
    const eqY = 150; // Equilibrium Y (from bottom)
    
    // Demand Curve (Downward sloping)
    // D(x) = 300 - 0.75x
    ctx.beginPath();
    ctx.strokeStyle = "#0ea5e9"; // Light blue Demand
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy - 300);
    ctx.lineTo(cx + 400, cy);
    ctx.stroke();

    // Supply Curve (Upward sloping)
    // S(x) = 0.75x
    ctx.beginPath();
    ctx.strokeStyle = "#f43f5e"; // Rose Supply
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 400, cy - 300);
    ctx.stroke();

    // Shading Consumer Surplus (Area between Demand and Eq Price)
    ctx.beginPath();
    ctx.fillStyle = "rgba(14, 165, 233, 0.3)"; // Blue tint
    ctx.moveTo(cx, cy - 300);
    ctx.lineTo(cx + eqX, cy - eqY);
    ctx.lineTo(cx, cy - eqY);
    ctx.closePath();
    ctx.fill();

    // Shading Producer Surplus (Area between Eq Price and Supply)
    ctx.beginPath();
    ctx.fillStyle = "rgba(244, 63, 94, 0.3)"; // Rose tint
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + eqX, cy - eqY);
    ctx.lineTo(cx, cy - eqY);
    ctx.closePath();
    ctx.fill();

    // Equilibrium point
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(cx + eqX, cy - eqY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx + eqX, cy);
    ctx.lineTo(cx + eqX, cy - eqY);
    ctx.moveTo(cx, cy - eqY);
    ctx.lineTo(cx + eqX, cy - eqY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("៥. សេដ្ឋកិច្ច (Economics)", 20, 30);
    
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#0ea5e9";
    ctx.fillText("Consumer Surplus (អតិរេកអ្នកប្រើប្រាស់) = ∫ (D(x) - Pe) dx", 20, 60);
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("Producer Surplus (អតិរេកអ្នកផលិត) = ∫ (Pe - S(x)) dx", 20, 80);
    
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("គណនាលើសរបស់អតិថិជន និងអ្នកផ្គត់ផ្គង់", 20, 110);
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <FunctionSquare className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              អាំងតេក្រាលកំណត់ <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">DEFINITE INTEGRALS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ហេតុអ្វីត្រូវរៀន អាំងតេក្រាលកំណត់ នៃអនុគមន៍? ∫ a ទៅ b f(x) dx
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Categories / Tabs matching Infographic */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleModeChange("area")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "area"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">១. ផ្ទៃក្រឡា</span>
          <span className="text-xs font-bold leading-tight">Area</span>
        </button>
        <button
          onClick={() => handleModeChange("volume")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "volume"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">២. មាឌ (វិល)</span>
          <span className="text-xs font-bold leading-tight">Volume</span>
        </button>
        <button
          onClick={() => handleModeChange("physics")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "physics"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៣. រូបវិទ្យា</span>
          <span className="text-xs font-bold leading-tight">Physics</span>
        </button>
        <button
          onClick={() => handleModeChange("engineering")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "engineering"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៤. វិស្វកម្មសំណង់</span>
          <span className="text-xs font-bold leading-tight">Engineering</span>
        </button>
        <button
          onClick={() => handleModeChange("economics")}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all border ${
            state.mode === "economics"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៥. សេដ្ឋកិច្ច</span>
          <span className="text-xs font-bold leading-tight">Economics</span>
        </button>
      </div>

      {/* Main Display Window */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 min-h-[300px]">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Interactive Controls */}
      {state.mode === "area" && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>ដែនអាំងតេក្រាល (Integration Bound b)</span>
            <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      )}
    </div>
  );
}
