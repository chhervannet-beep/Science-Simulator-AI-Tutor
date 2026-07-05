import React, { useEffect, useRef, useState } from "react";
import { DifferentialEq2SimState } from "../types";
import { 
  Sparkles, 
  Activity,
  Lightbulb,
  Zap,
  Waves,
  Wrench,
  Settings
} from "lucide-react";

interface DifferentialEq2SimProps {
  state: DifferentialEq2SimState;
  onChange: (state: DifferentialEq2SimState) => void;
  onExplainRequest: () => void;
}

export default function DifferentialEq2Sim({ state, onChange, onExplainRequest }: DifferentialEq2SimProps) {
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

    if (state.mode === "concept") {
      drawConcept(ctx, width, height, time);
    } else if (state.mode === "spring_mass") {
      drawSpringMass(ctx, width, height, time, state.xVal);
    } else if (state.mode === "rlc_circuit") {
      drawRLCCircuit(ctx, width, height, time, state.xVal);
    } else if (state.mode === "wave") {
      drawWave(ctx, width, height, time, state.xVal);
    }

  }, [state.mode, state.xVal, state.param2, time]);

  const handleModeChange = (mode: DifferentialEq2SimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const drawConcept = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("សមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី២ (2nd Order Differential Equations)", 20, 30);
    
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px system-ui";
    ctx.fillText("ay''(t) + by'(t) + cy(t) = f(t)", 20, 60);

    ctx.fillStyle = "#facc15";
    ctx.font = "14px system-ui";
    ctx.fillText("y''(t) : សន្ទុះ / អត្រាប្រែប្រួលកម្រិត២ (Acceleration)", 20, 90);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("y'(t) : ល្បឿន / អត្រាប្រែប្រួលកម្រិត១ (Velocity)", 20, 115);
    ctx.fillStyle = "#a3e635";
    ctx.fillText("y(t) : ទីតាំង / ស្ថានភាព (Position/State)", 20, 140);

    // Draw a conceptual moving particle showing pos, vel, acc
    const cx = w / 2 + 50;
    const cy = h / 2 + 50;

    const angle = t * 2;
    const radius = 60;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;

    // Path
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Position vector
    ctx.beginPath();
    ctx.strokeStyle = "#a3e635"; // green
    ctx.lineWidth = 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Velocity vector (tangent)
    const vx = -Math.sin(angle) * 40;
    const vy = Math.cos(angle) * 40;
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8"; // blue
    ctx.moveTo(px, py);
    ctx.lineTo(px + vx, py + vy);
    ctx.stroke();

    // Acceleration vector (towards center)
    const ax = -Math.cos(angle) * 30;
    const ay = -Math.sin(angle) * 30;
    ctx.beginPath();
    ctx.strokeStyle = "#facc15"; // yellow
    ctx.moveTo(px, py);
    ctx.lineTo(px + ax, py + ay);
    ctx.stroke();

    // Particle
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Labels for vectors
    ctx.fillStyle = "#a3e635";
    ctx.fillText("y(t)", cx + (px-cx)/2 + 5, cy + (py-cy)/2 - 5);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("y'(t)", px + vx + 5, py + vy + 5);
    ctx.fillStyle = "#facc15";
    ctx.fillText("y''(t)", px + ax - 20, py + ay - 10);
  };

  const drawSpringMass = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, damping: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("បង្កើតគំរូរូបវិទ្យាស៊ីជម្រៅ (Spring-Mass System)", 20, 30);
    
    ctx.fillStyle = "#fb7185";
    ctx.font = "16px monospace";
    ctx.fillText("my'' + cy' + ky = F(t)", 20, 60);

    const c = damping / 50; // Damping factor (0 to 2)
    const m = 1; // Mass
    const k_spring = 5; // Spring constant
    
    // Simulating underdamped/overdamped
    // For visual simplicity, we'll use an analytic-like function that decays based on c
    const omega = Math.sqrt(k_spring/m);
    
    const xBase = 100;
    const yBase = h / 2;

    const displacement = 80 * Math.exp(-c * t * 0.5) * Math.cos(omega * t * 2);

    // Draw support
    ctx.fillStyle = "#64748b";
    ctx.fillRect(30, 80, 20, h - 160);

    // Draw spring
    ctx.beginPath();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.moveTo(50, yBase);
    
    const springEnd = xBase + 100 + displacement;
    const numCoils = 10;
    const coilWidth = (springEnd - 50) / numCoils;
    
    for(let i=0; i<=numCoils; i++) {
        const x = 50 + i * coilWidth;
        const y = yBase + (i % 2 === 0 ? 15 : -15) * (i===0||i===numCoils ? 0 : 1);
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw mass
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(springEnd, yBase - 30, 60, 60);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("m", springEnd + 22, yBase + 5);

    // Draw Graph of displacement
    const graphX = 350;
    const graphY = yBase;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(graphX, graphY);
    ctx.lineTo(w - 20, graphY);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2;
    for(let x=0; x < w - graphX - 20; x++) {
        const simT = t - (w - graphX - 20 - x) * 0.02;
        if(simT < 0) continue;
        const d = 80 * Math.exp(-c * simT * 0.5) * Math.cos(omega * simT * 2);
        if(x===0) ctx.moveTo(graphX + x, graphY - d);
        else ctx.lineTo(graphX + x, graphY - d);
    }
    ctx.stroke();
  };

  const drawRLCCircuit = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, damping: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("សៀគ្វីអគ្គិសនី RLC (RLC Circuits)", 20, 30);
    
    ctx.fillStyle = "#facc15";
    ctx.font = "16px monospace";
    ctx.fillText("Lq'' + Rq' + (1/C)q = V(t)", 20, 60);

    const R = damping / 10; // Resistance equivalent to damping
    
    // Draw Graph of Charge or Current
    const cx = 50;
    const cy = h / 2 + 30;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    for (let x = 0; x <= w - 100; x += 2) {
      const simT = t - (w - 100 - x) * 0.05;
      if (simT < 0) continue;
      // Damped sine wave for RLC response
      const charge = 100 * Math.exp(-R * simT * 0.2) * Math.sin(3 * simT);
      if (x === 0) ctx.moveTo(cx + x, cy - charge);
      else ctx.lineTo(cx + x, cy - charge);
    }
    ctx.stroke();

    // Circuit Diagram symbolic
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, 120, 150, 80);
    
    ctx.fillStyle = "#fff";
    ctx.font = "14px system-ui";
    ctx.fillText("R", cx + 70, 110);
    ctx.fillText("L", cx + 160, 165);
    ctx.fillText("C", cx + 70, 220);
    ctx.fillText("V~", cx - 25, 165);
  };

  const drawWave = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, damping: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("ការសាយភាយរលក (Wave Propagation)", 20, 30);
    
    ctx.fillStyle = "#38bdf8";
    ctx.font = "16px monospace";
    ctx.fillText("∂²u/∂t² = c² (∂²u/∂x²)", 20, 60); // 1D Wave equation (related to 2nd order)

    const cx = 50;
    const cy = h / 2 + 20;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(w - 50, cy);
    ctx.stroke();

    // Draw Standing Wave / Propagating Wave
    const speed = damping / 20; // use damping slider for wave speed
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    for (let x = 0; x <= w - 100; x += 2) {
      // superposition of two traveling waves = standing wave, or just traveling
      const k = 0.05;
      const wave = 60 * Math.sin(k * x - speed * t * 5);
      if (x === 0) ctx.moveTo(cx + x, cy - wave);
      else ctx.lineTo(cx + x, cy - wave);
    }
    ctx.stroke();
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Activity className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ការយល់ដឹងអំពីសមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី២ <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">2ND ORDER DIFFERENTIAL EQ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ហេតុអ្វីវាចាំបាច់សម្រាប់ការសិក្សា និងជីវិតពិត?
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Categories / Tabs matching Infographic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleModeChange("concept")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "concept"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Lightbulb className="w-5 h-5 mb-1" />
          <span className="text-xs font-bold leading-tight">ឌីណាមិក & ស្ថិរភាព</span>
          <span className="text-[10px] font-mono opacity-60">Dynamics</span>
        </button>
        <button
          onClick={() => handleModeChange("spring_mass")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "spring_mass"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-xs font-bold leading-tight">គំរូរូបវិទ្យាស៊ីជម្រៅ</span>
          <span className="text-[10px] font-mono opacity-60">Spring-Mass</span>
        </button>
        <button
          onClick={() => handleModeChange("rlc_circuit")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "rlc_circuit"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Zap className="w-5 h-5 mb-1" />
          <span className="text-xs font-bold leading-tight">សៀគ្វីអគ្គិសនី</span>
          <span className="text-[10px] font-mono opacity-60">RLC Circuits</span>
        </button>
        <button
          onClick={() => handleModeChange("wave")}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "wave"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Waves className="w-5 h-5 mb-1" />
          <span className="text-xs font-bold leading-tight">ការសាយភាយរលក</span>
          <span className="text-[10px] font-mono opacity-60">Wave</span>
        </button>
      </div>

      {/* Main Display Window */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 min-h-[300px]">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Interactive Controls */}
      {state.mode !== "concept" && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>ប៉ារ៉ាម៉ែត្រ (Parameter) - {state.mode === "spring_mass" ? "Damping (c)" : state.mode === "rlc_circuit" ? "Resistance (R)" : "Wave Speed (c)"}</span>
            <span className="text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Val = {state.xVal}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={state.xVal}
            onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
        </div>
      )}
    </div>
  );
}
