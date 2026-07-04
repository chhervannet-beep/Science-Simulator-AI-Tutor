import React, { useEffect, useRef, useState } from "react";
import { ContinuitySimState } from "../types";
import { 
  Activity, 
  Zap, 
  Grid, 
  Sliders, 
  Info,
  TrendingUp,
  Maximize2,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Cpu,
  Thermometer,
  Anchor,
  HelpCircle
} from "lucide-react";

interface ContinuitySimProps {
  state: ContinuitySimState;
  onChange: (state: ContinuitySimState) => void;
  onExplainRequest: () => void;
}

export default function ContinuitySim({ state, onChange, onExplainRequest }: ContinuitySimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Local choices for interactive sub-views
  const [theoremType, setTheoremType] = useState<"ivt" | "evt">("ivt");
  const [isContinuousSystem, setIsContinuousSystem] = useState<boolean>(true);

  // Animation ticks
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

  // Main Canvas Render
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

    // Clear and background
    ctx.fillStyle = "#020617"; // Slate 950
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.04)";
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

    const originX = width / 2;
    const originY = height / 2 + 30;
    const scaleX = 70;
    const scaleY = 60;

    const toCanvasX = (mx: number) => originX + mx * scaleX;
    const toCanvasY = (my: number) => originY - my * scaleY;
    const toMathX = (cx: number) => (cx - originX) / scaleX;
    const toMathY = (cy: number) => (originY - cy) / scaleY;

    // Standard Cartesian axes helper
    const drawAxes = (labelX = "X", labelY = "Y") => {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, originY);
      ctx.lineTo(width - 10, originY);
      ctx.moveTo(originX, 10);
      ctx.lineTo(originX, height - 10);
      ctx.stroke();

      // Arrows
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
      ctx.beginPath();
      ctx.moveTo(width - 12, originY - 4);
      ctx.lineTo(width - 4, originY);
      ctx.lineTo(width - 12, originY + 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(originX - 4, 12);
      ctx.lineTo(originX, 4);
      ctx.lineTo(originX + 4, 12);
      ctx.fill();

      // Axis labels
      ctx.font = "11px monospace";
      ctx.fillText(labelX, width - 20, originY + 16);
      ctx.fillText(labelY, originX - 18, 16);
    };

    // 1. FOUNDATION OF CALCULUS (ភាពជាប់ជាលក្ខខណ្ឌចាំបាច់)
    if (state.mode === "foundation") {
      drawAxes();

      // Show continuous differentiable function (Parabola f(x) = -0.2*x^2 + 2) vs Sharp corner/discontinuous
      const isDifferentiableMode = state.epsilon > 0.5; // Toggle using parameter slider
      
      if (isDifferentiableMode) {
        // Smooth and differentiable
        const f = (x: number) => -0.2 * x * x + 2.2;
        const df = (x: number) => -0.4 * x; // analytical derivative

        // Draw curve
        ctx.strokeStyle = "#10b981"; // Emerald (Continuous & Differentiable)
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
        ctx.beginPath();
        let first = true;
        for (let cx = 10; cx < width - 10; cx++) {
          const mx = toMathX(cx);
          const my = f(mx);
          const cy = toCanvasY(my);
          if (cy >= 0 && cy <= height) {
            if (first) { ctx.moveTo(cx, cy); first = false; }
            else { ctx.lineTo(cx, cy); }
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw tangent line at interactive state.xVal
        const px = state.xVal;
        const py = f(px);
        const slope = df(px);
        const tangentLine = (x: number) => py + slope * (x - px);

        ctx.strokeStyle = "#f59e0b"; // Amber (Tangent line)
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(px - 1.5), toCanvasY(tangentLine(px - 1.5)));
        ctx.lineTo(toCanvasX(px + 1.5), toCanvasY(tangentLine(px + 1.5)));
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive point
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(toCanvasX(px), toCanvasY(py), 6, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("ជាប់ និងមានដេរីវេ (Continuous & Differentiable)", 30, 40);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "12px monospace";
        ctx.fillText(`Slope m = f'(x) = ${slope.toFixed(2)}`, toCanvasX(px) + 12, toCanvasY(py) - 10);
      } else {
        // Sharp cusp / Absolute value f(x) = 2.5 - |x| (Continuous but NOT differentiable at x = 0)
        const f = (x: number) => 2.5 - Math.abs(x);

        ctx.strokeStyle = "#3b82f6"; // Blue (Continuous but not differentiable)
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        let first = true;
        for (let cx = 10; cx < width - 10; cx++) {
          const mx = toMathX(cx);
          const my = f(mx);
          const cy = toCanvasY(my);
          if (cy >= 0 && cy <= height) {
            if (first) { ctx.moveTo(cx, cy); first = false; }
            else { ctx.lineTo(cx, cy); }
          }
        }
        ctx.stroke();

        // Highlight the sharp corner at x = 0
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(2.5), 10, 0, Math.PI * 2);
        ctx.stroke();

        // Text
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("ជាប់ តែគ្មានដេរីវេត្រង់ x = 0 (Continuous but Not Differentiable)", 30, 40);
        ctx.fillStyle = "#ef4444";
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("ត្រង់ចំណុចស្រួចនេះ គ្មានខ្សែប៉ះតែមួយកំណត់ច្បាស់លាស់ទេ (Cusp/Corner)", toCanvasX(0) + 15, toCanvasY(2.5) - 5);
      }

      // Riemann Area preview at bottom to show integration capability
      ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
      ctx.fillRect(toCanvasX(-2), toCanvasY(0), toCanvasX(2) - toCanvasX(-2), toCanvasY(2) - toCanvasY(0));
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.strokeRect(toCanvasX(-2), toCanvasY(0), toCanvasX(2) - toCanvasX(-2), toCanvasY(2) - toCanvasY(0));
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("ផ្ទៃក្រឡារួមបញ្ចូលគ្នាក្រោមខ្សែកោង (Integrability guaranteed)", toCanvasX(-1.8), toCanvasY(-0.3));
    }

    // 2. REAL-WORLD MODELS & PHYSICS (ម៉ូដែលពិភពពិត និងរូបវិទ្យា)
    else if (state.mode === "realworld") {
      // Split screen into two parts
      const halfWidth = width / 2;

      // Draw separator line
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfWidth, 0);
      ctx.lineTo(halfWidth, height);
      ctx.stroke();

      // Panel 1: Temperature / Altitude (Smooth and Continuous)
      ctx.fillStyle = "rgba(56, 189, 248, 0.1)"; // Light blue bg
      ctx.fillRect(10, 10, halfWidth - 20, 35);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText("១. ធម្មជាតិ/សីតុណ្ហភាព (Smooth, Continuous)", 20, 32);

      // Draw smooth wave
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;
      for (let cx = 15; cx < halfWidth - 15; cx++) {
        // map cx to x-range [0, 4]
        const tVal = (cx - 15) / (halfWidth - 30) * 4;
        const temp = Math.sin(tVal - time * 0.8) * 0.8 + 1.5; // animated temperature
        const cy = height - 120 - temp * 50;
        if (first) { ctx.moveTo(cx, cy); first = false; }
        else { ctx.lineTo(cx, cy); }
      }
      ctx.stroke();

      // Moving explorer or pointer on smooth wave
      const expCX = 15 + (halfWidth - 30) * ((time * 0.15) % 1);
      const expTVal = (expCX - 15) / (halfWidth - 30) * 4;
      const expTemp = Math.sin(expTVal - time * 0.8) * 0.8 + 1.5;
      const expCY = height - 120 - expTemp * 50;

      // Sun/heat effect
      ctx.fillStyle = "rgba(249, 115, 22, 0.2)";
      ctx.beginPath();
      ctx.arc(expCX, expCY, 18 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f59e0b"; // orange dot
      ctx.beginPath();
      ctx.arc(expCX, expCY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillText(`សីតុណ្ហភាពៈ ${(15 + expTemp * 8).toFixed(1)}°C`, expCX - 40, expCY - 22);

      // Panel 2: Digital Steps / Quantized Events (Discontinuous Steps)
      ctx.fillStyle = "rgba(244, 63, 94, 0.1)"; // Light rose bg
      ctx.fillRect(halfWidth + 10, 10, halfWidth - 20, 35);
      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText("២. សញ្ញាឌីជីថល / កុងតាក់ (Discrete Steps)", halfWidth + 20, 32);

      // Draw digital step wave
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      first = true;
      for (let cx = halfWidth + 15; cx < width - 15; cx++) {
        const tVal = (cx - (halfWidth + 15)) / (halfWidth - 30) * 4;
        // Step function: floor(tVal)
        const step = Math.floor(tVal - time * 0.5) % 3;
        const cy = height - 120 - step * 50;
        
        // Horizontal line, then vertical jump
        if (first) {
          ctx.moveTo(cx, cy);
          first = false;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Draw jump connectors as thin dotted lines
      ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      for (let s = 1; s < 4; s++) {
        const jumpCX = halfWidth + 15 + (halfWidth - 30) * (s / 4);
        ctx.beginPath();
        ctx.moveTo(jumpCX, height - 250);
        ctx.lineTo(jumpCX, height - 70);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Informative labels underneath
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("ធាតុពិតក្នុងធម្មជាតិផ្លាស់ប្តូរជាប់លំដាប់ (Continuous)", 20, height - 40);
      ctx.fillText("ឧបករណ៍បច្ចេកវិទ្យាខ្លះផ្លាស់ប្តូរភ្លាមៗ (Jump Discontinuity)", halfWidth + 15, height - 40);
    }

    // 3. THEOREMS: IVT & EVT (ទ្រឹស្តីបទសំខាន់ៗ)
    else if (state.mode === "theorems") {
      drawAxes("X", "Y");

      const [a, b] = [-1.8, 1.8]; // interval bounds
      const f = (x: number) => 0.1 * x * x * x - 0.6 * x + 1.2; // Cubic continuous function

      // Draw intervals a and b projections
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Line at x = a
      ctx.moveTo(toCanvasX(a), toCanvasY(0));
      ctx.lineTo(toCanvasX(a), toCanvasY(f(a)));
      // Line at x = b
      ctx.moveTo(toCanvasX(b), toCanvasY(0));
      ctx.lineTo(toCanvasX(b), toCanvasY(f(b)));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw intervals ticks on X axis
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("a", toCanvasX(a) - 4, originY + 16);
      ctx.fillText("b", toCanvasX(b) - 4, originY + 16);

      if (theoremType === "ivt") {
        // IVT: Intermediate Value Theorem
        // Draw continuous cubic function
        ctx.strokeStyle = "#818cf8"; // Indigo
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(129, 140, 248, 0.3)";
        ctx.beginPath();
        let first = true;
        for (let cx = toCanvasX(a); cx <= toCanvasX(b); cx++) {
          const mx = toMathX(cx);
          const my = f(mx);
          const cy = toCanvasY(my);
          if (first) { ctx.moveTo(cx, cy); first = false; }
          else { ctx.lineTo(cx, cy); }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Interactive threshold line y = u (controlled by xVal slider as horizontal target)
        // map state.xVal range [1.0, 3.0] to Y values between f(a) and f(b) (which are around 0.5 to 2.2)
        const uYVal = 0.4 + (state.xVal - 1.0) * 0.9; // Target intermediate value y = u

        ctx.strokeStyle = "#fbbf24"; // Amber threshold line
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(a), toCanvasY(uYVal));
        ctx.lineTo(toCanvasX(b), toCanvasY(uYVal));
        ctx.stroke();
        ctx.setLineDash([]);

        // Find intersection point c mathematically: solving f(c) = uYVal using Newton Raphson
        let c = 0.0;
        for (let iter = 0; iter < 10; iter++) {
          const fc = f(c) - uYVal;
          const dfc = 0.3 * c * c - 0.6;
          if (Math.abs(dfc) < 0.01) break;
          c = c - fc / dfc;
        }

        // Highlight intersection point on curve
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(toCanvasX(c), toCanvasY(f(c)), 7, 0, Math.PI * 2);
        ctx.fill();

        // Project intersection c to X axis
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(c), toCanvasY(f(c)));
        ctx.lineTo(toCanvasX(c), originY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillText("c", toCanvasX(c) - 4, originY - 6);
        ctx.fillText("តម្លៃមធ្យម (u)", toCanvasX(b) + 8, toCanvasY(uYVal) + 4);

        // Titles
        ctx.fillStyle = "#818cf8";
        ctx.fillText("ទ្រឹស្តីបទតម្លៃមធ្យម (IVT - Intermediate Value Theorem)", 25, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("បើអនុគមន៍ជាប់គ្នា នោះមានចំណុច c ក្នុងចន្លោះ [a, b] ជានិច្ចដែល f(c) = u", 25, 60);
      } else {
        // EVT: Extreme Value Theorem
        // Draw curve from a to b
        ctx.strokeStyle = "#ec4899"; // Pink
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        let first = true;
        for (let cx = toCanvasX(a); cx <= toCanvasX(b); cx++) {
          const mx = toMathX(cx);
          const my = f(mx);
          const cy = toCanvasY(my);
          if (first) { ctx.moveTo(cx, cy); first = false; }
          else { ctx.lineTo(cx, cy); }
        }
        ctx.stroke();

        // Analytical extremums for f(x) = 0.1 x^3 - 0.6 x + 1.2
        // derivative: 0.3 x^2 - 0.6 = 0 => x^2 = 2 => x = ±sqrt(2) = ±1.414
        const localMaxX = -Math.sqrt(2);
        const localMaxY = f(localMaxX); // Peak maximum value
        const localMinX = Math.sqrt(2);
        const localMinY = f(localMinX); // Valley minimum value

        // Highlighting extrema
        ctx.fillStyle = "#10b981"; // Emerald for max
        ctx.beginPath();
        ctx.arc(toCanvasX(localMaxX), toCanvasY(localMaxY), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("តម្លៃអតិបរមា (MAX)", toCanvasX(localMaxX) - 50, toCanvasY(localMaxY) - 15);

        ctx.fillStyle = "#ef4444"; // Red for min
        ctx.beginPath();
        ctx.arc(toCanvasX(localMinX), toCanvasY(localMinY), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("តម្លៃអប្បបរមា (MIN)", toCanvasX(localMinX) - 50, toCanvasY(localMinY) + 20);

        // Titles
        ctx.fillStyle = "#ec4899";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("ទ្រឹស្តីបទតម្លៃខ្ពស់បំផុត-ទាបបំផុត (EVT - Extreme Value Theorem)", 25, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("នៅលើចន្លោះបិទ [a, b] អនុគមន៍ជាប់តែងតែមានតម្លៃធំបំផុត និងតូចបំផុតពិតប្រាកដ", 25, 60);
      }
    }

    // 4. SYSTEM STABILITY & CONTROL (ស្ថិរភាព និងការគ្រប់គ្រង)
    else if (state.mode === "stability") {
      // Draw simulated system dashboard (Robotic Arm feedback loop)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(15, 15, width - 30, height - 30);
      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.strokeRect(15, 15, width - 30, height - 30);

      // Draw stylized Robotic Arm or control knobs
      const armBaseX = width / 2 - 100;
      const armBaseY = height - 80;

      // Draw metallic support base
      ctx.fillStyle = "#475569"; // slate-600
      ctx.fillRect(armBaseX - 30, armBaseY, 60, 20);

      // Draw joint 1
      const joint1X = armBaseX;
      const joint1Y = armBaseY - 50;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(armBaseX, armBaseY);
      ctx.lineTo(joint1X, joint1Y);
      ctx.stroke();

      // Animated movement based on interactive parameter inputs (Epsilon-Delta stability concept)
      // If continuous, movement is smooth, small changes in slider = small changes in arm position.
      // If discontinuous, arm jitters or jumps suddenly!
      const inputVal = state.xVal; // Slider value [1.0, 3.0]
      const angle = isContinuousSystem 
        ? (inputVal - 2.0) * 0.5 
        : (Math.round(inputVal * 2) / 2 - 2.0) * 0.8; // Quantized step/jump movement

      const joint2X = joint1X + Math.sin(angle) * 70;
      const joint2Y = joint1Y - Math.cos(angle) * 70;

      // Draw link 2
      ctx.strokeStyle = "#38bdf8"; // cyan-400
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(joint1X, joint1Y);
      ctx.lineTo(joint2X, joint2Y);
      ctx.stroke();

      // Draw rotary gears at joint 1 & 2
      ctx.fillStyle = "#fbbf24"; // yellow joints
      ctx.beginPath();
      ctx.arc(joint1X, joint1Y, 10, 0, Math.PI * 2);
      ctx.arc(joint2X, joint2Y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Robot Claw/Tooltip
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(joint2X, joint2Y);
      ctx.lineTo(joint2X + Math.sin(angle + 0.5) * 20, joint2Y - Math.cos(angle + 0.5) * 20);
      ctx.moveTo(joint2X, joint2Y);
      ctx.lineTo(joint2X + Math.sin(angle - 0.5) * 20, joint2Y - Math.cos(angle - 0.5) * 20);
      ctx.stroke();

      // Epsilon-Delta visual representation graph on the right side
      const graphLeft = width / 2 + 50;
      const graphTop = 80;
      const graphW = width / 2 - 80;
      const graphH = height - 160;

      // Mini graph axis
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphLeft, graphTop + graphH);
      ctx.lineTo(graphLeft + graphW, graphTop + graphH); // X
      ctx.moveTo(graphLeft, graphTop);
      ctx.lineTo(graphLeft, graphTop + graphH); // Y
      ctx.stroke();

      // Draw mini function curve
      ctx.strokeStyle = isContinuousSystem ? "#10b981" : "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let lx = 0; lx < graphW; lx++) {
        const mx = lx / graphW; // range 0 to 1
        let my = mx; // direct smooth line
        if (!isContinuousSystem) {
          my = mx < 0.5 ? 0.35 : 0.75; // Jump discontinuity at x = 0.5
        }
        const cy = graphTop + graphH - my * graphH;
        if (first) { ctx.moveTo(graphLeft + lx, cy); first = false; }
        else { ctx.lineTo(graphLeft + lx, cy); }
      }
      ctx.stroke();

      // Draw Delta-Epsilon band
      if (isContinuousSystem) {
        const targetX = 0.5; // mid point
        const delta = state.delta * 0.15; // Delta range
        const epsilon = state.epsilon * 0.15; // Epsilon range

        // Highlight Delta band on X axis
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.fillRect(graphLeft + (targetX - delta) * graphW, graphTop, delta * 2 * graphW, graphH);

        // Highlight Epsilon band on Y axis
        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.fillRect(graphLeft, graphTop + graphH - (targetX + epsilon) * graphH, graphW, epsilon * 2 * graphH);

        // Dotted lines representing Delta limit
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(graphLeft + (targetX - delta) * graphW, graphTop);
        ctx.lineTo(graphLeft + (targetX - delta) * graphW, graphTop + graphH);
        ctx.moveTo(graphLeft + (targetX + delta) * graphW, graphTop);
        ctx.lineTo(graphLeft + (targetX + delta) * graphW, graphTop + graphH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Panel Descriptions
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(`ស្ថិរភាពប្រព័ន្ធគ្រប់គ្រង (Feedback Stability): ${isContinuousSystem ? "ស្ងប់ស្ងៀម" : "រំញ័រ/គ្រោះថ្នាក់"}`, 30, 45);
      
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.fillText(
        isContinuousSystem 
          ? "✓ ភាពជាប់គ្នាធានាថាការប្រែប្រួលតូចនៃធាតុចូល (Δx) នាំមកនូវការប្រែប្រួលតូចនៃធាតុចេញ (Δy)។"
          : "✗ ភាពមិនជាប់បង្កឱ្យមានលោតថាមពលភ្លាមៗ ដែលអាចធ្វើឱ្យឧបករណ៍រ៉ូបូតបាក់បែក ឬប្រព័ន្ធដំណើរការមិនមានលំនឹង។",
        30, 
        height - 35
      );
    }

    // 5. DISCONTINUITY EXPLORER (ប្រភេទភាពមិនជាប់)
    else if (state.mode === "discontinuity") {
      drawAxes();

      // Render based on selected discontinuity type
      const activeType = state.discontinuityType;

      if (activeType === "jump") {
        // JUMP DISCONTINUITY (ភាពមិនជាប់បែបលោត)
        // f(x) = x + 1 for x <= 0, and f(x) = x - 1 for x > 0.
        ctx.strokeStyle = "#38bdf8"; // Left part
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let cx = 10; cx < originX; cx++) {
          const mx = toMathX(cx);
          const my = mx + 1;
          const cy = toCanvasY(my);
          if (cx === 10) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        ctx.strokeStyle = "#ec4899"; // Right part
        ctx.beginPath();
        let firstRight = true;
        for (let cx = originX + 2; cx < width - 10; cx++) {
          const mx = toMathX(cx);
          const my = mx - 1;
          const cy = toCanvasY(my);
          if (firstRight) { ctx.moveTo(cx, cy); firstRight = false; }
          else { ctx.lineTo(cx, cy); }
        }
        ctx.stroke();

        // Left solid circle, Right empty circle at x = 0
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(1), 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ec4899";
        ctx.fillStyle = "#020617";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(-1), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Labels
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("១. ភាពមិនជាប់បែបលោត (Jump Discontinuity)", 30, 40);
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.fillText("លីមីតខាងឆ្វេង (LHL = 1) មិនស្មើ លីមីតខាងស្តាំ (RHL = -1)", 30, 60);
      } 
      else if (activeType === "hole") {
        // HOLE DISCONTINUITY (ភាពមិនជាប់បែបប្រហោង/លុបបាន)
        // f(x) = 1.5 (constant line) with a hole at x = 0. f(0) is defined at y = 2.5
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        let first = true;
        for (let cx = 10; cx < width - 10; cx++) {
          const mx = toMathX(cx);
          if (Math.abs(mx) < 0.05) continue; // skip the hole
          const my = 1.2;
          const cy = toCanvasY(my);
          if (first) { ctx.moveTo(cx, cy); first = false; }
          else { ctx.lineTo(cx, cy); }
        }
        ctx.stroke();

        // Draw the hollow circle at x = 0, y = 1.2
        ctx.strokeStyle = "#10b981";
        ctx.fillStyle = "#020617";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(1.2), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw isolated defined point at x = 0, y = 2.2
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(toCanvasX(0), toCanvasY(2.2), 5, 0, Math.PI * 2);
        ctx.fill();

        // Connection line
        ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(1.2));
        ctx.lineTo(toCanvasX(0), toCanvasY(2.2));
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("២. ភាពមិនជាប់បែបប្រហោង (Hole / Removable Discontinuity)", 30, 40);
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.fillText("លីមីត LHL = RHL = 1.2 ប៉ុន្តែតម្លៃ f(0) = 2.2 (មិនស៊ីគ្នា)", 30, 60);
      } 
      else if (activeType === "infinite") {
        // INFINITE DISCONTINUITY (ភាពមិនជាប់បែបអនន្ត / អសីមតូត)
        // f(x) = 1/x
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 3.5;
        
        // Positive part
        ctx.beginPath();
        let first = true;
        for (let cx = originX + 2; cx < width - 10; cx++) {
          const mx = toMathX(cx);
          const my = 0.5 / mx;
          const cy = toCanvasY(my);
          if (cy >= 0 && cy <= height) {
            if (first) { ctx.moveTo(cx, cy); first = false; }
            else { ctx.lineTo(cx, cy); }
          }
        }
        ctx.stroke();

        // Negative part
        ctx.beginPath();
        first = true;
        for (let cx = 10; cx < originX - 2; cx++) {
          const mx = toMathX(cx);
          const my = 0.5 / mx;
          const cy = toCanvasY(my);
          if (cy >= 0 && cy <= height) {
            if (first) { ctx.moveTo(cx, cy); first = false; }
            else { ctx.lineTo(cx, cy); }
          }
        }
        ctx.stroke();

        // Draw vertical asymptote
        ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(originX, 10);
        ctx.lineTo(originX, height - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("៣. ភាពមិនជាប់បែបអនន្ត (Infinite Discontinuity / Asymptote)", 30, 40);
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.fillText("តម្លៃអនុគមន៍ខិតជិត ±∞ នៅពេល x ខិតជិត 0 (មានអសីមតូតឈរ x = 0)", 30, 60);
      }
    }

  }, [state.mode, state.xVal, state.epsilon, state.delta, state.discontinuityType, theoremType, isContinuousSystem, time, isPlaying]);

  // Handle Mode Navigation
  const handleModeChange = (mode: ContinuitySimState["mode"]) => {
    onChange({
      ...state,
      mode,
      xVal: 1.5,
      epsilon: 1.0,
      delta: 1.0
    });
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ម៉ាស៊ីនពិសោធន៍ ភាពជាប់នៃអនុគមន៍ <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">CONTINUITY</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ស្វែងយល់សញ្ញាណភាពជាប់ ដាច់ និងទ្រឹស្តីបទគណិតវិទ្យា (IVT, EVT) ស្របតាមសន្លឹកកិច្ចការគណិតវិទ្យា
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          id="btn-explain-continuity"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* 5 Column modes representing the Khmer Poster */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          id="con-tab-foundation"
          onClick={() => handleModeChange("foundation")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "foundation"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">១. គ្រឹះ CALCULUS</span>
          <span className="text-xs font-bold leading-tight">ភាពជាប់ & ដេរីវេ</span>
        </button>

        <button
          id="con-tab-realworld"
          onClick={() => handleModeChange("realworld")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "realworld"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">២. ពិភពពិត</span>
          <span className="text-xs font-bold leading-tight">បម្រែបម្រួលរលូន</span>
        </button>

        <button
          id="con-tab-theorems"
          onClick={() => handleModeChange("theorems")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "theorems"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៣. ទ្រឹស្តីបទ</span>
          <span className="text-xs font-bold leading-tight">IVT & EVT ឫស</span>
        </button>

        <button
          id="con-tab-stability"
          onClick={() => handleModeChange("stability")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "stability"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៤. ស្ថិរភាព</span>
          <span className="text-xs font-bold leading-tight">ការគ្រប់គ្រងរ៉ូបូត</span>
        </button>

        <button
          id="con-tab-discontinuity"
          onClick={() => handleModeChange("discontinuity")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "discontinuity"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono opacity-60">៥. មិនជាប់</span>
          <span className="text-xs font-bold leading-tight">Jump, Hole, Infinite</span>
        </button>
      </div>

      {/* Primary Visualizer & Sidebar Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Visualizer container */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex flex-col relative min-h-[380px] justify-center shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Interactive overlays based on selected mode */}
          {state.mode === "theorems" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              <button
                onClick={() => setTheoremType("ivt")}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  theoremType === "ivt"
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ទ្រឹស្តីបទតម្លៃមធ្យម (IVT)
              </button>
              <button
                onClick={() => setTheoremType("evt")}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  theoremType === "evt"
                    ? "bg-pink-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                តម្លៃអតិបរមា/អប្បបរមា (EVT)
              </button>
            </div>
          )}

          {state.mode === "stability" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              <button
                onClick={() => setIsContinuousSystem(true)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  isContinuousSystem
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ប្រព័ន្ធជាប់ (Continuous arm)
              </button>
              <button
                onClick={() => setIsContinuousSystem(false)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  !isContinuousSystem
                    ? "bg-rose-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ប្រព័ន្ធដាច់ (Step chatter)
              </button>
            </div>
          )}

          {state.mode === "discontinuity" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              {(["jump", "hole", "infinite"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange({ ...state, discontinuityType: type })}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all uppercase ${
                    state.discontinuityType === type
                      ? "bg-cyan-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {type === "jump" ? "លោត (Jump)" : type === "hole" ? "ប្រហោង (Hole)" : "អសីមតូត (Infinite)"}
                </button>
              ))}
            </div>
          )}

          {state.mode === "realworld" && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute bottom-4 right-4 p-2 bg-slate-900/90 rounded-full border border-white/10 text-white hover:bg-cyan-500/20 transition-all"
            >
              {isPlaying ? "ផ្អាកដំណើរការ (Pause)" : "ចាក់ដំណើរការ (Play)"}
            </button>
          )}
        </div>

        {/* Right 1/3: Sidebar Parameter Explorers */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              លក្ខខណ្ឌពិសោធន៍ (Parameters)
            </h3>

            {/* Slider list depending on state.mode */}
            {state.mode === "foundation" && (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">ទំនាក់ទំនងភាពជាប់ & ដេរីវេ៖</span>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    អនុគមន៍ត្រូវតែ <strong>ជាប់ជានិច្ច (Continuous)</strong> ទើបអាចមានដេរីវេ (Differentiable) តែភាពជាប់មិនទាន់គ្រប់គ្រាន់ទាហានការមានដេរីវេទេ (ដូចជាចំណុចស្រួច)។
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ប្តូររបៀបក្រាហ្វិក៖</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {state.epsilon > 0.5 ? "រលូន (Differentiable)" : "ស្រួច (Sharp Cusp)"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="1"
                    value={state.epsilon}
                    onChange={(e) => onChange({ ...state, epsilon: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>ចំណុចស្រួច</span>
                    <span>រលូនធម្មតា</span>
                  </div>
                </div>

                {state.epsilon > 0.5 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">ទីតាំងចំណុច x៖</span>
                      <span className="text-cyan-400 font-mono font-bold">x = {state.xVal.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.05"
                      value={state.xVal}
                      onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}
              </div>
            )}

            {state.mode === "realworld" && (
              <div className="space-y-4">
                <div className="p-3 bg-cyan-505/10 border border-cyan-500/10 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" />
                    បាតុភូតរូបវិទ្យា (Natural physics):
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    សីតុណ្ហភាព កម្ពស់ និងពេលវេលា តែងតែមានបម្រែបម្រួលរលូននិងជាប់គ្នាជានិច្ច (Continuous change)។
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ផ្ទុយទៅវិញ សញ្ញាឌីជីថល អគ្គិសនី ឬការទូទាត់លុយ តែងតែប្រែប្រួលជាជំហានៗដាច់ដោយឡែកពីគ្នា (Discontinuous)។
                  </p>
                </div>
              </div>
            )}

            {state.mode === "theorems" && (
              <div className="space-y-4">
                {theoremType === "ivt" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">កំណត់តម្លៃកម្រិត u (Y-target)៖</span>
                        <span className="text-amber-400 font-mono font-bold">u = {(0.4 + (state.xVal - 1.0) * 0.9).toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="3.0"
                        step="0.01"
                        value={state.xVal}
                        onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] space-y-1.5 text-slate-300">
                      <p className="text-amber-400 font-bold">IVT Application:</p>
                      <p>ដោយសារ f(a) ≈ 0.5 និ f(b) ≈ 2.2 គឺជាប់គ្នាជានិច្ច នោះរាល់គ្រប់តម្លៃ u ចន្លោះនោះ តែងតែមាន c ដែល f(c) = u។</p>
                      <p className="text-indigo-400">✓ ធានាអត្ថិភាពឫសសមីការ!</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] space-y-2 text-slate-300">
                    <p className="text-pink-400 font-bold">EVT Application:</p>
                    <p>នៅលើចន្លោះបិទ [a, b] អនុគមន៍ជាប់តែងតែមានតម្លៃខ្ពស់បំផុត (Absolute Maximum) និងតម្លៃទាបបំផុត (Absolute Minimum) យ៉ាងតិចមួយជានិច្ច។</p>
                    <p className="text-emerald-400">✓ ប្រើសម្រាប់ដោះស្រាយបញ្ហាបរិមាណអតិបរមា / អប្បបរមា ក្នុងវិស្វកម្ម និងសេដ្ឋកិច្ច!</p>
                  </div>
                )}
              </div>
            )}

            {state.mode === "stability" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">កំណត់កម្រិតរសើប (Sensitivity delta δ)៖</span>
                    <span className="text-cyan-400 font-mono font-bold">δ = {state.delta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={state.delta}
                    onChange={(e) => onChange({ ...state, delta: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">កំណត់កម្រិតលំយោល (Output error epsilon ε)៖</span>
                    <span className="text-amber-500 font-mono font-bold">ε = {state.epsilon.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={state.epsilon}
                    onChange={(e) => onChange({ ...state, epsilon: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">បញ្ចូលសញ្ញាបញ្ជា (Input slider x)៖</span>
                    <span className="text-white font-mono font-bold">x = {state.xVal.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.01"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[10px] text-slate-500">សាកល្បងអូសចុះឡើងដើម្បីមើលចលនារ៉ូបូត</span>
                </div>
              </div>
            )}

            {state.mode === "discontinuity" && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] space-y-2 text-slate-300">
                  <h4 className="text-xs font-bold text-rose-400">លក្ខខណ្ឌនៃភាពជាប់ត្រង់ x = c ៖</h4>
                  <p>ដើម្បីឱ្យអនុគមន៍មួយជាប់ត្រង់ c លុះត្រាតែ៖</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>មានតម្លៃ f(c) កំណត់ច្បាស់លាស់</li>
                    <li>មានលីមីត lim<sub>x→c</sub> f(x) កំណត់ច្បាស់លាស់</li>
                    <li>lim<sub>x→c</sub> f(x) = f(c)</li>
                  </ol>
                  <p className="text-rose-400 text-xs font-semibold mt-1">✗ ប្រសិនបើខ្វះខាតលក្ខខណ្ឌណាមួយ នោះអនុគមន៍ហៅថា "មិនជាប់" (Discontinuous)។</p>
                </div>
              </div>
            )}
          </div>

          {/* Fact Tip Block */}
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/15 rounded-2xl flex gap-3 items-start mt-4">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-cyan-300">តើអ្នកដឹងទេ? (Khmer Continuity Fact)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {state.mode === "foundation" && "ភាពជាប់ជាលក្ខខណ្ឌចាំបាច់ដើម្បីឱ្យអនុគមន៍អាចមានដេរីវេ ប៉ុន្តែវាមិនទាន់គ្រប់គ្រាន់ទេ។ អនុគមន៍ Weierstrass ជាប់គ្រប់ចំណុច តែគ្មានដេរីវេត្រង់ចំណុចណាមួយឡើយ! "}
                {state.mode === "realworld" && "នៅក្នុងប្រព័ន្ធត្រួតពិនិត្យ និងយន្តការហោះហើរ វិស្វករតែងតែជៀសវាងការប្រើប្រាស់អនុគមន៍មិនជាប់ ព្រោះការលោតភ្លាមៗបង្កឱ្យមានរំញ័រខ្លាំង ដែលធ្វើឱ្យម៉ាស៊ីនខូចខាតលឿន។"}
                {state.mode === "theorems" && theoremType === "ivt" && "ទ្រឹស្តីបទតម្លៃមធ្យម (IVT) ត្រូវបានប្រើប្រាស់ជាទូទៅដើម្បីធានាថា តុដែលជើងមិនស្មើគ្នា អាចរកចំណុចលំនឹងជាប់ដីជានិច្ចដោយគ្រាន់តែបង្វិលវាបន្តិច។"}
                {state.mode === "theorems" && theoremType === "evt" && "ទ្រឹស្តីបទ EVT ធានាឱ្យវិស្វករដឹងថានៅក្នុងចន្លោះប្រតិបត្តិការមានសុវត្ថិភាព ឧបករណ៍នឹងមានចំណុចក្តៅបំផុត ឬត្រជាក់បំផុតដែលត្រូវបានកំណត់ច្បាស់។"}
                {state.mode === "stability" && "ការសិក្សាពីលំនឹងប្រព័ន្ធ ឬស្ថិរភាព (Stability) ជួយឱ្យយើងធានាបានថាម៉ូទ័រ ឬដៃរ៉ូបូតកូពីតាមបញ្ជាដោយរលូន មិនបង្កឱ្យមានលោតជំហានគ្រោះថ្នាក់។"}
                {state.mode === "discontinuity" && "ការយល់ដឹងពីចំណុចមិនជាប់ជួយឱ្យយើងអាចវាយតម្លៃចំណុចគ្រោះថ្នាក់ក្នុងរូបវិទ្យា ដូចជាការប្រេះស្រាំកញ្ចក់ ឬការលោតរលកសញ្ញាអគ្គិសនី។"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
