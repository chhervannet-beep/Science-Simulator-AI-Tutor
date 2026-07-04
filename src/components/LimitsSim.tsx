import React, { useEffect, useRef, useState } from "react";
import { LimitsSimState } from "../types";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  Activity, 
  Zap, 
  Grid, 
  Sliders, 
  Info,
  TrendingUp,
  Maximize2,
  Rocket,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface LimitsSimProps {
  state: LimitsSimState;
  onChange: (state: LimitsSimState) => void;
  onExplainRequest: () => void;
}

export default function LimitsSim({ state, onChange, onExplainRequest }: LimitsSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Local animation / play state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Subtopic states
  const [riemannType, setRiemannType] = useState<"left" | "right" | "midpoint">("midpoint");
  const [magnifierOpen, setMagnifierOpen] = useState<boolean>(true);

  // Animation effect
  useEffect(() => {
    let lastTime = performance.now();
    const update = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setTime((prev) => prev + delta);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Handle Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get parent dimensions
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Clear background
    ctx.fillStyle = "#020617"; // Slate 950
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.05)"; // slate-400 with opacity
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Origin Coordinates mapping
    const originX = width / 2;
    const originY = height / 2 + 50;
    const scaleX = 80; // pixels per unit
    const scaleY = 60; // pixels per unit

    // Function to map real math coordinates to canvas pixels
    const toCanvasX = (mx: number) => originX + mx * scaleX;
    const toCanvasY = (my: number) => originY - my * scaleY;

    // Function to map canvas pixels back to math coordinates
    const toMathX = (cx: number) => (cx - originX) / scaleX;
    const toMathY = (cy: number) => (originY - cy) / scaleY;

    // Draw main X and Y axes
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY); // X axis
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height); // Y axis
    ctx.stroke();

    // Axis Arrows
    ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    // X arrow
    ctx.beginPath();
    ctx.moveTo(width - 8, originY - 4);
    ctx.lineTo(width, originY);
    ctx.lineTo(width - 8, originY + 4);
    ctx.fill();
    // Y arrow
    ctx.beginPath();
    ctx.moveTo(originX - 4, 8);
    ctx.lineTo(originX, 0);
    ctx.lineTo(originX + 4, 8);
    ctx.fill();

    // Labels
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.fillText("X", width - 15, originY + 15);
    ctx.fillText("Y", originX - 15, 15);

    // MODE 1: INDETERMINATE FORM (0/0 Hole Explorer)
    if (state.mode === "indeterminate") {
      // Function is f(x) = (x^2 - 4) / (x - 2) which simplifies to g(x) = x + 2, with hole at (2, 4)
      const f = (x: number) => x + 2;
      const holeX = 2;
      const holeY = 4;

      // Draw the line graph
      ctx.strokeStyle = "#06b6d4"; // Cyan-500
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(6, 182, 212, 0.4)";
      
      ctx.beginPath();
      let first = true;
      for (let cx = 0; cx < width; cx++) {
        const mx = toMathX(cx);
        // Skip exactly x = 2 to simulate the hole mathematically
        if (Math.abs(mx - holeX) < 0.01) continue;
        
        const my = f(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw hole at x = 2
      ctx.strokeStyle = "#f43f5e"; // Rose-500 for warning/hole
      ctx.fillStyle = "#020617"; // Match background
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(toCanvasX(holeX), toCanvasY(holeY), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Show approaching point
      const currentX = state.xVal;
      const currentY = f(currentX);

      // Lines showing x and y projections
      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)"; // Red-500 with opacity
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(toCanvasX(currentX), toCanvasY(currentY));
      ctx.lineTo(toCanvasX(currentX), originY); // to X axis
      ctx.moveTo(toCanvasX(currentX), toCanvasY(currentY));
      ctx.lineTo(originX, toCanvasY(currentY)); // to Y axis
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw active point
      ctx.fillStyle = "#38bdf8"; // Sky-400
      ctx.beginPath();
      ctx.arc(toCanvasX(currentX), toCanvasY(currentY), 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw limit labels
      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText("L = 4", toCanvasX(2) + 15, toCanvasY(4) - 5);
      ctx.fillStyle = "#f43f5e";
      ctx.fillText("Hole (0/0)", toCanvasX(2) - 80, toCanvasY(4) - 15);

      // Magnifier Glass Overlay
      if (magnifierOpen) {
        const magCx = toCanvasX(2);
        const magCy = toCanvasY(4);
        const magRadius = 45;

        // Draw magnifier lens boundary
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // dark slate
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(magCx, magCy, magRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw handle
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(magCx + magRadius * 0.707, magCy + magRadius * 0.707);
        ctx.lineTo(magCx + magRadius * 1.3, magCy + magRadius * 1.3);
        ctx.stroke();

        // Draw magnified hole inside lens
        ctx.strokeStyle = "#f43f5e";
        ctx.fillStyle = "#0f172a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(magCx, magCy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw magnified approaching arrow
        ctx.fillStyle = "#06b6d4";
        ctx.fillText("x → 2", magCx - 15, magCy - 18);
        ctx.fillText("y → 4", magCx - 15, magCy + 25);
      }
    }

    // MODE 2: ASYMPTOTE & BEHAVIOR (1/x)
    else if (state.mode === "asymptote") {
      const f = (x: number) => 1 / x;

      // Draw the curves (Positive and Negative branches)
      ctx.strokeStyle = "#3b82f6"; // Blue-500
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";

      // Positive branch
      ctx.beginPath();
      let first = true;
      for (let cx = originX + 2; cx < width; cx++) {
        const mx = toMathX(cx);
        const my = f(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();

      // Negative branch
      ctx.beginPath();
      first = true;
      for (let cx = 0; cx < originX - 2; cx++) {
        const mx = toMathX(cx);
        const my = f(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw Asymptote lines
      ctx.strokeStyle = "#e11d48"; // Rose-600
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      // Vertical asymptote at x = 0
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();
      // Horizontal asymptote at y = 0
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Slider X point representation
      const currentX = state.xVal; // value from -5 to 5
      if (Math.abs(currentX) > 0.05) {
        const currentY = f(currentX);

        // Project lines to axes
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(currentX), toCanvasY(currentY));
        ctx.lineTo(toCanvasX(currentX), originY);
        ctx.moveTo(toCanvasX(currentX), toCanvasY(currentY));
        ctx.lineTo(originX, toCanvasY(currentY));
        ctx.stroke();
        ctx.setLineDash([]);

        // Point
        ctx.fillStyle = "#60a5fa"; // Blue-400
        ctx.beginPath();
        ctx.arc(toCanvasX(currentX), toCanvasY(currentY), 6, 0, Math.PI * 2);
        ctx.fill();

        // Label details
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.fillText(`x = ${currentX.toFixed(3)}`, toCanvasX(currentX) + 12, toCanvasY(currentY) - 5);
        ctx.fillText(`y = ${currentY.toFixed(3)}`, toCanvasX(currentX) + 12, toCanvasY(currentY) + 10);
      }
    }

    // MODE 3: DERIVATIVE (Secant to Tangent)
    else if (state.mode === "derivative") {
      // f(x) = 0.5 * x^2 (Parabola)
      const f = (x: number) => 0.4 * x * x;
      const x0 = 1.0;
      const y0 = f(x0);
      const h = state.deltaX; // approaches 0
      const x1 = x0 + h;
      const y1 = f(x1);

      // Parabola Graph
      ctx.strokeStyle = "#818cf8"; // Indigo-400
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;
      for (let cx = 0; cx < width; cx++) {
        const mx = toMathX(cx);
        const my = f(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();

      // Secant Line (through (x0, y0) and (x1, y1))
      const secantSlope = (y1 - y0) / (x1 - x0);
      const secantF = (x: number) => y0 + secantSlope * (x - x0);

      ctx.strokeStyle = "#f59e0b"; // Amber-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let cx = 0; cx < width; cx++) {
        const mx = toMathX(cx);
        const my = secantF(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (cx === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Tangent Line (analytical slope at x0 is f'(x0) = 0.8 * x0)
      const tangentSlope = 0.8 * x0;
      const tangentF = (x: number) => y0 + tangentSlope * (x - x0);

      ctx.strokeStyle = "#10b981"; // Emerald-500
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
      ctx.beginPath();
      for (let cx = 0; cx < width; cx++) {
        const mx = toMathX(cx);
        const my = tangentF(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (cx === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw points P(x0, y0) and Q(x1, y1)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(toCanvasX(x0), toCanvasY(y0), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(toCanvasX(x1), toCanvasY(y1), 5, 0, Math.PI * 2);
      ctx.fill();

      // Point Labels
      ctx.fillStyle = "#ffffff";
      ctx.fillText("P (x₀, y₀)", toCanvasX(x0) - 60, toCanvasY(y0) - 10);
      ctx.fillStyle = "#f59e0b";
      ctx.fillText(`Q (x₀+h, f(x₀+h))`, toCanvasX(x1) + 10, toCanvasY(y1) + 15);

      // Annotations
      ctx.fillStyle = "#10b981";
      ctx.fillText(`Tangent slope (f'(x)): ${tangentSlope.toFixed(2)}`, 20, 40);
      ctx.fillStyle = "#f59e0b";
      ctx.fillText(`Secant slope (Δy/Δx): ${secantSlope.toFixed(2)}`, 20, 60);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`h = ${h.toFixed(2)}`, toCanvasX(x0 + h / 2), originY - 15);
    }

    // MODE 4: INTEGRAL (Riemann Sum Limit)
    else if (state.mode === "integral") {
      // f(x) = sin(x) + 1.5
      const f = (x: number) => Math.sin(x) + 1.5;
      const startX = -1.5;
      const endX = 3.5;
      const N = state.intervals; // Number of rectangles
      const dx = (endX - startX) / N;

      // Draw Riemann Rectangles
      ctx.fillStyle = "rgba(6, 182, 212, 0.25)"; // Translucent Cyan
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 1;

      let sumArea = 0;
      for (let i = 0; i < N; i++) {
        let xRect = startX + i * dx;
        if (riemannType === "right") xRect = startX + (i + 1) * dx;
        else if (riemannType === "midpoint") xRect = startX + (i + 0.5) * dx;

        const hRect = f(xRect);
        sumArea += hRect * dx;

        // Draw on canvas
        const rx1 = toCanvasX(startX + i * dx);
        const rx2 = toCanvasX(startX + (i + 1) * dx);
        const ry = toCanvasY(hRect);
        const rZeroY = toCanvasY(0);

        ctx.fillRect(rx1, ry, rx2 - rx1, rZeroY - ry);
        ctx.strokeRect(rx1, ry, rx2 - rx1, rZeroY - ry);
      }

      // Draw continuous function curve
      ctx.strokeStyle = "#a855f7"; // Purple-500
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
      ctx.beginPath();
      let first = true;
      for (let cx = 0; cx < width; cx++) {
        const mx = toMathX(cx);
        if (mx < startX - 0.5 || mx > endX + 0.5) continue;
        const my = f(mx);
        const cy = toCanvasY(my);
        if (cy >= 0 && cy <= height) {
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // exact Area (analytical integral of sin(x) + 1.5 from -1.5 to 3.5 is [-cos(x) + 1.5x])
      const exactArea = (-Math.cos(endX) + 1.5 * endX) - (-Math.cos(startX) + 1.5 * startX);

      // Text status display
      ctx.fillStyle = "#ffffff";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(`Riemann Sum Area (Sₙ): ${sumArea.toFixed(4)}`, 20, 40);
      ctx.fillStyle = "#a855f7";
      ctx.fillText(`Exact Integral Area (A): ${exactArea.toFixed(4)}`, 20, 60);
      const errPercent = Math.abs((sumArea - exactArea) / exactArea) * 100;
      ctx.fillStyle = errPercent < 1 ? "#10b981" : "#f59e0b";
      ctx.fillText(`Approximation Error: ${errPercent.toFixed(2)}%`, 20, 80);
    }

    // MODE 5: APPLICATION (Rocket velocity & Speed Limit)
    else if (state.mode === "application") {
      // Curve of rocket position: s(t) = 0.5 * t^2 + 2
      const s = (t: number) => 0.5 * t * t;
      const t0 = 2.0; // Seconds to examine
      const s0 = s(t0);
      const dt = state.deltaX; // Delta t slider
      const t1 = t0 + dt;
      const s1 = s(t1);

      // Rocket flight curve
      ctx.strokeStyle = "#e11d48"; // Rose-500
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;
      for (let cx = 0; cx < width - 150; cx++) {
        const mt = (cx / (width - 150)) * 5; // time 0 to 5s
        const ms = s(mt);
        // Map: X is Time, Y is Position
        const cxScaled = 50 + mt * 70;
        const cyScaled = height - 50 - ms * 25;
        if (first) {
          ctx.moveTo(cxScaled, cyScaled);
          first = false;
        } else {
          ctx.lineTo(cxScaled, cyScaled);
        }
      }
      ctx.stroke();

      // Axes for Rocket graph
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.beginPath();
      ctx.moveTo(50, height - 50);
      ctx.lineTo(width - 150, height - 50); // Time axis
      ctx.moveTo(50, 20);
      ctx.lineTo(50, height - 50); // Position axis
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.fillText("Time t (s)", width - 210, height - 35);
      ctx.fillText("Height s (m)", 15, 30);

      // Draw times t0 and t1 projections
      const cx0 = 50 + t0 * 70;
      const cy0 = height - 50 - s0 * 25;
      const cx1 = 50 + t1 * 70;
      const cy1 = height - 50 - s1 * 25;

      ctx.strokeStyle = "rgba(244, 63, 94, 0.3)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      // t0 lines
      ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, height - 50);
      ctx.moveTo(cx0, cy0); ctx.lineTo(50, cy0);
      // t1 lines
      ctx.moveTo(cx1, cy1); ctx.lineTo(cx1, height - 50);
      ctx.moveTo(cx1, cy1); ctx.lineTo(50, cy1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Average Speed Line (Secant)
      ctx.strokeStyle = "#fbbf24"; // Yellow
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0 - 30, cy0 + 30 * (cy1 - cy0)/(cx1 - cx0));
      ctx.lineTo(cx1 + 40, cy1 - 40 * (cy1 - cy0)/(cx1 - cx0));
      ctx.stroke();

      // Points
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(cx0, cy0, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath(); ctx.arc(cx1, cy1, 5, 0, Math.PI*2); ctx.fill();

      // Instantaneous Velocity calculations
      const avgVel = (s1 - s0) / dt; // (s(t0+dt) - s(t0))/dt
      const instVel = t0; // Derivative of 0.5t^2 at t0=2 is 2.0 * t0 * 0.5 = t0 = 2.0 m/s

      // Rocket Animation on Right side!
      const rX = width - 80;
      const rYStart = height - 80;
      const rYLimit = 50;
      // Interpolate rocket Y based on animated time or slider ratio
      const animRatio = (time % 4) / 4;
      const currentRocketY = rYStart - animRatio * (rYStart - rYLimit);

      // Rocket plume glow
      if (isPlaying) {
        ctx.fillStyle = "rgba(249, 115, 22, 0.6)"; // Orange
        ctx.beginPath();
        ctx.arc(rX, currentRocketY + 30, 10 + Math.sin(time * 30) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stylized SVG-like Rocket on Canvas
      ctx.fillStyle = "#e2e8f0"; // Body slate-200
      ctx.beginPath();
      ctx.moveTo(rX, currentRocketY - 25); // Nose
      ctx.lineTo(rX - 10, currentRocketY + 15);
      ctx.lineTo(rX + 10, currentRocketY + 15);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ef4444"; // Nose & Fins Red
      ctx.beginPath();
      ctx.moveTo(rX, currentRocketY - 25);
      ctx.lineTo(rX - 6, currentRocketY - 5);
      ctx.lineTo(rX + 6, currentRocketY - 5);
      ctx.closePath();
      ctx.fill();

      // Fins
      ctx.beginPath();
      ctx.moveTo(rX - 10, currentRocketY + 5);
      ctx.lineTo(rX - 18, currentRocketY + 20);
      ctx.lineTo(rX - 10, currentRocketY + 15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rX + 10, currentRocketY + 5);
      ctx.lineTo(rX + 18, currentRocketY + 20);
      ctx.lineTo(rX + 10, currentRocketY + 15);
      ctx.fill();

      // Info Texts
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText("Rocket Physics (លីមីតល្បឿន)", 20, 35);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText(`Average Speed v_avg = Δs/Δt = ${avgVel.toFixed(3)} m/s`, 20, 55);
      ctx.fillStyle = "#10b981";
      ctx.fillText(`Instantaneous Speed v(2s) = ${instVel.toFixed(1)} m/s`, 20, 75);
    }

  }, [state.mode, state.xVal, state.deltaX, state.intervals, riemannType, magnifierOpen, time, isPlaying]);

  // Handle Preset quick changes
  const handleModeChange = (mode: LimitsSimState["mode"]) => {
    let defaultX = 1.0;
    let defaultDelta = 1.0;
    let defaultIntervals = 6;

    if (mode === "indeterminate") {
      defaultX = 1.5; // Starts near 2
    } else if (mode === "asymptote") {
      defaultX = 0.8; // Near 0
    } else if (mode === "derivative") {
      defaultDelta = 1.2;
    } else if (mode === "integral") {
      defaultIntervals = 8;
    } else if (mode === "application") {
      defaultDelta = 1.5;
    }

    onChange({
      ...state,
      mode,
      xVal: defaultX,
      deltaX: defaultDelta,
      intervals: defaultIntervals
    });
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(129,140,248,0.15)]">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ម៉ាស៊ីនពិសោធន៍ លីមីត និងគ្រឹះគណនា <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">LIMITS & CALCULUS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ស្វែងយល់ពីគ្រឹះនៃគណិតវិទ្យាជាន់ខ្ពស់ ការពន្យល់តាមក្រាហ្វិក 2D/3D ស្របតាមសន្លឹកកិច្ចការគណិតវិទ្យា
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          id="btn-explain-limits"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* Sub-navigation tabs (Column representation matching the Khmer poster) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          id="lim-tab-calc-foundation"
          onClick={() => handleModeChange("integral")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "integral"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">១. គ្រឹះ Calculus</span>
          <span className="text-xs font-bold leading-tight">លីមីតនៃ Riemann</span>
        </button>

        <button
          id="lim-tab-indeterminate"
          onClick={() => handleModeChange("indeterminate")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "indeterminate"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">២. មិនកំណត់</span>
          <span className="text-xs font-bold leading-tight">រាវរកទម្រង់ ០/០</span>
        </button>

        <button
          id="lim-tab-asymptote"
          onClick={() => handleModeChange("asymptote")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "asymptote"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៣. អនន្ត / អសីមតូត</span>
          <span className="text-xs font-bold leading-tight">ឥរិយាបថ ១/x</span>
        </button>

        <button
          id="lim-tab-derivative"
          onClick={() => handleModeChange("derivative")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "derivative"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៤. ដេរីវេ</span>
          <span className="text-xs font-bold leading-tight">ខ្សែខណ្ឌទៅខ្សែកិត</span>
        </button>

        <button
          id="lim-tab-application"
          onClick={() => handleModeChange("application")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "application"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៥. អនុវត្តជាក់ស្តែង</span>
          <span className="text-xs font-bold leading-tight">ល្បឿនយាន Rocket</span>
        </button>
      </div>

      {/* Primary Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas visualizer viewport */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex flex-col relative min-h-[380px] justify-center shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Interactive controls overlays depending on mode */}
          {state.mode === "indeterminate" && (
            <button
              onClick={() => setMagnifierOpen(!magnifierOpen)}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 text-xs text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {magnifierOpen ? "លាក់កញ្ចក់ពង្រីក (Hide Lens)" : "បង្ហាញកញ្ចក់ពង្រីក (Show Lens)"}
            </button>
          )}

          {state.mode === "integral" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              {(["left", "right", "midpoint"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRiemannType(type)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    riemannType === type
                      ? "bg-indigo-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {type === "left" ? "ឆ្វេង" : type === "right" ? "ស្តាំ" : "កណ្តាល"}
                </button>
              ))}
            </div>
          )}

          {state.mode === "application" && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute bottom-4 right-4 p-2 bg-slate-900/90 rounded-full border border-white/10 text-white hover:bg-indigo-500/20 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Sidebar Parameters Explorer (Column of slider controls + Khmer dynamic math descriptions) */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              លក្ខខណ្ឌពិសោធន៍ (Parameters)
            </h3>

            {/* Render sliders based on state.mode */}
            {state.mode === "indeterminate" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">អនុគមន៍ស្វ័យសិក្សា៖</span>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
                    f(x) = (x² - 4) / (x - 2)
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">កំណត់តម្លៃ x ជិត ២៖</span>
                    <span className="text-cyan-400 font-mono font-bold">x = {state.xVal.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.001"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>x = 1.0 (ខាងឆ្វេង)</span>
                    <span>x → 2</span>
                    <span>x = 3.0 (ខាងស្តាំ)</span>
                  </div>
                </div>

                {/* Approaching values table */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 text-[11px] font-mono space-y-1.5">
                  <div className="grid grid-cols-3 border-b border-white/5 pb-1 text-slate-400 font-bold">
                    <span>ទិសដៅ x → a</span>
                    <span>តម្លៃ x</span>
                    <span className="text-right">តម្លៃ f(x)</span>
                  </div>
                  <div className="grid grid-cols-3 text-cyan-300">
                    <span>ឆ្វេង (x &lt; 2)</span>
                    <span>1.990</span>
                    <span className="text-right">3.990</span>
                  </div>
                  <div className="grid grid-cols-3 text-rose-400 font-bold bg-rose-500/5 px-1 rounded">
                    <span>ខ្វះកំណត់ (0/0)</span>
                    <span>2.000</span>
                    <span className="text-right">Hole</span>
                  </div>
                  <div className="grid grid-cols-3 text-sky-300">
                    <span>ស្តាំ (x &gt; 2)</span>
                    <span>2.010</span>
                    <span className="text-right">4.010</span>
                  </div>
                </div>
              </div>
            )}

            {state.mode === "asymptote" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">អនុគមន៍ស្វ័យសិក្សា៖</span>
                  <div className="text-sm font-mono font-bold text-blue-400 mt-1">
                    f(x) = 1 / x
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">តម្លៃអថេរ x៖</span>
                    <span className="text-blue-400 font-mono font-bold">x = {state.xVal.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="4.0"
                    step="0.01"
                    value={state.xVal === 0 ? 0.01 : state.xVal}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (Math.abs(val) < 0.05) val = val >= 0 ? 0.05 : -0.05;
                      onChange({ ...state, xVal: val });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>x = -4.0</span>
                    <span>x → 0</span>
                    <span>x = +4.0</span>
                  </div>
                </div>

                {/* Behavioral conclusions */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-white">ការសន្និដ្ឋានឥរិយាបថ (Asymptotic properties):</h4>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>នៅពេល <span className="font-mono text-rose-400">x → 0⁺</span>, នោះ <span className="font-mono text-cyan-400">y → +∞</span></li>
                    <li>នៅពេល <span className="font-mono text-rose-400">x → 0⁻</span>, នោះ <span className="font-mono text-cyan-400">y → -∞</span></li>
                    <li>នៅពេល <span className="font-mono text-rose-400">x → ±∞</span>, នោះ <span className="font-mono text-cyan-400">y → 0</span></li>
                  </ul>
                </div>
              </div>
            )}

            {state.mode === "derivative" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">អនុគមន៍ស្វ័យសិក្សា៖</span>
                  <div className="text-sm font-mono font-bold text-indigo-400 mt-1">
                    f(x) = 0.4 * x²
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ចម្ងាយរវាងពីរចំណុច h៖</span>
                    <span className="text-amber-400 font-mono font-bold">h = {state.deltaX.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="2.0"
                    step="0.01"
                    value={state.deltaX}
                    onChange={(e) => onChange({ ...state, deltaX: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>h → 0 ( tangent )</span>
                    <span>h = 2.0 ( secant )</span>
                  </div>
                </div>

                {/* Explanation limits transition */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2 text-[11px]">
                  <p className="text-slate-300">
                    នៅពេល <span className="text-amber-400 font-bold">h → 0</span>, ខ្សែខណ្ឌ <span className="text-amber-400">Secant</span> (amber) វិលទៅត្រួតស៊ីគ្នាជាមួយខ្សែប៉ះ <span className="text-emerald-400 font-bold">Tangent</span> (emerald)។
                  </p>
                  <p className="text-slate-400 font-mono leading-relaxed bg-black/30 p-1.5 rounded text-center">
                    f'(x) = lim<sub>h→0</sub> [f(x+h) - f(x)] / h
                  </p>
                </div>
              </div>
            )}

            {state.mode === "integral" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">អនុគមន៍ស្វ័យសិក្សា៖</span>
                  <div className="text-sm font-mono font-bold text-purple-400 mt-1">
                    f(x) = sin(x) + 1.5
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ចំនួនប្រឡោះចតុកោណ N៖</span>
                    <span className="text-cyan-400 font-mono font-bold">N = {state.intervals}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="50"
                    step="1"
                    value={state.intervals}
                    onChange={(e) => onChange({ ...state, intervals: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>N = 4 (លម្អិតទាប)</span>
                    <span>N → ∞ (លីមីតផ្ទៃ)</span>
                  </div>
                </div>

                {/* Explanation of integration via limit */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2 text-[11px]">
                  <p className="text-slate-300">
                    នៅពេលចំនួនប្រឡោះ <span className="text-cyan-400 font-bold">N → ∞</span> (ទទឹងប្រឡោះ <span className="text-cyan-400">Δx → 0</span>), ផលបូក Riemann <span className="font-bold">Sₙ</span> នឹងខិតជិតតម្លៃផ្ទៃពិតក្រោមខ្សែលោង។
                  </p>
                  <p className="text-slate-400 font-mono leading-relaxed bg-black/30 p-1.5 rounded text-center">
                    ∫ f(x)dx = lim<sub>N→∞</sub> Σ f(x<sub>i</sub>) Δx
                  </p>
                </div>
              </div>
            )}

            {state.mode === "application" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400">សមីការចម្ងាយ៖</span>
                  <div className="text-sm font-mono font-bold text-rose-400">
                    s(t) = 0.5 * t²
                  </div>
                  <div className="text-[11px] text-slate-400">
                    គណនាល្បឿនភ្លាមៗនៅខណៈ t₀ = 2.0s
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ចន្លោះពេលត្រួតពិនិត្យ Δt៖</span>
                    <span className="text-yellow-400 font-mono font-bold">Δt = {state.deltaX.toFixed(3)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="3.00"
                    step="0.01"
                    value={state.deltaX}
                    onChange={(e) => onChange({ ...state, deltaX: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Δt → 0 (ល្បឿនខណៈ)</span>
                    <span>Δt = 3.0s (ល្បឿនមធ្យម)</span>
                  </div>
                </div>

                {/* Practical result display */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-[11px] leading-relaxed space-y-1">
                  <div className="font-bold text-yellow-400 flex items-center gap-1">
                    <Rocket className="w-3.5 h-3.5" />
                    គណនាល្បឿន (Velocity over time):
                  </div>
                  <p className="text-slate-300">
                    ល្បឿនមធ្យម ៖ <strong>{((2 * 2 * 0.5 + state.deltaX) / 1).toFixed(2)} m/s</strong>
                  </p>
                  <p className="text-slate-300">
                    នៅពេល <span className="text-yellow-400">Δt → 0</span>, ល្បឿនមធ្យមខិតទៅរកល្បឿនខណៈពិតប្រាកដគឺ <strong>2.0 m/s</strong> (ដេរីវេនៃចម្ងាយ s'(2))។
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick learning tip footer matching poster topics */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/15 rounded-2xl flex gap-3 items-start mt-4">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-300">តើអ្នកដឹងទេ? (Khmer Math Fact)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {state.mode === "indeterminate" && "ទម្រង់មិនកំណត់ 0/0 មិនមែនគ្មានចម្លើយនោះទេ ប៉ុន្តែវាអាចកំណត់តម្លៃលីមីតបានដោយការសម្រួលកន្សោមសម្រាយ (x - a) ចេញពីភាគយកនិងភាគបែង។"}
                {state.mode === "asymptote" && "អសីមតូតបញ្ឈរនិងដេកជួយឱ្យយើងមើលឃើញពីចរិតលក្ខណៈរបស់អនុគមន៍នៅពេលវាខិតទៅរកចំណុចដែលអនុគមន៍លែងមានន័យ ឬខិតទៅរកទីអនន្ត។"}
                {state.mode === "derivative" && "គំនិតដេរីវេដែលបង្កើតឡើងដោយ Newton និង Leibniz គឺកើតចេញពីការគណនាលីមីតនៃមេគុណប្រាប់ទិសខ្សែប៉ះនេះឯង។"}
                {state.mode === "integral" && "ការគណនាផ្ទៃក្រឡាដោយប្រើលីមីតផលបូករីម៉ាន (Riemann Sum) គឺជាគ្រឹះបង្កបង្កើតឡើងជាវិទ្យាសាស្ត្រអាំងតេក្រាលដ៏មហិមា។"}
                {state.mode === "application" && "ល្បឿនខណៈ (Instantaneous velocity) នៃរថយន្ត ឬរ៉ុក្កែត ត្រូវបានគណនាដោយកាត់បន្ថយចន្លោះពេលពិនិត្យ Δt ឱ្យខិតទៅរក ០ តាមរយៈទ្រឹស្តីលីមីត។"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
