import React, { useEffect, useRef, useState } from "react";
import { MathSimState } from "../types";
import { Play, Pause, RotateCcw, HelpCircle, Activity } from "lucide-react";

interface MathSimProps {
  state: MathSimState;
  onChange: (state: MathSimState) => void;
  onExplainRequest: () => void;
}

export default function MathSim({ state, onChange, onExplainRequest }: MathSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState<number>(0); // angle in radians
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);

  // Handle Play/Pause animation of the wave & circle
  useEffect(() => {
    if (isPlaying) {
      const update = () => {
        setAngle((prev) => (prev + 0.02 * state.frequency) % (Math.PI * 2));
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, state.frequency]);

  // Redraw canvas whenever state, angle, or size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use ResizeObserver for responsive canvas sizing
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

      // Draw Grid Lines (thin, subtle modern tech lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate sizes
      const circleX = width * 0.25;
      const circleY = height * 0.5;
      const circleRadius = Math.min(width * 0.16, height * 0.35);

      const graphXStart = width * 0.5;
      const graphWidth = width * 0.45;
      const centerY = height * 0.5;

      // --- Draw Unit Circle Side ---
      if (state.showUnitCircle) {
        // Outer Circle border (glowing white-blue)
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#38bdf8"; // sky-400
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Shadow glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#0284c7";
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Axis for Circle
        ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"; // slate-400
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(circleX - circleRadius - 20, circleY);
        ctx.lineTo(circleX + circleRadius + 20, circleY);
        ctx.moveTo(circleX, circleY - circleRadius - 20);
        ctx.lineTo(circleX, circleY + circleRadius + 20);
        ctx.stroke();

        // Target point coordinates on Unit Circle
        const pointX = circleX + Math.cos(angle) * circleRadius;
        const pointY = circleY - Math.sin(angle) * circleRadius; // Canvas y-axis is inverted

        // Draw Cosine projection (Red line on X-axis)
        ctx.beginPath();
        ctx.moveTo(circleX, circleY);
        ctx.lineTo(pointX, circleY);
        ctx.strokeStyle = "#ef4444"; // red-500
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Sine projection (Green line from X-axis to point)
        ctx.beginPath();
        ctx.moveTo(pointX, circleY);
        ctx.lineTo(pointX, pointY);
        ctx.strokeStyle = "#10b981"; // emerald-500
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Hypotenuse / Vector (Rotating Radius)
        ctx.beginPath();
        ctx.moveTo(circleX, circleY);
        ctx.lineTo(pointX, pointY);
        ctx.strokeStyle = "#e2e8f0"; // slate-200
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw glowing point
        ctx.beginPath();
        ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#38bdf8";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Angle θ Arc
        ctx.beginPath();
        ctx.arc(circleX, circleY, 25, 0, -angle, true);
        ctx.strokeStyle = "#f59e0b"; // amber-500
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text labels inside Circle
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(`θ = ${((angle * 180) / Math.PI).toFixed(0)}°`, circleX + 10, circleY - 10);
        ctx.fillStyle = "#ef4444";
        ctx.fillText(`cos(θ) = ${Math.cos(angle).toFixed(2)}`, circleX - 60, circleY + circleRadius + 25);
        ctx.fillStyle = "#10b981";
        ctx.fillText(`sin(θ) = ${Math.sin(angle).toFixed(2)}`, circleX + 45, circleY + circleRadius + 25);
      }

      // --- Draw Wave Graph Side ---
      // X & Y Axis for Graph
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphXStart, centerY);
      ctx.lineTo(graphXStart + graphWidth, centerY);
      ctx.moveTo(graphXStart, centerY - circleRadius - 10);
      ctx.lineTo(graphXStart, centerY + circleRadius + 10);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("X (ផាស/Phase)", graphXStart + graphWidth - 80, centerY - 10);
      ctx.fillText("Y (កម្ពស់/Height)", graphXStart + 10, centerY - circleRadius);

      // Plot the mathematical wave
      ctx.beginPath();
      let first = true;
      const ampMultiplier = state.amplitude * circleRadius * 0.8; // fit nicely

      for (let screenX = graphXStart; screenX < graphXStart + graphWidth; screenX++) {
        // Map screenX to trigonometric input
        const relativeX = (screenX - graphXStart) / graphWidth * Math.PI * 4; // 2 cycles
        let val = 0;

        if (state.waveType === "sine") {
          val = Math.sin(relativeX * state.frequency - angle + state.phase);
        } else if (state.waveType === "cosine") {
          val = Math.cos(relativeX * state.frequency - angle + state.phase);
        } else if (state.waveType === "tangent") {
          val = Math.tan(relativeX * state.frequency - angle + state.phase);
          // Limit tangent values to avoid canvas rendering artifacts stretching to infinity
          if (Math.abs(val) > 4) continue;
        }

        const screenY = centerY - val * ampMultiplier;

        if (first) {
          ctx.moveTo(screenX, screenY);
          first = false;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }

      ctx.strokeStyle = state.waveType === "sine" ? "#06b6d4" : state.waveType === "cosine" ? "#f43f5e" : "#d946ef"; // Cyan/Rose/Magenta
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw dot matching current angle on the graph
      let currentVal = 0;
      if (state.waveType === "sine") currentVal = Math.sin(-angle + state.phase);
      else if (state.waveType === "cosine") currentVal = Math.cos(-angle + state.phase);
      else if (state.waveType === "tangent") currentVal = Math.tan(-angle + state.phase);

      if (Math.abs(currentVal) <= 4) {
        const indicatorY = centerY - currentVal * ampMultiplier;
        ctx.beginPath();
        ctx.arc(graphXStart, indicatorY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#38bdf8";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw dotted connecting line between circle and graph indicators
        if (state.showUnitCircle) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.moveTo(circleX + Math.cos(angle) * circleRadius, circleY - Math.sin(angle) * circleRadius);
          ctx.lineTo(graphXStart, indicatorY);
          ctx.stroke();
          ctx.setLineDash([]); // Reset
        }
      }

      // Display Wave Equation formula at bottom
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 13px 'JetBrains Mono', sans-serif";
      let formulaText = "";
      const sign = state.phase >= 0 ? "+" : "";
      if (state.waveType === "sine") {
        formulaText = `y = ${state.amplitude} * sin(${state.frequency}x ${sign} ${state.phase.toFixed(1)})`;
      } else if (state.waveType === "cosine") {
        formulaText = `y = ${state.amplitude} * cos(${state.frequency}x ${sign} ${state.phase.toFixed(1)})`;
      } else {
        formulaText = `y = ${state.amplitude} * tan(${state.frequency}x ${sign} ${state.phase.toFixed(1)})`;
      }
      ctx.fillText(formulaText, graphXStart, centerY + circleRadius + 30);
    };

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [state, angle]);

  const handleSliderChange = (key: keyof MathSimState, val: any) => {
    onChange({ ...state, [key]: val });
  };

  return (
    <div id="math-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              ពិសោធន៍រលកត្រីកោណមាត្រ និងរង្វង់ខ្នាត (Trigonometric & Unit Circle)
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              ស្វែងយល់ពីរបៀបដែលរង្វង់វិលបង្កើតជាលំនាំរលកស៊ីនុស និងកូស៊ីនុស
            </p>
          </div>
        </div>
        <button
          id="btn-math-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់រូបមន្តដោយគ្រូ AI
        </button>
      </div>

      {/* Simulator view area (Upper portion) with beautiful Immersive UI details */}
      <div className="flex-1 relative min-h-[300px] md:min-h-[400px] overflow-hidden bg-gradient-to-b from-[#0f172a] to-black">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
        
        {/* Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Visual Indicators */}
        <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 bg-black/60 rounded border border-white/10 text-[9px] font-bold text-cyan-400 uppercase tracking-widest">កំពុងដំណើរការ</span>
          <span className="px-2.5 py-0.5 bg-black/60 rounded border border-white/10 text-[9px] font-bold text-slate-500">60 FPS</span>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
      </div>

      {/* Controller Controls (Lower portion) */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulation status / animation controls */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">របារបញ្ជាចលនា (Playback)</span>
            <div className="flex items-center gap-3">
              <button
                id="btn-math-play-pause"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                  isPlaying
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "ផ្អាក (Pause)" : "លេង (Play)"}
              </button>
              <button
                id="btn-math-reset"
                onClick={() => setAngle(0)}
                className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-all duration-200"
                title="Reset angle to 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Wave Type Selector */}
            <div className="mt-2">
              <span className="text-[10px] text-slate-500 font-mono block mb-2 uppercase tracking-widest">ប្រភេទរលក (Wave Function)</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["sine", "cosine", "tangent"] as const).map((type) => (
                  <button
                    key={type}
                    id={`btn-wave-${type}`}
                    onClick={() => handleSliderChange("waveType", type)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold capitalize transition-all border ${
                      state.waveType === type
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        : "bg-slate-900/40 text-slate-400 border-white/5 hover:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core mathematical parameters */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Amplitude (អំព្លីទុត - កម្ពស់រលក)</span>
                  <span className="text-cyan-400 font-bold">{state.amplitude.toFixed(2)}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-math-amplitude"
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={state.amplitude}
                    onChange={(e) => handleSliderChange("amplitude", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Frequency (ហ្វ្រេកង់ - ភាពញឹក)</span>
                  <span className="text-cyan-400 font-bold">{state.frequency.toFixed(2)} Hz</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-math-frequency"
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={state.frequency}
                    onChange={(e) => handleSliderChange("frequency", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Right sliders & Toggles */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Phase Shift (លំអៀងផាស - ឆ្វេង/ស្តាំ)</span>
                  <span className="text-cyan-400 font-bold">{state.phase.toFixed(2)} rad</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-math-phase"
                    type="range"
                    min="-3.14"
                    max="3.14"
                    step="0.1"
                    value={state.phase}
                    onChange={(e) => handleSliderChange("phase", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-300 font-semibold">បង្ហាញរង្វង់ខ្នាត (Show Unit Circle)</span>
                  <span className="text-[10px] text-slate-500">មើលការទាញគណនា Sin/Cos ពីរង្វង់ខ្នាត</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="checkbox-math-circle"
                    type="checkbox"
                    checked={state.showUnitCircle}
                    onChange={(e) => handleSliderChange("showUnitCircle", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
