import React, { useEffect, useRef, useState } from "react";
import { PhysicsSimState } from "../types";
import { Play, RotateCcw, HelpCircle, Flame, Compass } from "lucide-react";

interface PhysicsSimProps {
  state: PhysicsSimState;
  onChange: (state: PhysicsSimState) => void;
  onExplainRequest: () => void;
}

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
}

export default function PhysicsSim({ state, onChange, onExplainRequest }: PhysicsSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [trail, setTrail] = useState<Point[]>([]);
  const [ball, setBall] = useState<Point | null>(null);
  
  // High-score parameters
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [maxRange, setMaxRange] = useState<number>(0);
  const [flightTime, setFlightTime] = useState<number>(0);

  // Animation reference
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Physics update interval
  useEffect(() => {
    if (!isLaunching || !ball) return;

    let currentBall = { ...ball };
    let currentTrail = [...trail];
    const dt = 0.05; // simulation time step

    const animate = () => {
      // 1. Calculate accelerations
      let ax = 0;
      let ay = -state.gravity;

      // Simple air resistance drag force proportional to velocity squared: Fd = 0.5 * Cd * rho * A * v^2
      // Let's use linear resistance Fd = -k * v for simplicity and visual pleasantness
      if (state.airResistance) {
        const k = 0.08 / state.mass; // drag coefficient dependent on mass
        ax -= k * currentBall.vx;
        ay -= k * currentBall.vy;
      }

      // 2. Update velocity
      currentBall.vx += ax * dt;
      currentBall.vy += ay * dt;

      // 3. Update position
      currentBall.x += currentBall.vx * dt;
      currentBall.y += currentBall.vy * dt;
      currentBall.t += dt;

      // Add to trail
      currentTrail.push({ ...currentBall });

      // Update max height stats
      if (currentBall.y > maxHeight) {
        setMaxHeight(currentBall.y);
      }

      // Check collision with ground (y = 0)
      if (currentBall.y <= 0) {
        currentBall.y = 0;
        setIsLaunching(false);
        setMaxRange(currentBall.x);
        setFlightTime(currentBall.t);
        setBall(null);
      } else {
        setBall({ ...currentBall });
        setTrail([...currentTrail]);
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isLaunching, ball, state.gravity, state.airResistance, state.mass]);

  // Redraw whenever parameters or trail changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 800) * window.devicePixelRatio;
      canvas.height = (rect?.height || 400) * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      draw();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear canvas so the HTML background gradient and glows show through
      ctx.clearRect(0, 0, width, height);

      // Draw Grid Lines (thin subtle modern lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Cannon Position (Origin)
      const originX = 60;
      const originY = height - 60;

      // Scale factors: 1 meter = 8 pixels
      const scale = 8; 

      // Draw Ground Level (glowing grass/line)
      ctx.strokeStyle = "#475569"; // slate-600
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();

      // Grass gradient glow below ground
      const grassGrad = ctx.createLinearGradient(0, originY, 0, height);
      grassGrad.addColorStop(0, "rgba(16, 185, 129, 0.1)");
      grassGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, originY, width, height - originY);

      // Draw Cannon Barrel
      const angleRad = (state.angle * Math.PI) / 180;
      const barrelLength = 45;
      const endX = originX + Math.cos(angleRad) * barrelLength;
      const endY = originY - Math.sin(angleRad) * barrelLength;

      ctx.strokeStyle = "#94a3b8"; // slate-400
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Cannon Mount wheel
      ctx.fillStyle = "#334155"; // slate-700
      ctx.beginPath();
      ctx.arc(originX, originY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Projectile Trajectory Trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(originX + Math.cos(angleRad) * barrelLength, originY - Math.sin(angleRad) * barrelLength);
        
        trail.forEach((p) => {
          const px = originX + p.x * scale;
          const py = originY - p.y * scale;
          ctx.lineTo(px, py);
        });

        ctx.strokeStyle = "#f59e0b"; // amber-500
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]); // reset
      }

      // Draw Peak height indicator line
      if (maxHeight > 0) {
        const peakY = originY - maxHeight * scale;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // red dashed
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, peakY);
        ctx.lineTo(width, peakY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = "#ef4444";
        ctx.font = "10px monospace";
        ctx.fillText(`H_max = ${maxHeight.toFixed(2)} m`, 10, peakY - 4);
      }

      // Draw landing flag
      if (maxRange > 0) {
        const landX = originX + maxRange * scale;
        ctx.strokeStyle = "#10b981"; // emerald
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(landX, originY);
        ctx.lineTo(landX, originY - 20);
        ctx.lineTo(landX + 15, originY - 15);
        ctx.lineTo(landX, originY - 10);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.fillText(`R = ${maxRange.toFixed(2)} m`, landX + 5, originY - 25);
      }

      // Draw active Flying Ball & Force Vectors
      if (ball) {
        const bx = originX + ball.x * scale;
        const by = originY - ball.y * scale;

        // Draw Speed Vector Arrow (Red)
        const velArrowScale = 1.5;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + ball.vx * velArrowScale, by - ball.vy * velArrowScale);
        ctx.stroke();

        // Arrow head
        const arrowAngle = Math.atan2(-ball.vy, ball.vx);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(bx + ball.vx * velArrowScale, by - ball.vy * velArrowScale);
        ctx.lineTo(
          bx + ball.vx * velArrowScale - 6 * Math.cos(arrowAngle - Math.PI/6),
          by - ball.vy * velArrowScale - 6 * Math.sin(arrowAngle - Math.PI/6)
        );
        ctx.lineTo(
          bx + ball.vx * velArrowScale - 6 * Math.cos(arrowAngle + Math.PI/6),
          by - ball.vy * velArrowScale - 6 * Math.sin(arrowAngle + Math.PI/6)
        );
        ctx.fill();

        // Draw Gravity Vector Arrow (Blue, pointing straight down)
        ctx.strokeStyle = "#38bdf8"; // sky-400
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + state.gravity * 2);
        ctx.stroke();
        // Gravity arrow head
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(bx, by + state.gravity * 2);
        ctx.lineTo(bx - 4, by + state.gravity * 2 - 6);
        ctx.lineTo(bx + 4, by + state.gravity * 2 - 6);
        ctx.fill();

        // Draw projectile ball itself (glowing orange sphere)
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316"; // orange-500
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f97316";
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw live telemetry text next to ball
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "9px monospace";
        ctx.fillText(`v = ${(Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy)).toFixed(1)} m/s`, bx + 12, by - 5);
        ctx.fillText(`t = ${ball.t.toFixed(2)} s`, bx + 12, by + 7);
      }
    };

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [state, ball, trail, maxHeight, maxRange]);

  const handleLaunch = () => {
    if (isLaunching) return;

    // Reset old stats
    setMaxHeight(0);
    setMaxRange(0);
    setFlightTime(0);

    const angleRad = (state.angle * Math.PI) / 180;
    const barrelLength = 45 / 8; // matched to canvas scale

    const v0x = state.velocity * Math.cos(angleRad);
    const v0y = state.velocity * Math.sin(angleRad);

    const initialBall: Point = {
      x: Math.cos(angleRad) * barrelLength,
      y: Math.sin(angleRad) * barrelLength,
      vx: v0x,
      vy: v0y,
      t: 0,
    };

    setTrail([initialBall]);
    setBall(initialBall);
    setIsLaunching(true);
  };

  const handleReset = () => {
    setIsLaunching(false);
    setTrail([]);
    setBall(null);
    setMaxHeight(0);
    setMaxRange(0);
    setFlightTime(0);
  };

  const handlePreset = (angleVal: number, velVal: number, drag: boolean) => {
    onChange({
      ...state,
      angle: angleVal,
      velocity: velVal,
      airResistance: drag,
    });
    handleReset();
  };

  return (
    <div id="physics-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              ពិសោធន៍ចលនាគប់គ្រាប់ផ្លោង (Projectile Motion Simulator)
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              បាញ់គ្រាប់កាំភ្លើងធំ និងអង្កេតចលនាប៉ារ៉ាបូល ឥទ្ធិពលទំនាញ និងភាពទប់ខ្យល់
            </p>
          </div>
        </div>
        <button
          id="btn-physics-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់រូបមន្តដោយគ្រូ AI
        </button>
      </div>

      {/* Simulator view area (Upper portion) */}
      <div className="flex-1 relative min-h-[300px] md:min-h-[400px] overflow-hidden bg-gradient-to-b from-[#0f172a] to-black">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
        
        {/* Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

        {/* Telemetry Dashboard in top corner */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 shadow-2xl max-w-xs z-10">
          <div className="font-bold text-cyan-400 border-b border-white/5 pb-1 mb-2 tracking-wider uppercase text-[10px]">លទ្ធផលវាស់វែង (Telemetry Logs)</div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">មុំគប់ (Angle):</span>
            <span className="text-white font-bold">{state.angle}°</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">ល្បឿនដើម (v0):</span>
            <span className="text-white font-bold">{state.velocity} m/s</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">កម្ពស់ខ្ពស់បំផុត (Max Height):</span>
            <span className="text-rose-400 font-bold">{(maxHeight || ball?.y || 0).toFixed(2)} m</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">រយៈចម្ងាយបាញ់ (Range):</span>
            <span className="text-cyan-400 font-bold">{(maxRange || ball?.x || 0).toFixed(2)} m</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">រយៈពេលហោះ (Time):</span>
            <span className="text-purple-400 font-bold">{(flightTime || ball?.t || 0).toFixed(2)} s</span>
          </div>
        </div>

        {/* Quick Presets Float Bottom Left */}
        <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
          <button
            onClick={() => handlePreset(45, 18, false)}
            className="px-2.5 py-1 bg-black/60 backdrop-blur border border-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] hover:bg-slate-900 transition-colors"
          >
            🎯 45° គ្មានទប់ខ្យ
          </button>
          <button
            onClick={() => handlePreset(60, 22, true)}
            className="px-2.5 py-1 bg-black/60 backdrop-blur border border-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] hover:bg-slate-900 transition-colors"
          >
            🌪️ 60° មានទប់ខ្យល់
          </button>
        </div>
      </div>

      {/* Controller Controls (Lower portion) */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Trigger Buttons */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">របារបញ្ជាគប់ (Fire Controls)</span>
            <button
              id="btn-physics-fire"
              disabled={isLaunching}
              onClick={handleLaunch}
              className={`py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                isLaunching
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              បាញ់គ្រាប់ផ្លោង (Fire Cannon)
            </button>
            <button
              id="btn-physics-reset"
              onClick={handleReset}
              className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              សម្អាតផ្លូវចាស់ (Clear Canvas)
            </button>
          </div>

          {/* Sliders Area */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">មុំគប់ (Angle - គ្រាប់ផ្លោង)</span>
                  <span className="text-cyan-400 font-bold">{state.angle}°</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-physics-angle"
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={state.angle}
                    onChange={(e) => {
                      onChange({ ...state, angle: parseInt(e.target.value) });
                      handleReset();
                    }}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">ល្បឿនដើម (Velocity)</span>
                  <span className="text-cyan-400 font-bold">{state.velocity} m/s</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-physics-velocity"
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={state.velocity}
                    onChange={(e) => {
                      onChange({ ...state, velocity: parseInt(e.target.value) });
                      handleReset();
                    }}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Column 2 Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">ទំនាញដី (Gravity)</span>
                  <span className="text-cyan-400 font-bold">{state.gravity} m/s²</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-physics-gravity"
                    type="range"
                    min="1.6" // Moon
                    max="20.0"
                    step="0.1"
                    value={state.gravity}
                    onChange={(e) => {
                      onChange({ ...state, gravity: parseFloat(e.target.value) });
                      handleReset();
                    }}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                  <span>🌙 Moon (1.6)</span>
                  <span>🌍 Earth (9.8)</span>
                  <span>🪐 Jupiter (24.8)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">ម៉ាស់គ្រាប់ផ្លោង (Mass)</span>
                  <span className="text-cyan-400 font-bold">{state.mass} kg</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-physics-mass"
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={state.mass}
                    onChange={(e) => {
                      onChange({ ...state, mass: parseFloat(e.target.value) });
                      handleReset();
                    }}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Column 3 Drag Toggles & Quick Planet Setup */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-300 font-semibold">កម្លាំងទប់ខ្យល់ (Air Resistance)</span>
                  <span className="text-[10px] text-slate-500">បន្ថែមភាពទប់កកិតរបស់ខ្យល់ពិតៗ</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="checkbox-physics-drag"
                    type="checkbox"
                    checked={state.airResistance}
                    onChange={(e) => {
                      onChange({ ...state, airResistance: e.target.checked });
                      handleReset();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono block mb-2 uppercase tracking-widest">បរិស្ថានល្បឿនលឿន (Gravity Presets)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { onChange({ ...state, gravity: 1.62 }); handleReset(); }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 border border-white/10 rounded-lg font-mono transition-colors"
                  >
                    🌙 ព្រះចន្ទ
                  </button>
                  <button
                    onClick={() => { onChange({ ...state, gravity: 9.81 }); handleReset(); }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 border border-white/10 rounded-lg font-mono transition-colors"
                  >
                    🌍 ផែនដី
                  </button>
                  <button
                    onClick={() => { onChange({ ...state, gravity: 3.71 }); handleReset(); }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 border border-white/10 rounded-lg font-mono transition-colors"
                  >
                    🔴 ភពអង្គារ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
