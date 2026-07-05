import React, { useEffect, useRef, useState } from "react";
import { FunctionVariationSimState } from "../types";
import { 
  Activity, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  Compass, 
  Flame, 
  Layers, 
  Maximize2, 
  HelpCircle, 
  Globe, 
  TrendingDown, 
  Info, 
  Cpu, 
  Coins, 
  Rocket, 
  Binary,
  Maximize,
  Zap,
  BookOpen
} from "lucide-react";

interface FunctionVariationSimProps {
  state: FunctionVariationSimState;
  onChange: (state: FunctionVariationSimState) => void;
  onExplainRequest: () => void;
}

export default function FunctionVariationSim({ state, onChange, onExplainRequest }: FunctionVariationSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Rotation angles for 3D View
  const [rotX, setRotX] = useState<number>(-0.4);
  const [rotY, setRotY] = useState<number>(0.6);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Interactive Analysis & Application states
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [activeApp, setActiveApp] = useState<"none" | "circuit" | "economics" | "light">("none");
  const [activeTab, setActiveTab] = useState<"analysis" | "applications">("analysis");

  // Animation loop
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

  // Handle mode switches
  const handleModeChange = (mode: "logarithmic" | "exponential" | "rational") => {
    setSelectedStep(0);
    setActiveApp("none");
    setActiveTab("analysis");
    if (mode === "logarithmic") {
      onChange({
        mode,
        paramA: 1.5, // vertical scale
        paramB: 0.0, // horizontal shift (vertical asymptote)
        paramC: 1.0, // base scaling
        is3d: state.is3d
      });
    } else if (mode === "exponential") {
      onChange({
        mode,
        paramA: 1.0, // initial scale Pe^rt
        paramB: 0.8, // growth rate r (positive for growth, negative for decay)
        paramC: 0.0, // vertical shift
        is3d: state.is3d
      });
    } else {
      onChange({
        mode,
        paramA: 2.0, // scale factor a of rational a / (x - b) + c
        paramB: 1.0, // vertical asymptote position
        paramC: 1.5, // horizontal asymptote position
        is3d: state.is3d
      });
    }
  };

  // Dragging to rotate 3D view
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.is3d) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !state.is3d) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.01)));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Main canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = rect?.height || 480;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Background
    ctx.strokeStyle = "rgba(148, 163, 184, 0.02)";
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

    // Graph viewport coordinates in 2D
    const originX = width / 2;
    const originY = height / 2 + 20;
    const scaleX = 45; // pixels per unit
    const scaleY = 45; // pixels per unit

    const toCanvasX = (xVal: number) => originX + xVal * scaleX;
    const toCanvasY = (yVal: number) => originY - yVal * scaleY;
    const toMathX = (cx: number) => (cx - originX) / scaleX;

    // Helper: Perspective 3D projection
    const project3D = (mx: number, my: number, mz: number) => {
      // Rotation around Y
      let x = mx * Math.cos(rotY) - mz * Math.sin(rotY);
      let z = mx * Math.sin(rotY) + mz * Math.cos(rotY);

      // Rotation around X
      let y = my * Math.cos(rotX) - z * Math.sin(rotX);
      z = my * Math.sin(rotX) + z * Math.cos(rotX);

      const d = 250; // Camera distance
      const zoom = 180;
      const fov = zoom / (z + d);

      return {
        x: width / 2 + x * fov,
        y: height / 2 + 20 - y * fov,
        depth: z,
        visible: z + d > 10
      };
    };

    if (state.is3d) {
      // ==================== DRAW 3D MODEL ====================
      const spinAngle = state.is3d && !isDragging ? time * 0.15 : 0;
      const activeRotY = rotY + spinAngle;

      // Draw beautiful reference grid on the bottom plane (y = -3)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      const planeY = -2.5;
      for (let i = -5; i <= 5; i++) {
        // Parallel to Z axis
        let p1 = project3D(i, planeY, -5);
        let p2 = project3D(i, planeY, 5);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Parallel to X axis
        p1 = project3D(-5, planeY, i);
        p2 = project3D(5, planeY, i);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw 3D Coordinates axes
      ctx.lineWidth = 1.5;
      // X-Axis (Red)
      let o = project3D(0, 0, 0);
      let xAxis = project3D(4, 0, 0);
      if (o.visible && xAxis.visible) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xAxis.x, xAxis.y); ctx.stroke();
      }
      // Y-Axis (Green)
      let yAxis = project3D(0, 4, 0);
      if (o.visible && yAxis.visible) {
        ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(yAxis.x, yAxis.y); ctx.stroke();
      }
      // Z-Axis (Blue)
      let zAxis = project3D(0, 0, 4);
      if (o.visible && zAxis.visible) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zAxis.x, zAxis.y); ctx.stroke();
      }

      if (state.mode === "logarithmic") {
        // Draw 3D Funnel surface z = paramA * ln(x^2 + y^2 + 0.1)
        // Draw logarithmic concentric waves / rings
        ctx.lineWidth = 1.5;
        const rings = 12;
        const points = 40;
        const a = state.paramA;
        const shiftX = state.paramB;

        for (let rIdx = 1; rIdx <= rings; rIdx++) {
          const r = rIdx * 0.35;
          ctx.beginPath();
          // Calculate hue: gradient based on height or radius
          const gValue = Math.log(r * r + 0.1) * a;
          ctx.strokeStyle = `hsla(185, 90%, ${Math.min(75, Math.max(35, 50 + gValue * 10))}%, 0.45)`;

          for (let pIdx = 0; pIdx <= points; pIdx++) {
            const angle = (pIdx / points) * Math.PI * 2;
            const mx = r * Math.cos(angle) + shiftX;
            const mz = r * Math.sin(angle);
            const my = Math.log(mx * mx + mz * mz + 0.1) * a * 0.5;

            const proj = project3D(mx, my, mz);
            if (proj.visible) {
              if (pIdx === 0) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }

        // Draw radial spokes to create a spectacular mesh
        ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
        ctx.lineWidth = 1;
        const spokes = 12;
        for (let sIdx = 0; sIdx < spokes; sIdx++) {
          const angle = (sIdx / spokes) * Math.PI * 2;
          ctx.beginPath();
          for (let rIdx = 1; rIdx <= rings; rIdx++) {
            const r = rIdx * 0.35;
            const mx = r * Math.cos(angle) + shiftX;
            const mz = r * Math.sin(angle);
            const my = Math.log(mx * mx + mz * mz + 0.1) * a * 0.5;
            const proj = project3D(mx, my, mz);
            if (proj.visible) {
              if (rIdx === 1) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }

        // Label details overlay in 3D space
        const centerTop = project3D(shiftX, Math.log(0.1) * a * 0.5, 0);
        if (centerTop.visible) {
          ctx.fillStyle = "rgba(244, 63, 94, 0.8)";
          ctx.beginPath();
          ctx.arc(centerTop.x, centerTop.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f43f5e";
          ctx.font = "bold 10px monospace";
          ctx.fillText("Singularity / Asymptote Line", centerTop.x + 8, centerTop.y - 2);
        }

      } else if (state.mode === "exponential") {
        // Draw 3D Exponential Trumpet / Growth Surface: z = Pe^(r * sqrt(x^2 + y^2))
        const P = state.paramA;
        const r = state.paramB;
        const offset = state.paramC;

        const rings = 12;
        const points = 40;

        for (let rIdx = 1; rIdx <= rings; rIdx++) {
          const radius = rIdx * 0.35;
          ctx.beginPath();
          
          // Exponential growth color mapping
          const hue = r > 0 ? 140 : 15; // Emerald or Amber depending on growth vs decay
          ctx.strokeStyle = `hsla(${hue}, 85%, 55%, 0.4)`;

          for (let pIdx = 0; pIdx <= points; pIdx++) {
            const angle = (pIdx / points) * Math.PI * 2;
            const mx = radius * Math.cos(angle);
            const mz = radius * Math.sin(angle);
            // Function: y = P * e^(r * distance) + offset
            const dist = Math.sqrt(mx * mx + mz * mz);
            const my = P * Math.exp(r * dist * 0.4) + offset;

            const proj = project3D(mx, my * 0.8, mz);
            if (proj.visible) {
              if (pIdx === 0) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }

        // Radial ribs
        ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
        const spokes = 12;
        for (let sIdx = 0; sIdx < spokes; sIdx++) {
          const angle = (sIdx / spokes) * Math.PI * 2;
          ctx.beginPath();
          for (let rIdx = 1; rIdx <= rings; rIdx++) {
            const radius = rIdx * 0.35;
            const mx = radius * Math.cos(angle);
            const mz = radius * Math.sin(angle);
            const dist = Math.sqrt(mx * mx + mz * mz);
            const my = P * Math.exp(r * dist * 0.4) + offset;
            const proj = project3D(mx, my * 0.8, mz);
            if (proj.visible) {
              if (rIdx === 1) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }

      } else {
        // Mode is Rational Function 3D Gravity Dipole / Saddle surface
        // z = paramA * x * y / (x^2 + y^2 + 0.2) + paramC
        const a = state.paramA;
        const vAsymp = state.paramB;
        const hAsymp = state.paramC;

        const uSteps = 20;
        const vSteps = 20;
        const minVal = -3.0;
        const maxVal = 3.0;

        // Draw 3D wireframe mesh
        ctx.strokeStyle = "rgba(147, 51, 234, 0.35)"; // Purple mesh
        ctx.lineWidth = 1;

        for (let i = 0; i <= uSteps; i++) {
          const u = minVal + (i / uSteps) * (maxVal - minVal);
          ctx.beginPath();
          for (let j = 0; j <= vSteps; j++) {
            const v = minVal + (j / vSteps) * (maxVal - minVal);
            
            // Rational function curve: z = a / ( (u - vAsymp)^2 + v^2 + 0.3 ) + hAsymp
            const distSq = (u - vAsymp) * (u - vAsymp) + v * v;
            const my = a / (distSq + 0.4) + hAsymp;

            const proj = project3D(u, my * 0.5, v);
            if (proj.visible) {
              if (j === 0) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }

        // Cross-wise wireframe
        ctx.strokeStyle = "rgba(147, 51, 234, 0.15)";
        for (let j = 0; j <= vSteps; j++) {
          const v = minVal + (j / vSteps) * (maxVal - minVal);
          ctx.beginPath();
          for (let i = 0; i <= uSteps; i++) {
            const u = minVal + (i / uSteps) * (maxVal - minVal);
            const distSq = (u - vAsymp) * (u - vAsymp) + v * v;
            const my = a / (distSq + 0.4) + hAsymp;

            const proj = project3D(u, my * 0.5, v);
            if (proj.visible) {
              if (i === 0) ctx.moveTo(proj.x, proj.y);
              else ctx.lineTo(proj.x, proj.y);
            }
          }
          ctx.stroke();
        }
      }

    } else {
      // ==================== DRAW 2D MODEL ====================
      // Draw grid coordinate lines
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 1.2;

      // Draw Main Axes
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();

      // Axis label ticks
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Draw X ticks
      for (let x = -6; x <= 6; x++) {
        if (x === 0) continue;
        const cx = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(cx, originY - 3);
        ctx.lineTo(cx, originY + 3);
        ctx.stroke();
        ctx.fillText(x.toString(), cx, originY + 5);
      }

      // Draw Y ticks
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let y = -4; y <= 4; y++) {
        if (y === 0) continue;
        const cy = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(originX - 3, cy);
        ctx.lineTo(originX + 3, cy);
        ctx.stroke();
        ctx.fillText(y.toString(), originX - 6, cy);
      }

      if (state.mode === "logarithmic") {
        // --- DRAW 2D LOGARITHMIC FUNCTION ---
        // y = paramA * ln( paramC * x - paramB )
        const a = state.paramA;
        const b = state.paramB; // vertical asymptote at x = b
        const c = state.paramC;

        // Draw Vertical Asymptote
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red glowing dotted line
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const asympX = toCanvasX(b);
        ctx.moveTo(asympX, 0);
        ctx.lineTo(asympX, height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Draw Asymptote Text tag
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`Asymptote: x = ${b.toFixed(1)}`, asympX + 8, 40);

        // Draw Function Line
        ctx.beginPath();
        ctx.strokeStyle = "#06b6d4"; // Cyan color
        ctx.lineWidth = 3.5;

        let first = true;
        // Sample points from just right of the vertical asymptote x = b
        for (let screenX = toCanvasX(b) + 1; screenX < width; screenX++) {
          const xVal = toMathX(screenX);
          const arg = c * xVal - b;
          if (arg > 0.001) {
            const yVal = a * Math.log(arg);
            const cy = toCanvasY(yVal);
            if (cy >= 0 && cy <= height) {
              if (first) {
                ctx.moveTo(screenX, cy);
                first = false;
              } else {
                ctx.lineTo(screenX, cy);
              }
            }
          }
        }
        ctx.stroke();

        // Highlighting the intercept point: when argument = 1 => x = (1 + b) / c
        const interceptX = (1 + b) / c;
        const cx = toCanvasX(interceptX);
        const cy = toCanvasY(0);
        if (cx >= 0 && cx <= width) {
          ctx.fillStyle = "#fbbf24"; // Yellow dot
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#020617";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label point
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 10px font-mono";
          ctx.fillText(`(${interceptX.toFixed(1)}, 0)`, cx + 10, cy - 8);
        }

        // Draw a dynamic tangent line based on interactive slider
        const tangentX = b + 1.5; // active tangent point
        const tangentArg = c * tangentX - b;
        if (tangentArg > 0) {
          const tangentY = a * Math.log(tangentArg);
          const slope = (a * c) / tangentArg; // dy/dx = a * c / (cx - b)
          const tCx = toCanvasX(tangentX);
          const tCy = toCanvasY(tangentY);

          // Draw point on curve
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(tCx, tCy, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw tangent line fragment
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const lineLength = 2.0;
          ctx.moveTo(toCanvasX(tangentX - lineLength), toCanvasY(tangentY - slope * lineLength));
          ctx.lineTo(toCanvasX(tangentX + lineLength), toCanvasY(tangentY + slope * lineLength));
          ctx.stroke();

          // Display derivative f'(x) value
          ctx.fillStyle = "#38bdf8";
          ctx.font = "10px font-mono";
          ctx.fillText(`f'(x) = ${slope.toFixed(2)}`, tCx + 10, tCy + 10);
        }

      } else if (state.mode === "exponential") {
        // --- DRAW 2D EXPONENTIAL FUNCTION ---
        // y = paramA * e^( paramB * x ) + paramC
        const P = state.paramA;
        const r = state.paramB;
        const offset = state.paramC;

        // Horizontal Asymptote: y = offset
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red glowing asymptote
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const asympY = toCanvasY(offset);
        ctx.moveTo(0, asympY);
        ctx.lineTo(width, asympY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Draw Asymptote label
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`Horizontal Asymptote: y = ${offset.toFixed(1)}`, 20, asympY - 8);

        // Draw Curve
        ctx.beginPath();
        ctx.strokeStyle = "#10b981"; // Emerald green
        ctx.lineWidth = 3.5;

        let first = true;
        for (let screenX = 0; screenX < width; screenX++) {
          const xVal = toMathX(screenX);
          const yVal = P * Math.exp(r * xVal) + offset;
          const cy = toCanvasY(yVal);
          if (cy >= 0 && cy <= height) {
            if (first) {
              ctx.moveTo(screenX, cy);
              first = false;
            } else {
              ctx.lineTo(screenX, cy);
            }
          }
        }
        ctx.stroke();

        // Intercept at x = 0 => y = P + offset
        const interceptY = P + offset;
        const cx = toCanvasX(0);
        const cy = toCanvasY(interceptY);
        if (cy >= 0 && cy <= height) {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#020617";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 10px font-mono";
          ctx.fillText(`(0, ${interceptY.toFixed(1)})`, cx + 10, cy - 6);
        }

        // Tangent line at x = 1
        const tX = 1.0;
        const tY = P * Math.exp(r * tX) + offset;
        const slope = P * r * Math.exp(r * tX); // dy/dx = P * r * e^(rx)
        const tCx = toCanvasX(tX);
        const tCy = toCanvasY(tY);

        if (tCy >= 0 && tCy <= height) {
          ctx.fillStyle = "#a7f3d0";
          ctx.beginPath();
          ctx.arc(tCx, tCy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(toCanvasX(tX - 1.5), toCanvasY(tY - slope * 1.5));
          ctx.lineTo(toCanvasX(tX + 1.5), toCanvasY(tY + slope * 1.5));
          ctx.stroke();

          ctx.fillStyle = "#a7f3d0";
          ctx.font = "10px font-mono";
          ctx.fillText(`f'(x) = ${slope.toFixed(2)}`, tCx + 10, tCy + 10);
        }

      } else {
        // --- DRAW 2D RATIONAL FUNCTION OR ITS APPLICATIONS ---
        // y = a / (x - b) + c
        const a = state.paramA;
        const vAsymp = state.paramB; // vertical asymptote at x = b
        const hAsymp = state.paramC; // horizontal asymptote at y = c

        if (activeTab === "applications" && activeApp !== "none") {
          // ==================== APPLICATIONS DRAWINGS ====================
          if (activeApp === "circuit") {
            // Ohm's Law Simulation: I = E / (R + r)
            const E = Math.max(2, a * 6); // Voltage (V)
            const r = Math.max(0.5, vAsymp + 3); // Internal resistance (ohms)
            const R_current = 5 + 4 * Math.sin(time * 1.5); // Oscillating external load R (0.5 to 10 ohms)
            const I_current = E / (R_current + r);

            // Clear left side with mini-graph
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // grid lines
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              // Y labels (Current in Amperes)
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${(i * 1.0).toFixed(1)}A`, startX - 25, gy + 3);
            }
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              // X labels (Resistance in Ohms)
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${i}Ω`, gx - 5, startY + 14);
              }
            }

            // Draw Axes
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + graphW, startY);
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY - graphH);
            ctx.stroke();

            // Graph Labels
            ctx.fillStyle = "#a855f7";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("ចរន្ត I (Amperes) vs របារ R (Ω)", startX, startY - graphH - 12);

            // Plot curve I = E / (R + r)
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 0; px <= graphW; px++) {
              const R_val = (px / graphW) * 10; // R ranges 0 to 10
              const I_val = E / (R_val + r);
              const cy = startY - (I_val / 5) * graphH; // max 5A
              if (cy >= startY - graphH && cy <= startY) {
                if (firstPt) {
                  ctx.moveTo(startX + px, cy);
                  firstPt = false;
                } else {
                  ctx.lineTo(startX + px, cy);
                }
              }
            }
            ctx.stroke();

            // Draw current point on curve
            const curCx = startX + (R_current / 10) * graphW;
            const curCy = startY - (I_current / 5) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Labels for dynamic values
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`I = ${I_current.toFixed(2)}A, R = ${R_current.toFixed(1)}Ω`, curCx + 8, curCy - 6);

            // --- DRAW CIRCUIT SCHEMATIC ON THE RIGHT ---
            const cX = width / 2 + 60;
            const cY = height / 2 - 30;
            const cW = 160;
            const cH = 100;

            // Wire loop paths
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.rect(cX, cY, cW, cH);
            ctx.stroke();

            // Draw battery on the left wire
            ctx.fillStyle = "#020617";
            ctx.fillRect(cX - 15, cY + cH/2 - 20, 30, 40);
            ctx.strokeStyle = "#22c55e"; // Green battery color
            ctx.lineWidth = 4;
            // Plates
            ctx.beginPath();
            ctx.moveTo(cX - 10, cY + cH/2 - 15); ctx.lineTo(cX + 10, cY + cH/2 - 15);
            ctx.moveTo(cX - 5, cY + cH/2 - 5); ctx.lineTo(cX + 5, cY + cH/2 - 5);
            ctx.moveTo(cX - 10, cY + cH/2 + 5); ctx.lineTo(cX + 10, cY + cH/2 + 5);
            ctx.moveTo(cX - 5, cY + cH/2 + 15); ctx.lineTo(cX + 5, cY + cH/2 + 15);
            ctx.stroke();
            
            // Battery Label
            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 10px monospace";
            ctx.fillText(`E = ${E.toFixed(1)}V`, cX - 45, cY + cH/2 + 4);

            // Draw Internal resistor on top-left wire
            const rx = cX + 25;
            const ry = cY;
            ctx.fillStyle = "#020617";
            ctx.fillRect(rx, ry - 8, 30, 16);
            ctx.strokeStyle = "#ef4444"; // Red internal res
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry - 8, 30, 16);
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 8px monospace";
            ctx.fillText(`r = ${r.toFixed(1)}Ω`, rx - 2, ry - 12);

            // Draw Variable potentiometer on the right wire
            const potX = cX + cW;
            const potY = cY + cH/2;
            ctx.fillStyle = "#020617";
            ctx.fillRect(potX - 10, potY - 20, 20, 40);
            ctx.strokeStyle = "#a855f7"; // purple resistor
            ctx.lineWidth = 2;
            ctx.strokeRect(potX - 10, potY - 20, 20, 40);
            
            // Arrow indicator
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(potX - 18, potY + 15);
            ctx.lineTo(potX + 18, potY - 15);
            ctx.lineTo(potX + 12, potY - 15);
            ctx.moveTo(potX + 18, potY - 15);
            ctx.lineTo(potX + 18, potY - 9);
            ctx.stroke();

            ctx.fillStyle = "#a855f7";
            ctx.font = "bold 10px monospace";
            ctx.fillText(`R = ${R_current.toFixed(1)}Ω`, potX + 15, potY + 4);

            // Draw glowing lightbulb on top-right
            const bulbX = cX + cW - 40;
            const bulbY = cY;
            ctx.fillStyle = "#020617";
            ctx.fillRect(bulbX - 12, bulbY - 12, 24, 24);
            
            // Glow intensity circle
            const glowRadius = 10 + I_current * 10;
            const grad = ctx.createRadialGradient(bulbX, bulbY, 2, bulbX, bulbY, glowRadius);
            grad.addColorStop(0, `rgba(251, 191, 36, ${Math.min(1.0, I_current / 2)})`);
            grad.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bulbX, bulbY, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Bulb symbol circle and filament
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bulbX, bulbY, 10, 0, Math.PI * 2);
            ctx.moveTo(bulbX - 6, bulbY + 4);
            ctx.lineTo(bulbX, bulbY - 4);
            ctx.lineTo(bulbX + 6, bulbY + 4);
            ctx.stroke();

            // Draw digital Multimeter in center displaying current I
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(cX + 40, cY + 30, 80, 40);
            ctx.strokeRect(cX + 40, cY + 30, 80, 40);

            ctx.fillStyle = "#34d399"; // glowing digital green
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${I_current.toFixed(2)} A`, cX + 80, cY + 54);
            ctx.font = "7px font-mono";
            ctx.fillStyle = "rgba(52, 211, 153, 0.6)";
            ctx.fillText("DIGITAL AMMETER", cX + 80, cY + 40);
            ctx.textAlign = "left"; // reset

            // Draw flowing golden dots representing electron current flow
            ctx.fillStyle = "#fbbf24";
            const numDots = 12;
            const speed = 25 * I_current; // flow speed proportional to current!
            
            // Loop total length = 2 * (cW + cH) = 520px
            const totalLen = 2 * (cW + cH);
            for (let i = 0; i < numDots; i++) {
              const dotDist = ((i * (totalLen / numDots)) + time * speed) % totalLen;
              let dx = 0, dy = 0;
              
              if (dotDist < cW) { // Top wire going right
                dx = cX + dotDist;
                dy = cY;
              } else if (dotDist < cW + cH) { // Right wire going down
                dx = cX + cW;
                dy = cY + (dotDist - cW);
              } else if (dotDist < 2 * cW + cH) { // Bottom wire going left
                dx = cX + cW - (dotDist - (cW + cH));
                dy = cY + cH;
              } else { // Left wire going up
                dx = cX;
                dy = cY + cH - (dotDist - (2 * cW + cH));
              }

              ctx.beginPath();
              ctx.arc(dx, dy, 3, 0, Math.PI * 2);
              ctx.fill();
            }

            // Annotation
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("គំរូសៀគ្វី៖ ម៉ូដែល potentiometer តាមច្បាប់ Ohm (ចរន្តខិតរកកម្រិតអសីមតូត)", cX - 40, cY + cH + 32);

          } else if (activeApp === "economics") {
            // Economics: Average Cost AC = FixedCost / q + UnitCost
            const FixedCost = a * 1000;
            const UnitCost = hAsymp * 10;
            const q_current = 250 + 200 * Math.sin(time * 1.0); // oscillating units quantity (50 to 450)
            const AC_current = FixedCost / q_current + UnitCost;

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 55;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // grid lines
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              // Y labels (Average Cost in USD)
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`$${i * 30}`, startX - 30, gy + 3);
            }
            for (let i = 0; i <= 5; i++) {
              const gx = startX + (i / 5) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              // X labels (Production quantity)
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 100}q`, gx - 10, startY + 14);
            }

            // Draw Horizontal Asymptote at UnitCost (theoretical minimum)
            const hAsympY = startY - (UnitCost / 150) * graphH;
            ctx.strokeStyle = "rgba(34, 197, 94, 0.65)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(startX, hAsympY);
            ctx.lineTo(startX + graphW, hAsympY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 8px font-mono";
            ctx.fillText(`Unit Cost Asymptote: $${UnitCost.toFixed(1)}`, startX + 10, hAsympY - 4);

            // Draw axes
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + graphW, startY);
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY - graphH);
            ctx.stroke();

            // Graph Title
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("ថ្លៃដើមមធ្យម AC ($) vs បរិមាណផលិតផល q", startX, startY - graphH - 12);

            // Plot AC curve
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 1; px <= graphW; px++) {
              const q_val = (px / graphW) * 500; // q 0 to 500
              const AC_val = FixedCost / q_val + UnitCost;
              const cy = startY - (AC_val / 150) * graphH;
              if (cy >= startY - graphH && cy <= startY) {
                if (firstPt) {
                  ctx.moveTo(startX + px, cy);
                  firstPt = false;
                } else {
                  ctx.lineTo(startX + px, cy);
                }
              }
            }
            ctx.stroke();

            // Draw current point
            const curCx = startX + (q_current / 500) * graphW;
            const curCy = startY - (AC_current / 150) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`AC = $${AC_current.toFixed(1)}`, curCx + 8, curCy - 6);

            // --- DRAW VISUAL CONVEYOR BELT ON THE RIGHT ---
            const fX = width / 2 + 50;
            const fY = height / 2 - 50;

            // Draw Factory silhouette
            ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fX, fY + 60);
            ctx.lineTo(fX, fY + 10);
            ctx.lineTo(fX + 25, fY - 10); // chimney 1
            ctx.lineTo(fX + 25, fY + 15);
            ctx.lineTo(fX + 50, fY + 15);
            ctx.lineTo(fX + 50, fY + 10);
            ctx.lineTo(fX + 75, fY - 10); // chimney 2
            ctx.lineTo(fX + 75, fY + 30);
            ctx.lineTo(fX + 110, fY + 30);
            ctx.lineTo(fX + 110, fY + 60);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Smoke Puffs
            const smokeRate = q_current / 500; // more smoke for faster production!
            ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
            for (let sIdx = 0; sIdx < 3; sIdx++) {
              const sY = fY - 20 - ((time * 15 + sIdx * 20) % 40);
              const sSize = 4 + ((time * 3 + sIdx * 5) % 8);
              ctx.beginPath();
              ctx.arc(fX + 12, sY, sSize, 0, Math.PI * 2);
              ctx.arc(fX + 62, sY - 5, sSize * 0.8, 0, Math.PI * 2);
              ctx.fill();
            }

            // Conveyor Belt Line
            ctx.strokeStyle = "rgba(100, 116, 139, 0.8)";
            ctx.lineWidth = 4;
            ctx.strokeRect(fX - 10, fY + 60, 150, 10);

            // Spinning gears inside conveyor belt
            const gearSpeed = (q_current / 500) * 5;
            ctx.fillStyle = "#64748b";
            for (let gIdx = 0; gIdx < 4; gIdx++) {
              const gx = fX + gIdx * 45 + 10;
              const gy = fY + 65;
              ctx.beginPath();
              ctx.arc(gx, gy, 4, 0, Math.PI * 2);
              ctx.fill();
              // teeth rotation line
              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(gx - Math.cos(time * gearSpeed) * 6, gy - Math.sin(time * gearSpeed) * 6);
              ctx.lineTo(gx + Math.cos(time * gearSpeed) * 6, gy + Math.sin(time * gearSpeed) * 6);
              ctx.stroke();
            }

            // Moving Boxes on belt
            const boxSpacing = 60;
            const boxOffset = (time * 12 * gearSpeed) % 180;
            ctx.fillStyle = "#d97706"; // Cardboard brown
            ctx.strokeStyle = "#b45309";
            ctx.lineWidth = 1;
            for (let bIdx = 0; bIdx < 3; bIdx++) {
              const bx = fX - 30 + (bIdx * boxSpacing + boxOffset) % 150;
              if (bx > fX - 10 && bx < fX + 130) {
                ctx.fillRect(bx, fY + 45, 14, 15);
                ctx.strokeRect(bx, fY + 45, 14, 15);
                // Tape line
                ctx.strokeStyle = "#451a03";
                ctx.beginPath();
                ctx.moveTo(bx + 7, fY + 45); ctx.lineTo(bx + 7, fY + 48);
                ctx.stroke();
              }
            }

            // Scoreboard summary card
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(fX - 10, fY + 85, 150, 60);
            ctx.strokeRect(fX - 10, fY + 85, 150, 60);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`បរិមាណផលិត (q)៖ ${q_current.toFixed(0)} items`, fX, fY + 98);
            ctx.fillText(`ថ្លៃដើមថេរ (Fixed)៖ $${FixedCost.toFixed(0)}`, fX, fY + 112);
            ctx.fillText(`ថ្លៃឯកតា (Unit)៖ $${UnitCost.toFixed(1)}/unit`, fX, fY + 126);
            ctx.fillStyle = "#10b981";
            ctx.fillText(`ថ្លៃដើមមធ្យម (AC)៖ $${AC_current.toFixed(2)}`, fX, fY + 138);

          } else if (activeApp === "light") {
            // Light Intensity Inverse Square Law: I = S / d^2
            const Power = a * 200; // source power
            const d_current = 5.5 + 4.0 * Math.sin(time * 0.9); // oscillating distance d (1.5m to 9.5m)
            const I_current = Power / (d_current * d_current);

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // grid lines
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              // Y labels (Intensity in Lux)
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 20} lx`, startX - 28, gy + 3);
            }
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              // X labels (Distance in meters)
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${i}m`, gx - 5, startY + 14);
              }
            }

            // Draw axes
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + graphW, startY);
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY - graphH);
            ctx.stroke();

            // Graph Title
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("ពន្លឺ I (Lux) vs ចម្ងាយ d (Meters)", startX, startY - graphH - 12);

            // Plot AC curve
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 1; px <= graphW; px++) {
              const d_val = (px / graphW) * 10; // d 0 to 10
              const I_val = Power / (d_val * d_val);
              const cy = startY - (I_val / 100) * graphH;
              if (cy >= startY - graphH && cy <= startY) {
                if (firstPt) {
                  ctx.moveTo(startX + px, cy);
                  firstPt = false;
                } else {
                  ctx.lineTo(startX + px, cy);
                }
              }
            }
            ctx.stroke();

            // Draw current point
            const curCx = startX + (d_current / 10) * graphW;
            const curCy = startY - (I_current / 100) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`I = ${I_current.toFixed(1)} Lux`, curCx + 8, curCy - 6);

            // --- DRAW LIGHT SCENE ON THE RIGHT ---
            const rX = width / 2 + 50;
            const rY = height / 2 - 30;
            const totalRangeX = 140;

            // Lightbulb stand (left)
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(rX, rY + 40);
            ctx.lineTo(rX, rY);
            ctx.stroke();

            // Translucent glowing cone of light
            const coneEndX = rX + (d_current / 10) * totalRangeX;
            ctx.fillStyle = `rgba(253, 224, 71, ${Math.min(0.45, (I_current / 100) * 0.5)})`;
            ctx.beginPath();
            ctx.moveTo(rX, rY - 5);
            ctx.lineTo(coneEndX, rY - 25);
            ctx.lineTo(coneEndX, rY + 25);
            ctx.closePath();
            ctx.fill();

            // Lightbulb bulb
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(rX, rY - 5, 12, 0, Math.PI * 2);
            ctx.fill();
            // bulb filament
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(rX - 4, rY - 3);
            ctx.lineTo(rX, rY - 10);
            ctx.lineTo(rX + 4, rY - 3);
            ctx.stroke();

            // Photodetector sensor stand on the right
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(coneEndX, rY + 40);
            ctx.lineTo(coneEndX, rY - 20);
            ctx.stroke();
            // Photodetector board face
            ctx.fillStyle = "#1e293b";
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 1.5;
            ctx.fillRect(coneEndX - 4, rY - 15, 8, 30);
            ctx.strokeRect(coneEndX - 4, rY - 15, 8, 30);

            // Shooting photon particles
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            const particles = 8;
            for (let pIdx = 0; pIdx < particles; pIdx++) {
              const distRatio = ((pIdx * 0.125 + time * 0.15) % 1.0);
              const px = rX + distRatio * (d_current / 10) * totalRangeX;
              // spread slightly in Y
              const py = rY - 5 + (distRatio * 15 * Math.sin(pIdx * 2));
              if (px < coneEndX) {
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Small dynamic digital lux meter on sensor
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;
            ctx.fillRect(coneEndX - 35, rY + 45, 70, 20);
            ctx.strokeRect(coneEndX - 35, rY + 45, 70, 20);

            ctx.fillStyle = "#e0f2fe";
            ctx.font = "bold 8px monospace";
            ctx.fillText(`${I_current.toFixed(1)} lx`, coneEndX - 28, rY + 57);

            // Labels
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 10px font-sans";
            ctx.fillText(`ប្រភពពន្លឺ៖ ${Power}W`, rX - 35, rY - 24);
            ctx.fillText(`ចម្ងាយ d៖ ${d_current.toFixed(1)}m`, coneEndX - 25, rY - 28);
          }

        } else {
          // ==================== STANDARD MATH GRAPH AND STEP-BY-STEP HIGHLIGHTS ====================
          // Draw standard axes and ticks
          ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.moveTo(0, originY);
          ctx.lineTo(width, originY);
          ctx.moveTo(originX, 0);
          ctx.lineTo(originX, height);
          ctx.stroke();

          // Axis labels & ticks
          ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          // X ticks
          for (let x = -6; x <= 6; x++) {
            if (x === 0) continue;
            const cx = toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(cx, originY - 3);
            ctx.lineTo(cx, originY + 3);
            ctx.stroke();
            ctx.fillText(x.toString(), cx, originY + 5);
          }

          // Y ticks
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          for (let y = -4; y <= 4; y++) {
            if (y === 0) continue;
            const cy = toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(originX - 3, cy);
            ctx.lineTo(originX + 3, cy);
            ctx.stroke();
            ctx.fillText(y.toString(), originX - 6, cy);
          }
          ctx.textAlign = "left"; // Reset alignment

          // Asymptote coordinates
          const asympX = toCanvasX(vAsymp);
          const asympY = toCanvasY(hAsymp);

          // Highlights for Step 1 (Domain)
          if (selectedStep === 0) {
            // Draw a warning exclusion zone around the vertical asymptote
            ctx.fillStyle = "rgba(239, 68, 68, 0.04)";
            ctx.fillRect(asympX - 15, 0, 30, height);
            
            ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(asympX - 15, 0); ctx.lineTo(asympX - 15, height);
            ctx.moveTo(asympX + 15, 0); ctx.lineTo(asympX + 15, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw a cross warning on the X axis exclusion point
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(asympX - 6, originY - 6); ctx.lineTo(asympX + 6, originY + 6);
            ctx.moveTo(asympX - 6, originY + 6); ctx.lineTo(asympX + 6, originY - 6);
            ctx.stroke();

            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`x ≠ ${vAsymp.toFixed(1)} (ក្រៅដែនកំណត់)`, asympX + 10, originY - 14);
          }

          // Draw Vertical Asymptote
          ctx.strokeStyle = selectedStep === 3 ? "rgba(239, 68, 68, 0.95)" : "rgba(239, 68, 68, 0.65)";
          ctx.lineWidth = selectedStep === 3 ? 2.5 : 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(asympX, 0);
          ctx.lineTo(asympX, height);
          ctx.stroke();

          // Draw Horizontal Asymptote
          ctx.beginPath();
          ctx.moveTo(0, asympY);
          ctx.lineTo(width, asympY);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash

          // Draw Asymptote Labels
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`VA: x = ${vAsymp.toFixed(1)}`, asympX + 8, 30);
          ctx.fillText(`HA: y = ${hAsymp.toFixed(1)}`, 20, asympY - 8);

          // Draw Curves (Left and Right branches)
          ctx.lineWidth = selectedStep === 4 ? 4.5 : 3.5;
          ctx.strokeStyle = "#a855f7"; // Purple

          // Left Branch
          ctx.beginPath();
          let first = true;
          for (let screenX = 0; screenX < asympX - 2; screenX++) {
            const xVal = toMathX(screenX);
            const yVal = a / (xVal - vAsymp) + hAsymp;
            const cy = toCanvasY(yVal);
            if (cy >= 0 && cy <= height) {
              if (first) {
                ctx.moveTo(screenX, cy);
                first = false;
              } else {
                ctx.lineTo(screenX, cy);
              }
            }
          }
          ctx.stroke();

          // Right Branch
          ctx.beginPath();
          first = true;
          for (let screenX = asympX + 2; screenX < width; screenX++) {
            const xVal = toMathX(screenX);
            const yVal = a / (xVal - vAsymp) + hAsymp;
            const cy = toCanvasY(yVal);
            if (cy >= 0 && cy <= height) {
              if (first) {
                ctx.moveTo(screenX, cy);
                first = false;
              } else {
                ctx.lineTo(screenX, cy);
              }
            }
          }
          ctx.stroke();

          // Highlights for Step 2 (Derivative slope tangent)
          if (selectedStep === 1) {
            // Oscillating tangent point along branch
            const tX = vAsymp + 1.8 + 1.0 * Math.sin(time * 1.5);
            const tY = a / (tX - vAsymp) + hAsymp;
            const slope = -a / ((tX - vAsymp) * (tX - vAsymp));
            const tCx = toCanvasX(tX);
            const tCy = toCanvasY(tY);

            if (tCy >= 0 && tCy <= height) {
              // Glowing point
              ctx.fillStyle = "#38bdf8";
              ctx.beginPath();
              ctx.arc(tCx, tCy, 6, 0, Math.PI * 2);
              ctx.fill();

              // Tangent line segment
              ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              const range = 1.8;
              ctx.moveTo(toCanvasX(tX - range), toCanvasY(tY - slope * range));
              ctx.lineTo(toCanvasX(tX + range), toCanvasY(tY + slope * range));
              ctx.stroke();

              // Draw slope construction triangle (dy/dx)
              ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(tCx, tCy);
              ctx.lineTo(toCanvasX(tX + 0.6), tCy);
              ctx.lineTo(toCanvasX(tX + 0.6), toCanvasY(tY + slope * 0.6));
              ctx.stroke();

              // Slope text
              ctx.fillStyle = "#38bdf8";
              ctx.font = "bold 9px monospace";
              ctx.fillText(`f'(x) = ${slope.toFixed(2)} (${slope < 0 ? "ចុះ - Decreasing" : "កើន - Increasing"})`, tCx + 12, tCy - 4);
            }
          }

          // Highlights for Step 3 (Variation Table direction arrows on graph)
          if (selectedStep === 2) {
            // Draw flowing chevrons along both branches showing direction
            const direction = a > 0 ? -1 : 1; // decreasing or increasing
            const numArrows = 3;
            ctx.fillStyle = "rgba(168, 85, 247, 0.7)";

            for (let i = 0; i < numArrows; i++) {
              // Right branch arrows
              const rT = ((i / numArrows) + time * 0.1) % 1.0;
              const rX = vAsymp + 0.3 + rT * 4.0;
              const rY = a / (rX - vAsymp) + hAsymp;
              const rcX = toCanvasX(rX);
              const rcY = toCanvasY(rY);

              if (rcY >= 0 && rcY <= height) {
                ctx.beginPath();
                ctx.arc(rcX, rcY, 3, 0, Math.PI * 2);
                ctx.fill();
                // small arrowhead
                ctx.font = "12px monospace";
                ctx.fillText(direction < 0 ? "↘" : "↗", rcX - 4, rcY + 12);
              }

              // Left branch arrows
              const lT = ((i / numArrows) + time * 0.1) % 1.0;
              const lX = vAsymp - 4.3 + lT * 4.0;
              const lY = a / (lX - vAsymp) + hAsymp;
              const lcX = toCanvasX(lX);
              const lcY = toCanvasY(lY);

              if (lcY >= 0 && lcY <= height) {
                ctx.beginPath();
                ctx.arc(lcX, lcY, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = "12px monospace";
                ctx.fillText(direction < 0 ? "↘" : "↗", lcX - 4, lcY + 12);
              }
            }
          }

          // Highlights for Step 5 (Symmetry Center point and symmetric cords)
          if (selectedStep === 4) {
            // Symmetry Center dot
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(asympX, asympY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Center Label
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 10px font-sans";
            ctx.fillText(`ផ្ចិតឆ្លុះ I(${vAsymp.toFixed(1)}, ${hAsymp.toFixed(1)})`, asympX + 10, asympY - 10);

            // Draw two perfectly symmetric points: P1 and P2
            const dx = 1.5 + 0.5 * Math.sin(time * 0.8);
            const dy = a / dx;
            
            const p1x = vAsymp + dx;
            const p1y = hAsymp + dy;
            const p2x = vAsymp - dx;
            const p2y = hAsymp - dy;

            const p1Cx = toCanvasX(p1x);
            const p1Cy = toCanvasY(p1y);
            const p2Cx = toCanvasX(p2x);
            const p2Cy = toCanvasY(p2y);

            // Points
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(p1Cx, p1Cy, 5, 0, Math.PI * 2);
            ctx.arc(p2Cx, p2Cy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Symmetric connecting dashed line
            ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(p1Cx, p1Cy);
            ctx.lineTo(p2Cx, p2Cy);
            ctx.stroke();
            ctx.setLineDash([]); // Reset

            // Labels
            ctx.fillStyle = "#f43f5e";
            ctx.font = "9px monospace";
            ctx.fillText(`M1(${p1x.toFixed(2)}, ${p1y.toFixed(2)})`, p1Cx + 8, p1Cy - 4);
            ctx.fillText(`M2(${p2x.toFixed(2)}, ${p2y.toFixed(2)})`, p2Cx - 85, p2Cy + 12);
          } else {
            // standard hyperbola center
            ctx.fillStyle = "#e9d5ff";
            ctx.beginPath();
            ctx.arc(asympX, asympY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "8px monospace";
            ctx.fillText(`I(${vAsymp.toFixed(1)}, ${hAsymp.toFixed(1)})`, asympX + 10, asympY + 14);
          }
        }
      }
    }

  }, [state, time, rotX, rotY, isDragging, selectedStep, activeApp, activeTab]);

  return (
    <div className="flex flex-col gap-5 flex-1 bg-slate-900/50 p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl animate-fade-in" id="sim-function-variation">
      
      {/* Simulation Info Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full text-[10px] font-bold tracking-wide uppercase border border-cyan-500/20">
            សិក្សាអថេរភាព និងសង់ក្រាប (Graphing & Variation)
          </span>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            សិក្សាអថេរភាព និងសង់ក្រាបនៃអនុគមន៍ថ្នាក់ទី១២
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ពិសោធន៍ជាមួយក្រាបអនុគមន៍លោការីត អិចស្ប៉ូណង់ស្យែល និងសនិទាន ក្នុងទម្រង់ 2D ឬ 3D វិលជុំ
          </p>
        </div>

        {/* 2D vs 3D Dimension Switcher Button */}
        <button
          onClick={() => onChange({ ...state, is3d: !state.is3d })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 shadow-md ${
            state.is3d
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400/40 text-white shadow-cyan-500/25"
              : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          {state.is3d ? (
            <>
              <Maximize className="w-4 h-4 text-cyan-200 animate-spin" />
              <span>មើលទម្រង់ 3D (3D Mesh View)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-slate-400" />
              <span>ប្តូរទៅទម្រង់ 3D (Switch to 3D)</span>
            </>
          )}
        </button>
      </div>

      {/* Split Body Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
        
        {/* Left Column: Category selectors & parameters */}
        <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            ជ្រើសរើសប្រភេទអនុគមន៍ (Select Function)
          </div>

          {/* Buttons/Categories corresponding to the 3 infographics */}
          <div className="flex flex-col gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => handleModeChange("logarithmic")}
              className={`flex items-center gap-3.5 p-3 rounded-xl transition-all border text-left ${
                state.mode === "logarithmic"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">អនុគមន៍លោការីតនេពែ</div>
                <div className="text-[10px] font-mono opacity-60">y = a · ln(cx - b)</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("exponential")}
              className={`flex items-center gap-3.5 p-3 rounded-xl transition-all border text-left ${
                state.mode === "exponential"
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">អនុគមន៍អិចស្ប៉ូណង់ស្យែល</div>
                <div className="text-[10px] font-mono opacity-60">y = P · e^(r·x) + c</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("rational")}
              className={`flex items-center gap-3.5 p-3 rounded-xl transition-all border text-left ${
                state.mode === "rational"
                  ? "bg-purple-500/15 border-purple-500/35 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">អនុគមន៍សនិទាន</div>
                <div className="text-[10px] font-mono opacity-60">y = a / (x - b) + c</div>
              </div>
            </button>
          </div>

          {/* Interactive Parameters Sliders */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mt-1">
            លៃតម្រូវប៉ារ៉ាម៉ែត្រ (Parameters Control)
          </div>

          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
            
            {/* Parameter A */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span className="truncate">
                  {state.mode === "logarithmic" 
                    ? "មេគុណកម្ពស់ (Scale a)" 
                    : state.mode === "exponential" 
                    ? "មេគុណដើម (Initial P)" 
                    : "មេគុណលម្អៀង (Numerator a)"}
                </span>
                <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
                  {state.paramA.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={state.mode === "rational" ? "-4.0" : "0.5"}
                max="4.0"
                step="0.1"
                value={state.paramA}
                onChange={(e) => onChange({ ...state, paramA: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
              />
            </div>

            {/* Parameter B */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span className="truncate">
                  {state.mode === "logarithmic" 
                    ? "អ័ក្សអាស៊ីមតូត (Asymptote b)" 
                    : state.mode === "exponential" 
                    ? "អត្រាកំណើន (Growth Rate r)" 
                    : "អាស៊ីមតូតឈរ (Vertical Asymp b)"}
                </span>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                  {state.paramB.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={state.mode === "exponential" ? "-1.5" : "-2.0"}
                max="2.0"
                step="0.1"
                value={state.paramB}
                onChange={(e) => onChange({ ...state, paramB: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
            </div>

            {/* Parameter C */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span className="truncate">
                  {state.mode === "logarithmic" 
                    ? "មេគុណរហ័ស (Factor c)" 
                    : state.mode === "exponential" 
                    ? "បំលាស់ទីឈរ (Shift offset c)" 
                    : "អាស៊ីមតូតដេក (Horizontal Asymp c)"}
                </span>
                <span className="text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[10px]">
                  {state.paramC.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={state.mode === "logarithmic" ? "0.2" : "-2.0"}
                max="3.0"
                step="0.1"
                value={state.paramC}
                onChange={(e) => onChange({ ...state, paramC: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Ask AI Explanation Trigger button */}
          <button
            onClick={onExplainRequest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 active:scale-95 text-cyan-300 rounded-xl text-xs font-semibold border border-cyan-500/30 shadow-md transition-all mt-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            សួរគ្រូ AI ពន្យល់ (Ask AI Coach)
          </button>
        </div>

        {/* Right Column: Visualizer Viewport */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Active 2D/3D Simulator Canvas */}
          <div className="flex-1 flex flex-col min-h-[350px] md:min-h-[440px] relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
            
            {/* Header overlay for the Canvas status */}
            <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-cyan-300">
                {state.is3d ? "ការពិសោធន៍ 3D (3D Mesh Rotator)" : "ការពិសោធន៍ 2D (Interactive 2D Grapher)"}
              </span>
            </div>

            {state.is3d && (
              <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[9px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>អូសលើរូប (Drag) ដើម្បីបង្វិលម៉ូដែល 3D</span>
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={`w-full h-full block ${state.is3d ? "cursor-grab active:cursor-grabbing" : ""}`}
            />
          </div>

          {/* Infographics Detailed Data View Box */}
          {state.mode === "rational" ? (
            <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-5">
              
              {/* Tabs Switcher */}
              <div className="flex border-b border-white/5 pb-2 gap-4">
                <button
                  onClick={() => { setActiveTab("analysis"); setActiveApp("none"); }}
                  className={`pb-2.5 text-xs font-bold tracking-wide uppercase transition-all relative ${
                    activeTab === "analysis" 
                      ? "text-cyan-400 border-b-2 border-cyan-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    ដំណើការសិក្សា និងតារាងអថេរភាព (Study Steps & Variation)
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab("applications"); setActiveApp("circuit"); }}
                  className={`pb-2.5 text-xs font-bold tracking-wide uppercase transition-all relative ${
                    activeTab === "applications" 
                      ? "text-emerald-400 border-b-2 border-emerald-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    ម៉ូដែលពិសោធន៍ក្នុងជីវិតពិត (Real-world Applications)
                  </span>
                </button>
              </div>

              {activeTab === "analysis" ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Left: Interactive Stepper list */}
                  <div className="md:col-span-5 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      ជំហានវិភាគអនុគមន៍សនិទាន (Analysis Steps)
                    </div>
                    {[
                      { step: 0, label: "១. រកដែនកំណត់អនុគមន៍", sub: "Domain: D = R \\ {b}" },
                      { step: 1, label: "២. គណនាដេរីវេ f'(x)", sub: "Derivative & Monotonicity" },
                      { step: 2, label: "៣. សង់តារាងអថេរភាព", sub: "Variation Table & Direction" },
                      { step: 3, label: "៤. រកអាស៊ីមតូតឈរ & ដេក", sub: "Asymptotes: x = b, y = c" },
                      { step: 4, label: "៥. សង់ក្រាប និងផ្ចិតឆ្លុះ", sub: "Symmetry Center I(b, c)" }
                    ].map((s) => (
                      <button
                        key={s.step}
                        onClick={() => setSelectedStep(s.step)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                          selectedStep === s.step
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-200"
                            : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          selectedStep === s.step 
                            ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" 
                            : "bg-slate-900 text-slate-500 border border-white/5"
                        }`}>
                          {s.step + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">{s.label}</div>
                          <div className="text-[9px] font-mono opacity-60 truncate">{s.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right: Selected Step Context & Dynamic Variation Table */}
                  <div className="md:col-span-7 bg-slate-950/50 rounded-xl p-4 border border-white/5 flex flex-col gap-3 justify-between">
                    <div>
                      {selectedStep === 0 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            ជំហានទី ១៖ ដែនកំណត់ (Domain of Definition)
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            អនុគមន៍សនិទាន <span className="font-mono text-purple-400">y = a / (x - b) + c</span> មានន័យលុះត្រាតែភាគបែងខុសពីសូន្យ៖
                            <br />
                            <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">x - b ≠ 0 ⟹ x ≠ {state.paramB.toFixed(1)}</span>
                            ដូចនេះដែនកំណត់គឺ <span className="font-mono text-purple-300">D = R \ {"{"}{state.paramB.toFixed(1)}{"}"}</span>។ នៅត្រង់ចំណុចនេះ ខ្សែកោងនឹងដាច់ជាពីរផ្នែក ដាច់ដោយអ័ក្សឈរ។
                          </p>
                        </div>
                      )}

                      {selectedStep === 1 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            ជំហានទី ២៖ ដេរីវេ និងទិសដៅអថេរភាព (Derivative)
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            គណនាដេរីវេទី១ ដើម្បីរកភាពកើនចុះនៃអនុគមន៍៖
                            <br />
                            <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">y' = -a / (x - b)²</span>
                            ដោយសារ <span className="font-mono text-yellow-300">(x - b)² &gt; 0</span> ជានិច្ចចំពោះគ្រប់ <span className="font-mono text-purple-300">x ∈ D</span>៖
                            <br />
                            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                              {state.paramA > 0 
                                ? `✓ ព្រោះ a = ${state.paramA.toFixed(1)} > 0 ⟹ y' < 0 (អនុគមន៍ចុះដាច់ខាតលើ D)`
                                : `✓ ព្រោះ a = ${state.paramA.toFixed(1)} < 0 ⟹ y' > 0 (អនុគមន៍កើនដាច់ខាតលើ D)`
                              }
                            </span>
                          </p>
                        </div>
                      )}

                      {selectedStep === 2 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            ជំហានទី ៣៖ តារាងអថេរភាពឌីណាមិក (Dynamic Variation Table)
                          </div>
                          <p className="text-[10px] text-slate-400">
                            តារាងខាងក្រោមបង្ហាញពីការប្រែប្រួលតម្លៃ និងទិសដៅខ្សែកោង អាស្រ័យលើមេគុណបច្ចុប្បន្ន៖
                          </p>

                          {/* Render Dynamic Variation Table */}
                          <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900 mt-1">
                            <div className="grid grid-cols-5 border-b border-white/5 text-[10px] font-bold text-slate-400 bg-slate-950/60">
                              <div className="p-1.5 border-r border-white/10 text-center col-span-1">x</div>
                              <div className="p-1.5 border-r border-white/10 text-center">-∞</div>
                              <div className="p-1.5 border-r border-white/10 text-center text-red-400">{state.paramB.toFixed(1)}</div>
                              <div className="p-1.5 border-r border-white/10 text-center">+∞</div>
                              <div className="p-1.5 text-center">សញ្ញា</div>
                            </div>
                            
                            <div className="grid grid-cols-5 border-b border-white/5 text-[10px] font-mono text-slate-300">
                              <div className="p-1.5 border-r border-white/10 text-center bg-slate-950/20 font-bold">f'(x)</div>
                              <div className="p-1.5 border-r border-white/10 text-center text-cyan-400">{state.paramA > 0 ? "-" : "+"}</div>
                              <div className="p-1.5 border-r border-white/10 text-center text-red-400 font-bold font-sans">||</div>
                              <div className="p-1.5 border-r border-white/10 text-center text-cyan-400">{state.paramA > 0 ? "-" : "+"}</div>
                              <div className="p-1.5 text-center text-slate-500 font-sans">{state.paramA > 0 ? "ចុះ (Dec)" : "កើន (Inc)"}</div>
                            </div>

                            <div className="grid grid-cols-5 text-[10px] font-mono text-slate-300 min-h-[44px]">
                              <div className="p-2 border-r border-white/10 text-center bg-slate-950/20 font-bold flex items-center justify-center">f(x)</div>
                              {state.paramA > 0 ? (
                                <>
                                  <div className="p-2 border-r border-white/10 flex flex-col justify-between items-center text-center">
                                    <span className="text-slate-500 text-[9px]">{state.paramC.toFixed(1)}</span>
                                    <span className="text-purple-400 text-xs font-sans">↘</span>
                                    <span className="text-red-400 text-[8px]">-∞</span>
                                  </div>
                                  <div className="p-2 border-r border-white/10 text-center text-red-400 flex items-center justify-center font-bold font-sans">||</div>
                                  <div className="p-2 border-r border-white/10 flex flex-col justify-between items-center text-center">
                                    <span className="text-red-400 text-[8px]">+∞</span>
                                    <span className="text-purple-400 text-xs font-sans">↘</span>
                                    <span className="text-slate-500 text-[9px]">{state.paramC.toFixed(1)}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="p-2 border-r border-white/10 flex flex-col justify-between items-center text-center">
                                    <span className="text-red-400 text-[8px]">-∞</span>
                                    <span className="text-purple-400 text-xs font-sans">↗</span>
                                    <span className="text-slate-500 text-[9px]">{state.paramC.toFixed(1)}</span>
                                  </div>
                                  <div className="p-2 border-r border-white/10 text-center text-red-400 flex items-center justify-center font-bold font-sans">||</div>
                                  <div className="p-2 border-r border-white/10 flex flex-col justify-between items-center text-center">
                                    <span className="text-slate-500 text-[9px]">{state.paramC.toFixed(1)}</span>
                                    <span className="text-purple-400 text-xs font-sans">↗</span>
                                    <span className="text-red-400 text-[8px]">+∞</span>
                                  </div>
                                </>
                              )}
                              <div className="p-2 text-center text-slate-500 flex items-center justify-center font-sans text-[8px]">Asymp</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStep === 3 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            ជំហានទី ៤៖ អាស៊ីមតូតឈរ និងអាស៊ីមតូតដេក (Asymptotes)
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            អាស៊ីមតូតគឺជាបន្ទាត់ដែលក្រាបខិតជិតបំផុតនៅពេលអថេរ ឬអនុគមន៍ខិតជិតអនន្ត៖
                            <br />
                            • <span className="font-bold text-yellow-300">អាស៊ីមតូតឈរ (Vertical Asymptote)៖</span> គឺបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">x = {state.paramB.toFixed(1)}</span> (ដោយសារ <span className="font-mono text-[10px]">lim(x→b) f(x) = ±∞</span>)
                            <br />
                            • <span className="font-bold text-yellow-300">អាស៊ីមតូតដេក (Horizontal Asymptote)៖</span> គឺបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y = {state.paramC.toFixed(1)}</span> (ដោយសារ <span className="font-mono text-[10px]">lim(x→±∞) f(x) = c</span>)
                          </p>
                        </div>
                      )}

                      {selectedStep === 4 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            ជំហានទី ៥៖ ចំណុចឆ្លុះ និងផ្ចិតឆ្លុះ (Symmetry & Graphing)
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            ចំណុចប្រសព្វរវាងអាស៊ីមតូតទាំងពីរ <span className="font-mono text-yellow-300">I(b, c) = I({state.paramB.toFixed(1)}, {state.paramC.toFixed(1)})</span> គឺជា <span className="font-bold text-purple-300">ផ្ចិតឆ្លុះ (Symmetry Center)</span> នៃអ៊ីពែបូល។
                            <br />
                            រូបមន្តផ្ចិតឆ្លុះ៖ ចំពោះគ្រប់ <span className="font-mono text-[10px]">x</span> នៅក្នុងដែនកំណត់ ត្រូវតែផ្ទៀងផ្ទាត់៖
                            <br />
                            <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">f(2b - x) + f(x) = 2c</span>
                            នៅលើក្រាប ២ឌី យើងបានបង្ហាញចំណុចឆ្លុះគ្នាចំនួនពីរ <span className="text-rose-400 font-semibold">M1</span> និង <span className="text-rose-400 font-semibold">M2</span> ដែលឆ្លុះគ្នាចំពោះផ្ចិត <span className="text-amber-400 font-semibold">I</span> ជានិច្ច!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick mathematical facts */}
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] text-slate-400 flex justify-between items-center font-mono">
                      <span>Equation: y = {state.paramA.toFixed(1)} / (x - {state.paramB.toFixed(1)}) + {state.paramC.toFixed(1)}</span>
                      <span className="text-purple-300">Hyperbola shape</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Selectors for three micro-simulators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveApp("circuit")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeApp === "circuit"
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                          : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold">១. ច្បាប់អូម (Ohm's Law)</span>
                      </div>
                      <p className="text-[10px] opacity-70 leading-tight">ម៉ូដែលសៀគ្វីចរន្តអគ្គិសនី I = E / (R + r) ជាអនុគមន៍សនិទាន។</p>
                    </button>

                    <button
                      onClick={() => setActiveApp("economics")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeApp === "economics"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">២. ថ្លៃដើមមធ្យម (Average Cost)</span>
                      </div>
                      <p className="text-[10px] opacity-70 leading-tight">សេដ្ឋកិច្ចផលិតកម្ម AC = F / q + V។ ថ្លៃដើមកាន់តែថយចុះតាមទ្រង់ទ្រាយផលិត។</p>
                    </button>

                    <button
                      onClick={() => setActiveApp("light")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeApp === "light"
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold">៣. អាំងតង់ស៊ីតេពន្លឺ (Light Intensity)</span>
                      </div>
                      <p className="text-[10px] opacity-70 leading-tight">រូបវិទ្យា៖ ថាមពលពន្លឺ I = S / d² ប្រែប្រួលច្រាសនឹងការ៉េនៃចម្ងាយ។</p>
                    </button>
                  </div>

                  {/* App specific explanation detail */}
                  <div className="bg-slate-950/70 border border-white/5 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {activeApp === "circuit" && (
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-amber-300 text-xs">ពន្យល់ពីគំរូសៀគ្វី (Ohm's Law Mechanism)៖</div>
                        <p className="text-[11px] text-slate-300">
                          ចរន្តអគ្គិសនី <span className="font-mono text-cyan-300">I (Amperes)</span> ហូរក្នុងសៀគ្វីភ្ជាប់នឹងប្រភពកម្លាំងអគ្គិសនីចលករ <span className="font-mono text-yellow-300">E = {Math.max(2, state.paramA * 6).toFixed(1)}V</span> និងមានរ៉េស៊ីស្តង់ក្នុង <span className="font-mono text-red-400">r = {Math.max(0.5, state.paramB + 3).toFixed(1)}Ω</span> ត្រូវបានគណនាតាមរូបមន្តសនិទាន៖
                          <br />
                          <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">I(R) = E / (R + r)</span>
                          នៅពេលរ៉េស៊ីស្តង់ក្រៅ <span className="font-mono text-purple-300">R</span> កើនឡើងទៅអនន្ត (<span className="font-mono">R → +∞</span>) ចរន្តអគ្គិសនី <span className="font-mono text-cyan-300">I</span> នឹងខិតជិត <span className="font-mono text-cyan-300">0A</span> (អ័ក្សអាស៊ីមតូតដេក)។ បើសិនជា <span className="font-mono text-purple-300">R = 0Ω</span> (សៀគ្វីខ្លី / Short Circuit) ចរន្តអគ្គិសនីឈានដល់កម្រិតអតិបរមា <span className="font-mono text-yellow-300">I_max = E / r = {(Math.max(2, state.paramA * 6) / Math.max(0.5, state.paramB + 3)).toFixed(2)}A</span> ដែលកំណត់ដោយអាស៊ីមតូតឈរ!
                        </p>
                      </div>
                    )}
                    {activeApp === "economics" && (
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-emerald-300 text-xs">ថ្លៃដើមមធ្យម និងផលសេដ្ឋកិច្ចតាមទ្រង់ទ្រាយ (Economies of Scale)៖</div>
                        <p className="text-[11px] text-slate-300">
                          នៅក្នុងសហគ្រាសផលិត ថ្លៃដើមជាមធ្យមសម្រាប់ផលិតផលមួយឯកតា <span className="font-mono text-emerald-400">AC</span> ផ្សំឡើងដោយថ្លៃដើមថេរ <span className="font-mono text-amber-400">F = ${(state.paramA * 1000).toFixed(0)}</span> (ដូចជា ថ្លៃជួលអគារ ម៉ាស៊ីន) និងថ្លៃដើមប្រែប្រួលក្នុងមួយឯកតា <span className="font-mono text-purple-400">V = ${(state.paramC * 10).toFixed(1)}</span> (ដូចជា សម្ភារៈពលកម្ម)៖
                          <br />
                          <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">AC(q) = F / q + V</span>
                          នៅពេលបរិមាណផលិត <span className="font-mono text-yellow-400">q</span> កាន់តែច្រើន ថ្លៃដើមថេរនឹងត្រូវចែករំលែកកាន់តែស្តើងទៅលើផលិតផលនីមួយៗ ធ្វើឲ្យថ្លៃដើមរួម <span className="font-mono text-emerald-400">AC</span> កាន់តែថយចុះខិតទៅរក <span className="font-mono text-emerald-400">V = ${(state.paramC * 10).toFixed(1)}</span> (អាស៊ីមតូតដេក)។ នេះពន្យល់ថាហេតុអ្វីបានជាការផលិតទ្រង់ទ្រាយធំចំណេញជាងផលិតទ្រង់ទ្រាយតូច!
                        </p>
                      </div>
                    )}
                    {activeApp === "light" && (
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-cyan-300 text-xs">ច្បាប់ច្រាសការ៉េនៃចម្ងាយពន្លឺ (Inverse-Square Law of Light)៖</div>
                        <p className="text-[11px] text-slate-300">
                          អាំងតង់ស៊ីតេពន្លឺ <span className="font-mono text-yellow-300">I (Lux)</span> ធ្វើដំណើរពីប្រភពដែលមានថាមពល <span className="font-mono text-cyan-300">P = {(state.paramA * 200).toFixed(0)}W</span> ទៅកាន់ឧបករណ៍ទទួលចម្ងាយ <span className="font-mono text-purple-300">d</span> ម៉ែត្រ ប្រែប្រួលតាមច្បាប់ច្រាសការ៉េ (ជាទម្រង់អនុគមន៍សនិទានកម្រិតពីរ)៖
                          <br />
                          <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">I(d) = P / d²</span>
                          នៅពេលចម្ងាយខិតជិត <span className="font-mono">0</span> (<span className="font-mono">d → 0</span>) អាំងតង់ស៊ីតេពន្លឺកើនឡើងខ្ពស់ខ្លាំងខិតទៅរកអនន្ត (អាស៊ីមតូតឈរ)។ នៅពេលចម្ងាយកាន់តែឆ្ងាយ (<span className="font-mono">d → +∞</span>) ពន្លឺនឹងចុះខ្សោយខ្លាំងខិតទៅរក <span className="font-mono">0 Lux</span> (អាស៊ីមតូតដេក)។
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left side: Mathematical Variation properties */}
              <div className="flex flex-col gap-2.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                  ដែនកំណត់ និងលក្ខណៈរូបមន្ត (Mathematical Analysis)
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="text-slate-500 font-medium text-[9px]">ដែនកំណត់ (Domain & Range)</div>
                    <div className="text-cyan-300 font-mono mt-0.5">
                      {state.mode === "logarithmic" 
                        ? "D = (b/c, +∞)" 
                        : "D = R, R+ = (c, +∞)"}
                    </div>
                  </div>

                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="text-slate-500 font-medium text-[9px]">ដេរីវេ (Derivative f'(x))</div>
                    <div className="text-cyan-300 font-mono mt-0.5">
                      {state.mode === "logarithmic" 
                        ? "y' = a·c / (c·x - b)" 
                        : "y' = P·r · e^(r·x)"}
                    </div>
                  </div>

                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 col-span-2">
                    <div className="text-slate-500 font-medium text-[9px]">លីមីត និងអាស៊ីមតូត (Limits & Asymptotes)</div>
                    <div className="text-cyan-300 font-mono mt-0.5 text-xs">
                      {state.mode === "logarithmic" 
                        ? `lim(x→b⁺) = -∞  (អាស៊ីមតូតឈរ x = ${state.paramB.toFixed(1)})` 
                        : `lim(x→-∞) = ${state.paramC.toFixed(1)}  (អាស៊ីមតូតដេក y = ${state.paramC.toFixed(1)})`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Real-world Applications */}
              <div className="flex flex-col gap-2.5 border-t md:border-t-0 md:border-l border-white/5 md:pl-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  ការអនុវត្តក្នុងជីវភាពពិត (Real-world Applications)
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs">
                  {state.mode === "logarithmic" ? (
                    <>
                      <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <Binary className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-white text-[11px]">វិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យា៖</span>
                          <p className="text-[10px] text-slate-400">វាស់កម្រិតសំឡេង (Decibels), រញ្ជួយដី (Richter Scale), pH ទឹក។</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <Coins className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-white text-[11px]">ហិរញ្ញវត្ថុ និងសេដ្ឋកិច្ច៖</span>
                          <p className="text-[10px] text-slate-400">គណនាពេលវេលាកើនឡើងទិន្នន័យ ការរំលោះ និងឥទ្ធិពលការប្រាក់បង្គរ។</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <Rocket className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-white text-[11px]">កំណើនប្រជាជន និងមេរោគ៖</span>
                          <p className="text-[10px] text-slate-400">សិក្សាអត្រារីករាលដាលនៃជំងឺឆ្លង ឬកំណើនកោសិកាជីវសាស្ត្រលឿនបំផុត។</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-white text-[11px]">រូបវិទ្យា (ការបំបែកធាតុវិទ្យុសកម្ម)៖</span>
                          <p className="text-[10px] text-slate-400">វាស់អាយុកាលកាបូន (Half-life) នៃវត្ថុបុរាណ និងការថយចុះសីតុណ្ហភាព។</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
