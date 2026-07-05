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
  BookOpen,
  FlaskConical,
  Volume2
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
  const [activeApp, setActiveApp] = useState<"none" | "circuit" | "economics" | "light" | "population" | "interest" | "decay" | "sound" | "richter" | "ph">("none");
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
        // --- DRAW 2D LOGARITHMIC FUNCTION OR ITS APPLICATIONS ---
        // y = paramA * ln( paramC * x - paramB )
        const a = state.paramA;
        const b = state.paramB; // vertical asymptote at x = b
        const c = state.paramC;

        if (activeTab === "applications" && activeApp !== "none") {
          // ==================== LOGARITHMIC APPLICATIONS DRAWINGS ====================
          if (activeApp === "sound") {
            // Sound Level (dB): L = 15 + a * 20 * ln(c * I - b)
            const I_input = 1.0 + 8.5 * (0.5 + 0.5 * Math.sin(time * 1.2)); // Oscillating intensity 1 to 9.5
            const arg = Math.max(0.1, c * I_input - b);
            const dB = Math.min(130, Math.max(0, 15 + a * 20 * Math.log(arg)));

            // Clear with deep slate/navy color
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // Y Grid Lines (Sound level dB from 0 to 120)
            for (let i = 0; i <= 6; i++) {
              const gy = startY - (i / 6) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 20} dB`, startX - 32, gy + 3);
            }
            // X Grid Lines (Sound Intensity I)
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${i} pW`, gx - 5, startY + 14);
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
            ctx.fillStyle = "#06b6d4";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("កម្រិតសំឡេង L (dB) vs អាំងតង់ស៊ីតេ I (pW/m²)", startX, startY - graphH - 12);

            // Plot logarithmic curve
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 1; px <= graphW; px++) {
              const I_val = 0.1 + (px / graphW) * 10;
              const curArg = Math.max(0.1, c * I_val - b);
              const dB_val = Math.min(130, Math.max(0, 15 + a * 20 * Math.log(curArg)));
              const cy = startY - (dB_val / 120) * graphH;
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

            // Current state point
            const curCx = startX + (I_input / 10) * graphW;
            const curCy = startY - (dB / 120) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`L = ${dB.toFixed(0)} dB`, curCx + 8, curCy - 6);

            // --- DRAW SPEAKER & SOUNDWAVES ON THE RIGHT ---
            const rX = width / 2 + 50;
            const rY = height / 2 - 20;

            const spW = 70;
            const spH = 110;
            const spX = rX;
            const spY = rY - spH / 2;

            const pulse = 1.0 + (dB / 120) * 0.08 * Math.sin(time * 30);
            ctx.save();
            ctx.translate(spX + spW / 2, spY + spH / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-(spX + spW / 2), -(spY + spH / 2));

            // Speaker box
            ctx.fillStyle = "#1e293b";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 2.5;
            ctx.fillRect(spX, spY, spW, spH);
            ctx.strokeRect(spX, spY, spW, spH);

            // Subwoofer bottom cone
            const subX = spX + spW / 2;
            const subY = spY + 75;
            const subR = 22;
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(subX, subY, subR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // inner cone
            ctx.fillStyle = "#334155";
            ctx.beginPath();
            ctx.arc(subX, subY, subR * 0.5 + (dB / 120) * 4 * Math.sin(time * 30), 0, Math.PI * 2);
            ctx.fill();

            // Tweeter top cone
            const twX = spX + spW / 2;
            const twY = spY + 30;
            const twR = 12;
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(twX, twY, twR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore(); // restore

            // Sound ripples
            const rippleColor = dB < 50 ? "rgba(52, 211, 153," : dB < 85 ? "rgba(56, 189, 248," : "rgba(239, 68, 68,";
            const numRipples = 3;
            ctx.lineWidth = 3;
            for (let rIdx = 0; rIdx < numRipples; rIdx++) {
              const rT = ((rIdx / numRipples) + time * 0.7) % 1.0;
              const radius = 25 + rT * 110;
              const alpha = Math.max(0, 1.0 - rT) * (0.3 + (dB / 120) * 0.7);
              ctx.strokeStyle = rippleColor + alpha + ")";
              ctx.beginPath();
              ctx.arc(spX + spW, spY + spH / 2, radius, -Math.PI / 3, Math.PI / 3);
              ctx.stroke();
            }

            // VU meter
            const vuX = width - 45;
            const vuY = rY - 50;
            const vuW = 12;
            const vuH = 100;

            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(vuX, vuY, vuW, vuH);
            ctx.strokeRect(vuX, vuY, vuW, vuH);

            const segments = 10;
            const filledSegs = Math.round((dB / 120) * segments);
            for (let sIdx = 0; sIdx < segments; sIdx++) {
              let segColor = "#1e293b";
              if (sIdx < filledSegs) {
                if (sIdx < 5) segColor = "#10b981";
                else if (sIdx < 8) segColor = "#eab308";
                else segColor = "#ef4444";
              }
              ctx.fillStyle = segColor;
              const sy = vuY + vuH - (sIdx + 1) * (vuH / segments) + 1;
              ctx.fillRect(vuX + 1.5, sy, vuW - 3, (vuH / segments) - 2);
            }

            ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
            ctx.font = "7px monospace";
            ctx.fillText("120", vuX - 16, vuY + 7);
            ctx.fillText("60", vuX - 12, vuY + vuH / 2 + 3);
            ctx.fillText("0", vuX - 8, vuY + vuH);

            // Label card
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1;
            ctx.fillRect(spX - 15, spY + spH + 12, spW + 35, 34);
            ctx.strokeRect(spX - 15, spY + spH + 12, spW + 35, 34);

            let intensityDesc = "ស្ងប់ស្ងាត់ (Whisper)";
            let intensityIcon = "🤫";
            if (dB > 95) {
              intensityDesc = "គ្រោះថ្នាក់ (Jet Engine)";
              intensityIcon = "🚨";
            } else if (dB > 80) {
              intensityDesc = "ឮខ្លាំង (Concert)";
              intensityIcon = "🎸";
            } else if (dB > 60) {
              intensityDesc = "មធ្យម (Traffic)";
              intensityIcon = "🚗";
            } else if (dB > 40) {
              intensityDesc = "ធម្មតា (Office)";
              intensityIcon = "🏢";
            }

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 8.5px font-sans";
            ctx.fillText(`កម្រិត៖ ${intensityIcon} ${intensityDesc}`, spX - 10, spY + spH + 24);
            ctx.fillStyle = "#06b6d4";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`SOUND LEVEL: ${dB.toFixed(0)} dB`, spX - 10, spY + spH + 38);

          } else if (activeApp === "richter") {
            // Richter scale magnitude M = 1.5 + a * 1.8 * ln(c * E - b)
            const E_input = 1.0 + 8.5 * (0.5 + 0.5 * Math.sin(time * 0.8));
            const arg = Math.max(0.1, c * E_input - b);
            const mag = Math.min(10, Math.max(1, 1.5 + a * 1.8 * Math.log(arg)));

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // Y Grid Lines (Richter magnitude from 0 to 10)
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 2} M`, startX - 25, gy + 3);
            }
            // X Grid Lines (Earthquake Energy E)
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${i}e9`, gx - 8, startY + 14);
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
            ctx.fillText("កម្រិតរិចទ័រ M (Richter) vs ថាមពល E (Joules)", startX, startY - graphH - 12);

            // Plot logarithmic curve
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 1; px <= graphW; px++) {
              const E_val = 0.1 + (px / graphW) * 10;
              const curArg = Math.max(0.1, c * E_val - b);
              const mag_val = Math.min(10, Math.max(1, 1.5 + a * 1.8 * Math.log(curArg)));
              const cy = startY - (mag_val / 10) * graphH;
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

            // Current state point
            const curCx = startX + (E_input / 10) * graphW;
            const curCy = startY - (mag / 10) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`M = ${mag.toFixed(1)}`, curCx + 8, curCy - 6);

            // --- DRAW SEISMOGRAPH & CRACKING EARTH ON THE RIGHT ---
            const rX = width / 2 + 30;
            const rY = height / 2 - 30;

            const shake = Math.sin(time * 45) * (mag * 0.9);

            const drX = rX + 5;
            const drY = rY + 10;
            const drW = 75;
            const drH = 50;

            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(drX, drY, drW, drH);
            ctx.strokeRect(drX, drY, drW, drH);

            ctx.strokeStyle = "rgba(239, 68, 68, 0.12)";
            ctx.lineWidth = 1;
            for (let i = 5; i < drW; i += 10) {
              ctx.beginPath(); ctx.moveTo(drX + i, drY); ctx.lineTo(drX + i, drY + drH); ctx.stroke();
            }
            for (let i = 5; i < drH; i += 10) {
              ctx.beginPath(); ctx.moveTo(drX, drY + i); ctx.lineTo(drX + drW, drY + i); ctx.stroke();
            }

            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            let drumPtFirst = true;
            for (let dx = 0; dx < drW; dx++) {
              const scrollOffset = (time * 25) % 15;
              const sampleX = (dx + scrollOffset) * 0.3;
              const waveY = (drY + drH / 2) + Math.sin(sampleX * 4) * Math.cos(sampleX * 1.5) * (mag * 2.2);
              if (drumPtFirst) {
                ctx.moveTo(drX + dx, waveY);
                drumPtFirst = false;
              } else {
                ctx.lineTo(drX + dx, waveY);
              }
            }
            ctx.stroke();

            const penY = drY + drH / 2 + shake * 1.8;
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drX - 14, drY - 15);
            ctx.lineTo(drX - 14, penY);
            ctx.lineTo(drX + 2, penY);
            ctx.stroke();
            ctx.fillStyle = "#020617";
            ctx.beginPath();
            ctx.arc(drX + 2, penY, 3, 0, Math.PI * 2);
            ctx.fill();

            const hX = rX + 110 + shake;
            const hY = rY + 30;

            ctx.strokeStyle = "#854d0e";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(rX + 85 + shake, hY + 30);
            ctx.lineTo(rX + 175 + shake, hY + 30);
            ctx.stroke();
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rX + 85 + shake, hY + 28);
            ctx.lineTo(rX + 175 + shake, hY + 28);
            ctx.stroke();

            if (mag >= 5.0) {
              ctx.strokeStyle = "#020617";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(rX + 125 + shake, hY + 29);
              ctx.lineTo(rX + 130 + shake + Math.sin(time * 30) * 2, hY + 42);
              ctx.lineTo(rX + 124 + shake, hY + 48);
              ctx.stroke();
            }

            const hW = 35;
            const hH = 30;
            const houseX = hX - hW / 2;
            const houseY = hY - hH + 28;

            ctx.fillStyle = "#334155";
            ctx.fillRect(houseX, houseY, hW, hH);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(houseX, houseY, hW, hH);

            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(houseX - 4, houseY);
            ctx.lineTo(houseX + hW / 2, houseY - 18);
            ctx.lineTo(houseX + hW + 4, houseY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = mag >= 6.0 && Math.sin(time * 40) > 0 ? "#fbbf24" : "#1e293b";
            ctx.fillRect(houseX + 8, houseY + 8, 8, 8);
            ctx.strokeRect(houseX + 8, houseY + 8, 8, 8);
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(houseX + 20, houseY + 14, 8, 16);
            ctx.strokeRect(houseX + 20, houseY + 14, 8, 16);

            const tX = hX + 35;
            const tY = hY + 28;
            ctx.fillStyle = "#78350f";
            ctx.fillRect(tX - 3, tY - 18, 6, 18);
            ctx.save();
            ctx.translate(tX, tY - 18);
            ctx.rotate(Math.sin(time * 25) * (mag * 0.04));
            ctx.fillStyle = "#15803d";
            ctx.beginPath();
            ctx.arc(0, -10, 14, 0, Math.PI * 2);
            ctx.arc(-8, -18, 11, 0, Math.PI * 2);
            ctx.arc(8, -18, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Scoreboard display
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(rX + 5, drY + drH + 16, 160, 52);
            ctx.strokeRect(rX + 5, drY + drH + 16, 160, 52);

            let earthDesc = "មីក្រូ (Micro / Tiny)";
            let earthColor = "#10b981";
            if (mag >= 7.0) {
              earthDesc = "មហន្តរាយ (Major / Destructive)";
              earthColor = "#ef4444";
            } else if (mag >= 5.0) {
              earthDesc = "រំញ័រខ្លាំង (Moderate / Cracked)";
              earthColor = "#f59e0b";
            } else if (mag >= 3.0) {
              earthDesc = "ស្រាលៗ (Minor / Light)";
              earthColor = "#38bdf8";
            }

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`រំញ័រ៖ `, rX + 15, drY + drH + 29);
            ctx.fillStyle = earthColor;
            ctx.fillText(earthDesc, rX + 45, drY + drH + 29);
            
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 10px monospace";
            ctx.fillText(`RICHTER SCALE: ${mag.toFixed(1)} M`, rX + 15, drY + drH + 45);
            ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
            ctx.font = "7px font-mono";
            ctx.fillText(`ENERGY RELEASE: ~10^${(1.5 * mag + 4.8).toFixed(1)} Joules`, rX + 15, drY + drH + 58);

          } else if (activeApp === "ph") {
            // pH = 7.0 - a * 3.0 * ln(c * H - b)
            const H_conc = 0.1 + 9.4 * (0.5 + 0.5 * Math.sin(time * 0.9));
            const arg = Math.max(0.1, c * H_conc - b);
            const pH_val = Math.min(14, Math.max(1, 7.0 - a * 3.0 * Math.log(arg)));

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Draw graph grids on the left
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            // Y Grid Lines (pH from 0 to 14)
            for (let i = 0; i <= 7; i++) {
              const gy = startY - (i / 7) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 2}`, startX - 22, gy + 3);
            }
            // X Grid Lines (H+ Concentration)
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${(i * 0.1).toFixed(1)}M`, gx - 10, startY + 14);
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
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("កម្រិត pH ទឹក vs កំហាប់អ៊ីយ៉ុង [H⁺] (moles/L)", startX, startY - graphH - 12);

            // Plot logarithmic curve (decreasing)
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 1; px <= graphW; px++) {
              const H_val = 0.1 + (px / graphW) * 10;
              const curArg = Math.max(0.1, c * H_val - b);
              const cur_pH = Math.min(14, Math.max(1, 7.0 - a * 3.0 * Math.log(curArg)));
              const cy = startY - (cur_pH / 14) * graphH;
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

            // Current state point
            const curCx = startX + (H_conc / 10) * graphW;
            const curCy = startY - (pH_val / 14) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`pH = ${pH_val.toFixed(1)}`, curCx + 8, curCy - 6);

            // --- DRAW LAB BEAKER & SOLUTION ON THE RIGHT ---
            const bX = width / 2 + 55;
            const bY = height / 2 - 25;
            const bW = 75;
            const bH = 90;

            let colorStr = "rgba(34, 197, 94, 0.7)";
            let borderStr = "#22c55e";
            let chemLabel = "ទឹកបរិសុទ្ធ (Pure Water)";

            if (pH_val < 3.5) {
              colorStr = "rgba(239, 68, 68, 0.7)";
              borderStr = "#ef4444";
              chemLabel = "អាស៊ីតអាគុយ (Battery Acid)";
            } else if (pH_val < 6.5) {
              colorStr = "rgba(249, 115, 22, 0.7)";
              borderStr = "#f97316";
              chemLabel = "ទឹកក្រូចឆ្មារ (Lemon Juice)";
            } else if (pH_val < 7.5) {
              colorStr = "rgba(16, 185, 129, 0.7)";
              borderStr = "#10b981";
              chemLabel = "ទឹកសុទ្ធ / ទឹកដោះគោ (Neutral)";
            } else if (pH_val < 10.5) {
              colorStr = "rgba(6, 182, 212, 0.7)";
              borderStr = "#06b6d4";
              chemLabel = "ទឹកសាប៊ូ (Soapy Water)";
            } else {
              colorStr = "rgba(168, 85, 247, 0.7)";
              borderStr = "#a855f7";
              chemLabel = "ទឹកសាវែល / បាសខ្លាំង (Bleach)";
            }

            const fillH = bH * 0.65;
            const liquidY = bY + bH - fillH;

            ctx.fillStyle = colorStr;
            ctx.beginPath();
            ctx.moveTo(bX + 1.5, liquidY);
            for (let xOffset = 0; xOffset <= bW - 3; xOffset++) {
              const waveY = liquidY + Math.sin(xOffset * 0.15 + time * 3) * 1.8;
              ctx.lineTo(bX + 1.5 + xOffset, waveY);
            }
            ctx.lineTo(bX + bW - 1.5, bY + bH - 1.5);
            ctx.lineTo(bX + 1.5, bY + bH - 1.5);
            ctx.closePath();
            ctx.fill();

            // Floating chemical bubbles
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            const numBubbles = 6;
            for (let bIdx = 0; bIdx < numBubbles; bIdx++) {
              const bubbleX = bX + 10 + ((bIdx * 12 + time * 6) % (bW - 20));
              const startRiseY = bY + bH - 5;
              const riseDist = ((bIdx * 15 + time * 12) % fillH);
              const bubbleY = startRiseY - riseDist;
              const bubbleR = 1.5 + (bIdx % 3);
              if (bubbleY > liquidY) {
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Beaker Outline
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(bX - 4, bY);
            ctx.lineTo(bX, bY);
            ctx.lineTo(bX, bY + bH);
            ctx.lineTo(bX + bW, bY + bH);
            ctx.lineTo(bX + bW, bY);
            ctx.lineTo(bX + bW + 4, bY);
            ctx.stroke();

            // Scale marks
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 1.2;
            for (let m = 1; m <= 4; m++) {
              const my = bY + bH - m * (bH / 5);
              ctx.beginPath();
              ctx.moveTo(bX, my);
              ctx.lineTo(bX + 10, my);
              ctx.stroke();
              ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
              ctx.font = "6px monospace";
              ctx.fillText(`${m * 50}ml`, bX + 12, my + 2);
            }

            // pH litmus paper strip
            const papX = bX + bW - 22;
            const papY = bY - 12;
            const papW = 8;
            const papH = 50;

            ctx.fillStyle = "#fef08a";
            ctx.fillRect(papX, papY, papW, liquidY - papY);
            ctx.fillStyle = borderStr;
            ctx.fillRect(papX, liquidY, papW, papH - (liquidY - papY));
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 1;
            ctx.strokeRect(papX, papY, papW, papH);

            // pH Meter device
            const tstX = bX + bW + 20;
            const tstY = bY + 10;
            ctx.fillStyle = "#1e293b";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(tstX, tstY, 48, 55);
            ctx.strokeRect(tstX, tstY, 48, 55);

            ctx.fillStyle = "#020617";
            ctx.fillRect(tstX + 4, tstY + 4, 40, 24);
            ctx.fillStyle = borderStr;
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.fillText(pH_val.toFixed(1), tstX + 24, tstY + 20);
            ctx.font = "5px font-mono";
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fillText("PH METER", tstX + 24, tstY + 11);
            ctx.textAlign = "left";

            ctx.fillStyle = borderStr;
            ctx.font = "bold 7px font-sans";
            ctx.fillText(pH_val < 6.8 ? "ACIDIC (អាស៊ីត)" : pH_val > 7.2 ? "ALKALINE (បាស)" : "NEUTRAL (ណឺត)", tstX + 2, tstY + 38);
            ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
            ctx.font = "6px font-mono";
            ctx.fillText(`[H⁺] = ${H_conc.toFixed(1)} mol/L`, tstX + 2, tstY + 48);

            // Label card
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1;
            ctx.fillRect(bX - 10, bY + bH + 12, bW + 48, 32);
            ctx.strokeRect(bX - 10, bY + bH + 12, bW + 48, 32);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 8.5px font-sans";
            ctx.fillText(`សូលុយស្យុង៖ ${chemLabel}`, bX - 5, bY + bH + 23);
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`pH MEASURED: ${pH_val.toFixed(1)}`, bX - 5, bY + bH + 37);
          }

        } else {
          // --- DRAW 2D LOGARITHMIC FUNCTION ---
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
        }

      } else if (state.mode === "exponential") {
        // --- DRAW 2D EXPONENTIAL FUNCTION OR ITS APPLICATIONS ---
        const P = state.paramA;
        const r = state.paramB;
        const offset = state.paramC;

        if (activeTab === "applications" && activeApp !== "none") {
          // ==================== EXPONENTIAL APPLICATIONS DRAWINGS ====================
          if (activeApp === "population") {
            // 1. Population Growth / Virus Spread Simulator
            const P0 = Math.max(1, P) * 10;
            const r_rate = r * 0.25;
            const t = time % 10;
            const N_t = P0 * Math.exp(r_rate * t);

            // Clear with deep space color
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Left side graph
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              // Y labels (Population count)
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              const maxPop = P0 * Math.exp(Math.max(0, r_rate) * 10);
              const yVal = (i / 5) * Math.max(100, maxPop);
              ctx.fillText(`${yVal.toFixed(0)}`, startX - 25, gy + 3);
            }
            for (let i = 0; i <= 10; i++) {
              const gx = startX + (i / 10) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              // X labels (Time in days/hours)
              if (i % 2 === 0) {
                ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
                ctx.font = "9px monospace";
                ctx.fillText(`${i}d`, gx - 5, startY + 14);
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

            // Graph Title
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("ចំនួនប្រជាជន/មេរោគ N(t) vs ពេលវេលា t (Days)", startX, startY - graphH - 12);

            // Plot Curve
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            const maxPop = P0 * Math.exp(Math.max(0, r_rate) * 10);
            const scaleFactorY = Math.max(100, maxPop);
            for (let px = 0; px <= graphW; px++) {
              const t_val = (px / graphW) * 10;
              const N_val = P0 * Math.exp(r_rate * t_val);
              const cy = startY - (N_val / scaleFactorY) * graphH;
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

            // Current state point
            const curCx = startX + (t / 10) * graphW;
            const curCy = startY - (N_t / scaleFactorY) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Current point label
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`N = ${N_t.toFixed(0)}`, curCx + 8, curCy - 6);

            // --- DRAW NETWORK INFRASTRUCTURE ON THE RIGHT ---
            const nX = width / 2 + 50;
            const nY = height / 2 - 50;
            const nW = 160;
            const nH = 120;

            // Shaded boundary box for the containment area
            ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
            ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(nX - 10, nY - 10, nW + 20, nH + 20);
            ctx.strokeRect(nX - 10, nY - 10, nW + 20, nH + 20);

            // Render a grid of cells/nodes spreading the virus
            const rows = 5;
            const cols = 6;
            const nodeSpacingX = nW / (cols - 1);
            const nodeSpacingY = nH / (rows - 1);
            
            // Total nodes in grid = 30. Ratio infected is based on N_t vs max possible.
            const totalNodes = rows * cols;
            const maxPossiblePop = P0 * Math.exp(Math.max(0.1, r_rate) * 10);
            const infectedRatio = Math.min(1.0, N_t / maxPossiblePop);
            const numInfected = Math.max(1, Math.floor(infectedRatio * totalNodes));

            const nodes: {x: number, y: number, infected: boolean}[] = [];
            for (let rIdx = 0; rIdx < rows; rIdx++) {
              for (let cIdx = 0; cIdx < cols; cIdx++) {
                nodes.push({
                  x: nX + cIdx * nodeSpacingX,
                  y: nY + rIdx * nodeSpacingY,
                  infected: false,
                });
              }
            }

            const centerX = nX + nW / 2;
            const centerY = nY + nH / 2;
            nodes.sort((a, b) => {
              const distA = Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2);
              const distB = Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2);
              return distA - distB;
            });

            for (let i = 0; i < totalNodes; i++) {
              nodes[i].infected = i < numInfected;
            }

            // Draw connector lines between infected nodes
            ctx.strokeStyle = "rgba(244, 63, 94, 0.15)";
            ctx.lineWidth = 1;
            for (let i = 0; i < totalNodes; i++) {
              if (nodes[i].infected) {
                for (let j = i + 1; j < totalNodes; j++) {
                  if (nodes[j].infected) {
                    const dist = Math.sqrt(Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2));
                    if (dist < 50) {
                      ctx.beginPath();
                      ctx.moveTo(nodes[i].x, nodes[i].y);
                      ctx.lineTo(nodes[j].x, nodes[j].y);
                      ctx.stroke();
                    }
                  }
                }
              }
            }

            // Draw individual nodes
            nodes.forEach((node) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.infected ? 5 : 3, 0, Math.PI * 2);
              
              if (node.infected) {
                const glow = 2 + 2 * Math.sin(time * 5 + node.x);
                ctx.fillStyle = r_rate > 0 ? "#f43f5e" : "#06b6d4";
                ctx.shadowColor = r_rate > 0 ? "#f43f5e" : "#06b6d4";
                ctx.shadowBlur = glow;
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.stroke();
              } else {
                ctx.fillStyle = "#475569";
                ctx.fill();
              }
            });

            // Scoreboard Summary
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(nX - 10, nY + nH + 18, nW + 20, 50);
            ctx.strokeRect(nX - 10, nY + nH + 18, nW + 20, 50);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`ពេលវេលា t៖ ${t.toFixed(1)} ថ្ងៃ (Days)`, nX, nY + nH + 30);
            ctx.fillText(`អត្រាកំណើន (r)៖ ${(r_rate * 100).toFixed(1)}% /ថ្ងៃ`, nX, nY + nH + 42);
            ctx.fillStyle = r_rate > 0 ? "#f43f5e" : "#10b981";
            ctx.fillText(`ចំនួនបច្ចុប្បន្ន (N)៖ ${N_t.toFixed(0)} នាក់`, nX, nY + nH + 56);

          } else if (activeApp === "interest") {
            // 2. Compound Interest & Investment
            const P0 = Math.max(0.5, P) * 1000;
            const r_rate = r * 0.12;
            const t = (time * 1.5) % 20;
            const A_t = P0 * Math.exp(r_rate * t);

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Left side graph
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 55;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              const maxAmt = P0 * Math.exp(Math.max(0.01, r_rate) * 20);
              const yVal = (i / 5) * Math.max(2000, maxAmt);
              ctx.fillText(`$${yVal.toFixed(0)}`, startX - 32, gy + 3);
            }
            for (let i = 0; i <= 20; i += 4) {
              const gx = startX + (i / 20) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i}y`, gx - 5, startY + 14);
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

            // Graph Title
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("សមតុល្យគណនី A(t) vs រយៈពេល t (Years)", startX, startY - graphH - 12);

            // Plot Curve
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            const maxAmt = P0 * Math.exp(Math.max(0.01, r_rate) * 20);
            const scaleFactorY = Math.max(2000, maxAmt);
            for (let px = 0; px <= graphW; px++) {
              const t_val = (px / graphW) * 20;
              const A_val = P0 * Math.exp(r_rate * t_val);
              const cy = startY - (A_val / scaleFactorY) * graphH;
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

            // Current year point
            const curCx = startX + (t / 20) * graphW;
            const curCy = startY - (A_t / scaleFactorY) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`$${A_t.toFixed(0)}`, curCx + 8, curCy - 6);

            // --- DRAW MONEY/COINS PILE ON THE RIGHT ---
            const rX = width / 2 + 50;
            const rY = height / 2 - 40;
            const rW = 160;
            const rH = 100;

            ctx.strokeStyle = "rgba(251, 191, 36, 0.1)";
            ctx.lineWidth = 1;
            ctx.strokeRect(rX - 10, rY - 10, rW + 20, rH + 20);

            ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
            ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rX + rW/2, rY + rH/2, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#020617";
            ctx.fillRect(rX + rW/2 - 12, rY + rH/2 - 20, 24, 6);

            const maxCoins = 24;
            const coinsRatio = (A_t - P0) / (scaleFactorY - P0 || 1);
            const numCoins = Math.min(maxCoins, 3 + Math.floor(coinsRatio * (maxCoins - 3)));

            ctx.fillStyle = "#f59e0b";
            ctx.strokeStyle = "#78350f";
            ctx.lineWidth = 1;

            const drawCoinStack = (cx: number, cy: number, count: number) => {
              for (let i = 0; i < count; i++) {
                const coinY = cy - i * 4;
                ctx.beginPath();
                ctx.ellipse(cx, coinY, 15, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              }
            };

            drawCoinStack(rX + 20, rY + rH - 10, Math.min(8, numCoins));
            drawCoinStack(rX + rW - 20, rY + rH - 10, Math.max(1, Math.min(10, numCoins - 5)));
            drawCoinStack(rX + rW/2, rY + rH - 5, Math.max(0, Math.min(6, numCoins - 15)));

            ctx.fillStyle = "#fbbf24";
            for (let i = 0; i < 3; i++) {
              const animT = (time * 0.8 + i * 0.3) % 1.0;
              const coinX = rX + rW/2 + Math.sin(time * 2 + i) * 10;
              const coinY = rY + rH - 5 - animT * 55;
              
              if (coinY > rY + rH/2 - 15) {
                ctx.beginPath();
                ctx.arc(coinX, coinY, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Ledger Scoreboard
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(rX - 10, rY + rH + 18, rW + 20, 52);
            ctx.strokeRect(rX - 10, rY + rH + 18, rW + 20, 52);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`រយៈពេល t៖ ${t.toFixed(1)} ឆ្នាំ (Years)`, rX, rY + rH + 28);
            ctx.fillText(`អត្រាការប្រាក់ r៖ ${(r_rate * 100).toFixed(1)}% /ឆ្នាំ`, rX, rY + rH + 40);
            ctx.fillStyle = "#22c55e";
            ctx.fillText(`សមតុល្យសរុប A៖ $${A_t.toFixed(0)}`, rX, rY + rH + 54);

          } else if (activeApp === "decay") {
            // 3. Radioactive Decay & Fossil Dating
            const N0 = Math.max(0.5, P) * 100;
            const k = Math.max(0.15, Math.abs(r)) * 0.3;
            const t = (time * 1.5) % 20;
            const N_t = N0 * Math.exp(-k * t);
            const halfLife = Math.log(2) / k;

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, width, height);

            // Left side graph
            const graphW = width / 2 - 30;
            const graphH = height - 100;
            const startX = 50;
            const startY = height - 60;

            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
              const gy = startY - (i / 5) * graphH;
              ctx.beginPath();
              ctx.moveTo(startX, gy);
              ctx.lineTo(startX + graphW, gy);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i * 20}%`, startX - 28, gy + 3);
            }
            for (let i = 0; i <= 20; i += 4) {
              const gx = startX + (i / 20) * graphW;
              ctx.beginPath();
              ctx.moveTo(gx, startY);
              ctx.lineTo(gx, startY - graphH);
              ctx.stroke();
              ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
              ctx.font = "9px monospace";
              ctx.fillText(`${i}ky`, gx - 5, startY + 14);
            }

            const hlX = startX + (halfLife / 20) * graphW;
            if (hlX <= startX + graphW) {
              ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(hlX, startY);
              ctx.lineTo(hlX, startY - graphH);
              ctx.stroke();
              ctx.setLineDash([]);
              
              ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
              ctx.font = "8px font-mono";
              ctx.fillText(`T1/2 = ${halfLife.toFixed(1)}ky`, hlX + 3, startY - graphH + 12);
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

            // Graph Title
            ctx.fillStyle = "#f43f5e";
            ctx.font = "bold 10px font-sans";
            ctx.fillText("ភាគរយវិទ្យុសកម្ម N(t)% vs អាយុកាល t (Kiloyears)", startX, startY - graphH - 12);

            // Plot Curve
            ctx.strokeStyle = "#f43f5e";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let firstPt = true;
            for (let px = 0; px <= graphW; px++) {
              const t_val = (px / graphW) * 20;
              const N_val = N0 * Math.exp(-k * t_val);
              const cy = startY - (N_val / N0) * graphH;
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

            // Current state point
            const curCx = startX + (t / 20) * graphW;
            const curCy = startY - (N_t / N0) * graphH;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(curCx, curCy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`${(N_t / N0 * 100).toFixed(0)}%`, curCx + 8, curCy - 6);

            // --- DRAW DINOSAUR BONE / FOSSIL ON THE RIGHT ---
            const fX = width / 2 + 50;
            const fY = height / 2 - 40;
            const fW = 160;
            const fH = 100;

            ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            
            const bX = fX + fW / 2;
            const bY = fY + fH / 2;
            ctx.beginPath();
            ctx.moveTo(bX - 50, bY - 8);
            ctx.bezierCurveTo(bX - 65, bY - 30, bX - 80, bY - 10, bX - 70, bY);
            ctx.bezierCurveTo(bX - 80, bY + 10, bX - 65, bY + 30, bX - 50, bY + 8);
            ctx.lineTo(bX + 50, bY + 8);
            ctx.bezierCurveTo(bX + 65, bY + 30, bX + 80, bY + 10, bX + 70, bY);
            ctx.bezierCurveTo(bX + 80, bY - 10, bX + 65, bY - 30, bX + 50, bY - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const totalAtoms = 40;
            const numActive = Math.max(1, Math.floor((N_t / N0) * totalAtoms));

            for (let i = 0; i < totalAtoms; i++) {
              const angle = (i / totalAtoms) * Math.PI * 2;
              const seedDist = 15 + (i * 7) % 40;
              let ax = bX + Math.cos(angle) * seedDist * 1.3;
              let ay = bY + Math.sin(angle) * seedDist * 0.4;

              const isActive = i < numActive;

              ctx.beginPath();
              ctx.arc(ax, ay, isActive ? 3.5 : 2.5, 0, Math.PI * 2);
              if (isActive) {
                ctx.fillStyle = "#10b981";
                ctx.fill();
                
                if (i === Math.floor(time * 3) % totalAtoms) {
                  ctx.fillStyle = "#38bdf8";
                  ctx.beginPath();
                  ctx.arc(ax + Math.cos(time * 4) * 8, ay + Math.sin(time * 4) * 8, 2, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else {
                ctx.fillStyle = "#475569";
                ctx.fill();
              }
            }

            // Detector Panel Scoreboard
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(fX - 10, fY + fH + 18, fW + 20, 52);
            ctx.strokeRect(fX - 10, fY + fH + 18, fW + 20, 52);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(`អាយុកាលផូស៊ីល t៖ ${t.toFixed(1)} ពាន់ឆ្នាំ (ky)`, fX, fY + fH + 28);
            ctx.fillText(`ពាក់កណ្តាលជីវិត T1/2៖ ${halfLife.toFixed(1)} ពាន់ឆ្នាំ`, fX, fY + fH + 40);
            ctx.fillStyle = "#ef4444";
            ctx.fillText(`ម៉ាស់កាបូន C-14 នៅសល់៖ ${(N_t / N0 * 100).toFixed(1)}%`, fX, fY + fH + 54);
          }
        } else {
          // --- STANDARD MATH GRAPH AND STEP-BY-STEP HIGHLIGHTS ---
          ctx.strokeStyle = selectedStep === 3 ? "rgba(239, 68, 68, 0.95)" : "rgba(239, 68, 68, 0.65)";
          ctx.lineWidth = selectedStep === 3 ? 2.5 : 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          const asympY = toCanvasY(offset);
          ctx.moveTo(0, asympY);
          ctx.lineTo(width, asympY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`Horizontal Asymptote: y = ${offset.toFixed(1)}`, 20, asympY - 8);

          if (selectedStep === 4) {
            ctx.fillStyle = P > 0 ? "rgba(16, 185, 129, 0.04)" : "rgba(239, 68, 68, 0.04)";
            if (P > 0) {
              ctx.fillRect(0, 0, width, asympY);
            } else {
              ctx.fillRect(0, asympY, width, height - asympY);
            }
            
            ctx.fillStyle = P > 0 ? "#10b981" : "#ef4444";
            ctx.font = "bold 9px font-sans";
            ctx.fillText(
              P > 0 
                ? `Range: y ∈ (${offset.toFixed(1)}, +∞)` 
                : `Range: y ∈ (-∞, ${offset.toFixed(1)})`, 
              20, 
              P > 0 ? asympY - 24 : asympY + 24
            );
          }

          ctx.beginPath();
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = selectedStep === 3 ? 4.5 : 3.5;

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

          const interceptY = P + offset;
          const cx = toCanvasX(0);
          const cy = toCanvasY(interceptY);
          if (cy >= 0 && cy <= height) {
            const isHighlighted = selectedStep === 1;
            ctx.fillStyle = isHighlighted ? "#fbbf24" : "rgba(251, 191, 36, 0.85)";
            ctx.beginPath();
            ctx.arc(cx, cy, isHighlighted ? 8 : 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#020617";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 10px font-mono";
            ctx.fillText(`(0, ${interceptY.toFixed(1)})`, cx + 12, cy - 6);
          }

          const tX = 1.0;
          const tY = P * Math.exp(r * tX) + offset;
          const slope = P * r * Math.exp(r * tX);
          const tCx = toCanvasX(tX);
          const tCy = toCanvasY(tY);

          if (tCy >= 0 && tCy <= height) {
            const isHighlighted = selectedStep === 1;
            ctx.fillStyle = isHighlighted ? "#22d3ee" : "#a7f3d0";
            ctx.beginPath();
            ctx.arc(tCx, tCy, isHighlighted ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isHighlighted ? "rgba(34, 211, 238, 0.7)" : "rgba(52, 211, 153, 0.4)";
            ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.moveTo(toCanvasX(tX - 1.5), toCanvasY(tY - slope * 1.5));
            ctx.lineTo(toCanvasX(tX + 1.5), toCanvasY(tY + slope * 1.5));
            ctx.stroke();

            ctx.fillStyle = isHighlighted ? "#22d3ee" : "#a7f3d0";
            ctx.font = "10px font-mono";
            ctx.fillText(`f'(x) = ${slope.toFixed(2)}`, tCx + 12, tCy + 10);
            
            if (isHighlighted) {
              ctx.fillText(`(1, ${(tY).toFixed(1)})`, tCx + 12, tCy - 6);
            }
          }

          if (selectedStep === 2) {
            const direction = r > 0 ? 1 : -1;
            const numArrows = 4;
            ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
            
            for (let i = 0; i < numArrows; i++) {
              const animT = ((i / numArrows) + time * 0.12) % 1.0;
              const xVal = -4.0 + animT * 8.0;
              const yVal = P * Math.exp(r * xVal) + offset;
              const c_x = toCanvasX(xVal);
              const c_y = toCanvasY(yVal);

              if (c_y >= 0 && c_y <= height) {
                ctx.beginPath();
                ctx.arc(c_x, c_y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = "12px font-sans font-bold";
                ctx.fillText(direction > 0 ? "↗" : "↘", c_x - 4, c_y + 14);
              }
            }
          }
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
          {state.mode === "rational" || state.mode === "exponential" || state.mode === "logarithmic" ? (
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
                  onClick={() => { setActiveTab("applications"); setActiveApp(state.mode === "rational" ? "circuit" : state.mode === "logarithmic" ? "sound" : "population"); }}
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
                      {state.mode === "rational" 
                        ? "ជំហានវិភាគអនុគមន៍សនិទាន (Analysis Steps)" 
                        : state.mode === "logarithmic"
                        ? "ជំហានវិភាគអនុគមន៍លោការីត (Analysis Steps)"
                        : "ជំហានវិភាគអនុគមន៍ស្វ័យគុណ (Analysis Steps)"}
                    </div>
                    {(state.mode === "rational" ? [
                      { step: 0, label: "១. រកដែនកំណត់អនុគមន៍", sub: "Domain: D = R \\ {b}" },
                      { step: 1, label: "២. គណនាដេរីវេ f'(x)", sub: "Derivative & Monotonicity" },
                      { step: 2, label: "៣. សង់តារាងអថេរភាព", sub: "Variation Table & Direction" },
                      { step: 3, label: "៤. រកអាស៊ីមតូតឈរ & ដេក", sub: "Asymptotes: x = b, y = c" },
                      { step: 4, label: "៥. សង់ក្រាប និងផ្ចិតឆ្លុះ", sub: "Symmetry Center I(b, c)" }
                    ] : state.mode === "logarithmic" ? [
                      { step: 0, label: "១. រកដែនកំណត់អនុគមន៍", sub: "Domain: D = (b/c, +∞)" },
                      { step: 1, label: "២. គណនាដេរីវេ និងចំណុចឆ្លងកាត់", sub: "Derivative & Intercept" },
                      { step: 2, label: "៣. តារាងអថេរភាពឌីណាមិក", sub: "Variation & Direction" },
                      { step: 3, label: "៤. រកអាស៊ីមតូតឈរ", sub: "Asymptote: x = b/c" },
                      { step: 4, label: "៥. សិក្សាលីមីតចុងដែន", sub: "Limit at Boundary: -∞ or +∞" }
                    ] : [
                      { step: 0, label: "១. រកដែនកំណត់អនុគមន៍", sub: "Domain: D = R" },
                      { step: 1, label: "២. គណនាដេរីវេ និងចំណុចឆ្លងកាត់", sub: "Derivative & Intercept" },
                      { step: 2, label: "៣. តារាងអថេរភាពឌីណាមិក", sub: "Variation & Direction" },
                      { step: 3, label: "៤. រកអាស៊ីមតូតដេក", sub: "Asymptote: y = offset" },
                      { step: 4, label: "៥. សិក្សាដែនតម្លៃ (Range)", sub: "Range: (offset, +∞)" }
                    ]).map((s) => (
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
                          {state.mode === "rational" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              អនុគមន៍សនិទាន <span className="font-mono text-purple-400">y = a / (x - b) + c</span> មានន័យលុះត្រាតែភាគបែងខុសពីសូន្យ៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">x - b ≠ 0 ⟹ x ≠ {state.paramB.toFixed(1)}</span>
                              ដូចនេះដែនកំណត់គឺ <span className="font-mono text-purple-300">D = R \ {"{"}{state.paramB.toFixed(1)}{"}"}</span>។ នៅត្រង់ចំណុចនេះ ខ្សែកោងនឹងដាច់ជាពីរផ្នែក ដាច់ដោយអ័ក្សឈរ។
                            </p>
                          ) : state.mode === "logarithmic" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              អនុគមន៍លោការីត <span className="font-mono text-purple-400">y = a · ln(c·x - b)</span> មានន័យលុះត្រាតែកន្សោមក្នុងលោការីតវិជ្ជមានដាច់ខាត៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">c·x - b &gt; 0 ⟹ x &gt; b/c ⟹ x &gt; {(state.paramB / state.paramC).toFixed(2)}</span>
                              ដូចនេះដែនកំណត់គឺ <span className="font-mono text-purple-300">D = ({(state.paramB / state.paramC).toFixed(2)}, +∞)</span>។ ខ្សែកោងកំណត់បានតែផ្នែកខាងស្តាំនៃបន្ទាត់ឈរអាស៊ីមតូតឈរ x = b/c តែប៉ុណ្ណោះ!
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              អនុគមន៍ស្វ័យគុណ <span className="font-mono text-purple-400">y = a · e^(b·x) + c</span> កំណត់ចំពោះគ្រប់តម្លៃពិត <span className="font-mono text-cyan-300">x</span>។
                              <br />
                              ដូចនេះដែនកំណត់គឺ <span className="font-mono text-purple-300">D = R = (-∞, +∞)</span>។ គ្មានតម្លៃហាមឃាត់ ឬចំណុចដាច់នៃក្រាបនោះទេ ខ្សែកោងមានភាពជាប់ជានិច្ចនៅគ្រប់ចំណុច!
                            </p>
                          )}
                        </div>
                      )}

                      {selectedStep === 1 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {state.mode === "rational" 
                              ? "ជំហានទី ២៖ ដេរីវេ និងទិសដៅអថេរភាព (Derivative)" 
                              : state.mode === "logarithmic"
                              ? "ជំហានទី ២៖ ដេរីវេ និងចំណុចប្រសព្វអ័ក្ស (Derivative & Intercept)"
                              : "ជំហានទី ២៖ ដេរីវេ និងចំណុចប្រសព្វ (Derivative & Intercept)"}
                          </div>
                          {state.mode === "rational" ? (
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
                          ) : state.mode === "logarithmic" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              គណនាដេរីវេទី១៖ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y' = a · c / (c·x - b)</span>។
                              <br />
                              ចំពោះគ្រប់ <span className="font-mono">x ∈ D</span> យើងមាន <span className="font-mono">c·x - b &gt; 0</span> ជានិច្ច ដូចនេះសញ្ញា <span className="font-mono">y'</span> អាស្រ័យលើមេគុណ <span className="font-mono">a · c</span>៖
                              <br />
                              <span className="text-[11px] text-emerald-400 font-semibold block my-1">
                                {state.paramA * state.paramC > 0 
                                  ? `✓ ព្រោះ a·c = ${(state.paramA * state.paramC).toFixed(2)} > 0 ⟹ y' > 0 (អនុគមន៍កើនដាច់ខាតលើ D)`
                                  : `✓ ព្រោះ a·c = ${(state.paramA * state.paramC).toFixed(2)} < 0 ⟹ y' < 0 (អនុគមន៍ចុះដាច់ខាតលើ D)`
                                }
                              </span>
                              ចំណុចប្រសព្វអ័ក្សអាប់ស៊ីស (x-intercept) នៅពេល <span className="font-mono">y = 0</span>៖
                              <br />
                              <span className="font-mono text-yellow-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">ln(c·x - b) = 0 ⟹ c·x - b = 1 ⟹ x = (b + 1)/c = {((state.paramB + 1.0) / state.paramC).toFixed(2)}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              គណនាដេរីវេទី១៖ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y' = a · b · e^(b·x)</span>។ ដោយសារ <span className="font-mono">e^(b·x) &gt; 0</span> ជានិច្ច៖
                              <br />
                              <span className="text-[11px] text-emerald-400 font-semibold block my-1">
                                {state.paramA * state.paramB > 0 
                                  ? `✓ ព្រោះ a·b = ${(state.paramA * state.paramB).toFixed(2)} > 0 ⟹ y' > 0 (អនុគមន៍កើនដាច់ខាត)`
                                  : `✓ ព្រោះ a·b = ${(state.paramA * state.paramB).toFixed(2)} < 0 ⟹ y' < 0 (អនុគមន៍ចុះដាច់ខាត)`
                                }
                              </span>
                              ចំណុចប្រសព្វអ័ក្សអរដោនេ (y-intercept) នៅពេល <span className="font-mono">x = 0</span> គឺ៖
                              <br />
                              <span className="font-mono text-yellow-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">y(0) = a · e⁰ + c = a + c = {(state.paramA + state.paramC).toFixed(2)}</span>
                            </p>
                          )}
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
                          {state.mode === "rational" ? (
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
                          ) : state.mode === "logarithmic" ? (
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900 mt-1">
                              <div className="grid grid-cols-4 border-b border-white/5 text-[10px] font-bold text-slate-400 bg-slate-950/60">
                                <div className="p-1.5 border-r border-white/10 text-center col-span-1">x</div>
                                <div className="p-1.5 border-r border-white/10 text-center text-red-400">{(state.paramB / state.paramC).toFixed(1)}</div>
                                <div className="p-1.5 border-r border-white/10 text-center">+∞</div>
                                <div className="p-1.5 text-center">សញ្ញា / ភាពកើនចុះ</div>
                              </div>
                              
                              <div className="grid grid-cols-4 border-b border-white/5 text-[10px] font-mono text-slate-300">
                                <div className="p-1.5 border-r border-white/10 text-center bg-slate-950/20 font-bold">f'(x)</div>
                                <div className="p-1.5 border-r border-white/10 text-center text-cyan-400">{state.paramA * state.paramC > 0 ? "+" : "-"}</div>
                                <div className="p-1.5 border-r border-white/10 text-center text-red-400 font-bold font-sans">||</div>
                                <div className="p-1.5 text-center text-slate-500 font-sans">{state.paramA * state.paramC > 0 ? "កើន (Inc)" : "ចុះ (Dec)"}</div>
                              </div>

                              <div className="grid grid-cols-4 text-[10px] font-mono text-slate-300 min-h-[44px]">
                                <div className="p-2 border-r border-white/10 text-center bg-slate-950/20 font-bold flex items-center justify-center">f(x)</div>
                                <div className="p-2 border-r border-white/10 text-center text-red-400 flex items-center justify-center font-bold font-sans">||</div>
                                {state.paramA * state.paramC > 0 ? (
                                  <>
                                    <div className="p-2 border-r border-white/10 flex flex-col justify-center items-center text-center">
                                      <span className="text-red-400 text-[8px]">-∞</span>
                                      <span className="text-purple-400 text-xs font-sans">↗</span>
                                    </div>
                                    <div className="p-2 text-center flex flex-col justify-center items-center">
                                      <span className="text-red-400 text-[8px]">+∞</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="p-2 border-r border-white/10 flex flex-col justify-center items-center text-center">
                                      <span className="text-red-400 text-[8px]">+∞</span>
                                      <span className="text-purple-400 text-xs font-sans">↘</span>
                                    </div>
                                    <div className="p-2 text-center flex flex-col justify-center items-center">
                                      <span className="text-red-400 text-[8px]">-∞</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900 mt-1">
                              <div className="grid grid-cols-4 border-b border-white/5 text-[10px] font-bold text-slate-400 bg-slate-950/60">
                                <div className="p-1.5 border-r border-white/10 text-center col-span-1">x</div>
                                <div className="p-1.5 border-r border-white/10 text-center">-∞</div>
                                <div className="p-1.5 border-r border-white/10 text-center">+∞</div>
                                <div className="p-1.5 text-center">សញ្ញា / ភាពកើនចុះ</div>
                              </div>
                              
                              <div className="grid grid-cols-4 border-b border-white/5 text-[10px] font-mono text-slate-300">
                                <div className="p-1.5 border-r border-white/10 text-center bg-slate-950/20 font-bold">f'(x)</div>
                                <div className="p-1.5 border-r border-white/10 text-center text-cyan-400 col-span-2">{state.paramA * state.paramB > 0 ? "+" : "-"}</div>
                                <div className="p-1.5 text-center text-slate-500 font-sans">{state.paramA * state.paramB > 0 ? "វិជ្ជមាន (កើន)" : "អវិជ្ជមាន (ចុះ)"}</div>
                              </div>

                              <div className="grid grid-cols-4 text-[10px] font-mono text-slate-300 min-h-[44px]">
                                <div className="p-2 border-r border-white/10 text-center bg-slate-950/20 font-bold flex items-center justify-center">f(x)</div>
                                {state.paramA * state.paramB > 0 ? (
                                  <>
                                    <div className="p-2 border-r border-white/10 text-center flex flex-col justify-center">
                                      <span className="text-[9px] text-slate-500">{state.paramB > 0 ? `${state.paramC.toFixed(1)}` : "+∞"}</span>
                                    </div>
                                    <div className="p-2 border-r border-white/10 text-center flex flex-col justify-center">
                                      <span className="text-purple-400 text-xs font-sans">↗</span>
                                    </div>
                                    <div className="p-2 text-center flex flex-col justify-center">
                                      <span className="text-[9px] text-slate-500">{state.paramB > 0 ? "+∞" : `${state.paramC.toFixed(1)}`}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="p-2 border-r border-white/10 text-center flex flex-col justify-center">
                                      <span className="text-[9px] text-slate-500">{state.paramB > 0 ? "+∞" : `${state.paramC.toFixed(1)}`}</span>
                                    </div>
                                    <div className="p-2 border-r border-white/10 text-center flex flex-col justify-center">
                                      <span className="text-purple-400 text-xs font-sans">↘</span>
                                    </div>
                                    <div className="p-2 text-center flex flex-col justify-center">
                                      <span className="text-[9px] text-slate-500">{state.paramB > 0 ? `${state.paramC.toFixed(1)}` : "+∞"}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedStep === 3 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            {state.mode === "rational" 
                              ? "ជំហានទី ៤៖ អាស៊ីមតូតឈរ និងអាស៊ីមតូតដេក (Asymptotes)" 
                              : state.mode === "logarithmic"
                              ? "ជំហានទី ៤៖ អាស៊ីមតូតឈរ (Vertical Asymptote)"
                              : "ជំហានទី ៤៖ អាស៊ីមតូតដេក (Horizontal Asymptote)"}
                          </div>
                          {state.mode === "rational" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              អាស៊ីមតូតគឺជាបន្ទាត់ដែលក្រាបខិតជិតបំផុតនៅពេលអថេរ ឬអនុគមន៍ខិតជិតអនន្ត៖
                              <br />
                              • <span className="font-bold text-yellow-300">អាស៊ីមតូតឈរ (Vertical Asymptote)៖</span> គឺបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">x = {state.paramB.toFixed(1)}</span> (ដោយសារ <span className="font-mono text-[10px]">lim(x→b) f(x) = ±∞</span>)
                              <br />
                              • <span className="font-bold text-yellow-300">អាស៊ីមតូតដេក (Horizontal Asymptote)៖</span> គឺបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y = {state.paramC.toFixed(1)}</span> (防សារ <span className="font-mono text-[10px]">lim(x→±∞) f(x) = c</span>)
                            </p>
                          ) : state.mode === "logarithmic" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              ខ្សែកោងលោការីតខិតជិតបន្ទាត់ឈរនៅជិតដែនកំណត់របស់វា៖
                              <br />
                              • <span className="font-bold text-yellow-300">អាស៊ីមតូតឈរ (Vertical Asymptote)៖</span> គឺបន្ទាត់ឈរ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">x = b/c = {(state.paramB / state.paramC).toFixed(2)}</span>។
                              <br />
                              នៅពេល <span className="font-mono">x → (b/c)⁺</span> នោះតម្លៃ <span className="font-mono">c·x - b → 0⁺</span> នាំឲ្យ <span className="font-mono">ln(c·x - b) → -∞</span>។ ដូចនេះក្រាបខិតចុះក្រោមយ៉ាងខ្លាំង ឬឡើងលើអាស្រ័យលើសញ្ញាមេគុណ <span className="font-mono">a</span>!
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              នៅពេលអថេរ <span className="font-mono">x</span> ខិតជិតអនន្ត តម្លៃនៃតួស្វ័យគុណខិតជិតសូន្យ៖
                              <br />
                              • {state.paramB > 0 ? (
                                <>
                                  <span className="font-bold text-yellow-300">លីមីតខាងឆ្វេង៖</span> ព្រោះ <span className="font-mono">b = {state.paramB.toFixed(1)} &gt; 0</span> នាំឲ្យ <span className="font-mono">lim(x→-∞) a·e^(b·x) = 0</span>។ ដូចនេះបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y = {state.paramC.toFixed(1)}</span> ជាអាស៊ីមតូតដេកខាងឆ្វេង។
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-yellow-300">លីមីតខាងស្តាំ៖</span> ព្រោះ <span className="font-mono">b = {state.paramB.toFixed(1)} &lt; 0</span> នាំឲ្យ <span className="font-mono">lim(x→+∞) a·e^(b·x) = 0</span>។ ដូចនេះបន្ទាត់ <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">y = {state.paramC.toFixed(1)}</span> ជាអាស៊ីមតូតដេកខាងស្តាំ។
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedStep === 4 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {state.mode === "rational" 
                              ? "ជំហានទី ៥៖ ចំណុចឆ្លុះ និងផ្ចិតឆ្លុះ (Symmetry & Graphing)" 
                              : state.mode === "logarithmic"
                              ? "ជំហានទី ៥៖ សិក្សាលីមីតចុងដែនកំណត់ (Limits at Boundary)"
                              : "ជំហានទី ៥៖ សិក្សាដែនតម្លៃ (Range of Function)"}
                          </div>
                          {state.mode === "rational" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              ចំណុចប្រសព្វរវាងអាស៊ីមតូតទាំងពីរ <span className="font-mono text-yellow-300">I(b, c) = I({state.paramB.toFixed(1)}, {state.paramC.toFixed(1)})</span> គឺជា <span className="font-bold text-purple-300">ផ្ចិតឆ្លុះ (Symmetry Center)</span> នៃអ៊ីពែបូល។
                              <br />
                              រូបមន្តផ្ចិតឆ្លុះ៖ ចំពោះគ្រប់ <span className="font-mono text-[10px]">x</span> នៅក្នុងដែនកំណត់ ត្រូវតែផ្ទៀងផ្ទាត់៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">f(2b - x) + f(x) = 2c</span>
                              នៅលើក្រាប ២ឌី យើងបានបង្ហាញចំណុចឆ្លុះគ្នាចំនួនពីរ <span className="text-rose-400 font-semibold">M1</span> និង <span className="text-rose-400 font-semibold">M2</span> ដែលឆ្លុះគ្នាចំពោះផ្ចិត <span className="text-amber-400 font-semibold">I</span> ជានិច្ច!
                            </p>
                          ) : state.mode === "logarithmic" ? (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              នៅពេល <span className="font-mono">x</span> ខិតជិតរកអនន្ត (<span className="font-mono">x → +∞</span>) តម្លៃលោការីតកើនឡើងយ៉ាងសន្សឹមៗ៖
                              <br />
                              • <span className="font-bold text-yellow-300">លីមីតខាងស្តាំ៖</span> <span className="font-mono text-cyan-300 bg-white/5 px-1 rounded">lim(x→+∞) a · ln(c·x - b) = {state.paramA > 0 ? "+∞" : "-∞"}</span>។
                              <br />
                              ទោះបីជាលោការីតកើនឡើងយឺតខ្លាំងក៏ដោយ ក៏វាគ្មានដែនកំណត់ខាងលើឡើយ។ ដូចនេះដែនតម្លៃ (Range) នៃអនុគមន៍លោការីតគឺ <span className="font-mono text-purple-300">R = (-∞, +∞)</span> ជានិច្ច!
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              ដោយសារ <span className="font-mono">e^(b·x) &gt; 0</span> ជានិច្ចចំពោះគ្រប់តម្លៃ <span className="font-mono">x</span>៖
                              <br />
                              {state.paramA > 0 ? (
                                <>
                                  • <span className="font-bold text-yellow-300">ដែនតម្លៃ៖</span> ព្រោះ <span className="font-mono">a = {state.paramA.toFixed(1)} &gt; 0</span> នាំឲ្យ <span className="font-mono">y &gt; {state.paramC.toFixed(1)}</span>។ ដូចនេះដែនតម្លៃគឺ <span className="font-mono text-cyan-300">y ∈ ({state.paramC.toFixed(1)}, +∞)</span>។ ក្រាបទាំងមូលស្ថិតនៅពីលើបន្ទាត់អាស៊ីមតូតដេកជានិច្ច!
                                </>
                              ) : (
                                <>
                                  • <span className="font-bold text-yellow-300">ដែនតម្លៃ៖</span> ព្រោះ <span className="font-mono">a = {state.paramA.toFixed(1)} &lt; 0</span> នាំឲ្យ <span className="font-mono">y &lt; {state.paramC.toFixed(1)}</span>។ ដូចនេះដែនតម្លៃគឺ <span className="font-mono text-cyan-300">y ∈ (-∞, {state.paramC.toFixed(1)})</span>។ ក្រាបទាំងមូលស្ថិតនៅពីក្រោមបន្ទាត់អាស៊ីមតូតដេកជានិច្ច!
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick mathematical facts */}
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] text-slate-400 flex justify-between items-center font-mono">
                      <span>
                        {state.mode === "rational" 
                          ? `Equation: y = ${state.paramA.toFixed(1)} / (x - ${state.paramB.toFixed(1)}) + ${state.paramC.toFixed(1)}`
                          : state.mode === "logarithmic"
                          ? `Equation: y = ${state.paramA.toFixed(1)} * ln(${state.paramC.toFixed(1)} * x - ${state.paramB.toFixed(1)})`
                          : `Equation: y = ${state.paramA.toFixed(1)} * e^(${state.paramB.toFixed(1)} * x) + ${state.paramC.toFixed(1)}`
                        }
                      </span>
                      <span className="text-purple-300">
                        {state.mode === "rational" 
                          ? "Hyperbola shape" 
                          : state.mode === "logarithmic"
                          ? "Logarithmic Curve"
                          : "Exponential Curve"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Selectors for three micro-simulators */}
                  {state.mode === "rational" ? (
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
                  ) : state.mode === "logarithmic" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveApp("sound")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "sound"
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold">១. កម្រិតសំឡេង (Decibel Level)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">រង្វាស់កម្រិតសម្ពាធសំឡេងគិតជាដេស៊ីបែល (dB) តាមលក្ខណៈលោការីត។</p>
                      </button>

                      <button
                        onClick={() => setActiveApp("richter")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "richter"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Activity className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold">២. មាត្រដ្ឋានរិកទ័រ (Richter Scale)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">វាស់ទំហំថាមពលនៃការរញ្ជួយដី ក្នុងនោះ១ឯកតាកើនឡើង១០ដងនៃទំហំអំព្លីទុយត។</p>
                      </button>

                      <button
                        onClick={() => setActiveApp("ph")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "ph"
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <FlaskConical className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold">៣. សន្ទស្សន៍អាស៊ីត-បាស (pH Value)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">គីមីវិទ្យា៖ វាស់កំហាប់អ៊ីយ៉ុងអ៊ីដ្រូសែន [H⁺] ក្នុងល្បាយទឹក។</p>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveApp("population")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "population"
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Rocket className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold">១. កំណើនប្រជាជន (Population)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">ម៉ូដែលការកើនឡើងកោសិកា ឬមេរោគតាមអត្រាស្វ័យគុណ។</p>
                      </button>

                      <button
                        onClick={() => setActiveApp("interest")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "interest"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold">២. ការប្រាក់បង្គរ (Compound Interest)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">គណនាកំណើនវិនិយោគ ឬប្រាក់សន្សំបូកបញ្ចូលការប្រាក់បង្គរ។</p>
                      </button>

                      <button
                        onClick={() => setActiveApp("decay")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeApp === "decay"
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <TrendingDown className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold">៣. ការបំបែកធាតុវិទ្យុសកម្ម (Decay)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight">រូបវិទ្យា៖ ការបំបែកធាតុវិទ្យុសកម្ម និងការកំណត់អាយុកាលកាបូន។</p>
                      </button>
                    </div>
                  )}

                  {/* App specific explanation detail */}
                  <div className="bg-slate-950/70 border border-white/5 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {state.mode === "rational" ? (
                      <>
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
                      </>
                    ) : state.mode === "logarithmic" ? (
                      <>
                        {activeApp === "sound" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-purple-300 text-xs">កម្រិតសម្ពាធសំឡេង និងប្រព័ន្ធដេស៊ីបែល (Sound Intensity & Decibels)៖</div>
                            <p className="text-[11px] text-slate-300">
                              កម្រិតសំឡេង <span className="font-mono text-cyan-300">L (dB)</span> ត្រូវបានគណនាតាមលក្ខណៈលោការីតពីអាំងតង់ស៊ីតេពន្លឺ ឬសម្ពាធសំឡេង <span className="font-mono text-yellow-300">I</span> ធៀបនឹងសំឡេងខ្សោយបំផុតដែលត្រចៀកមនុស្សអាចឮ <span className="font-mono">I₀ = 10⁻¹² W/m²</span>៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">L = 10 · log₁₀(I / I₀)</span>
                              ដោយសារត្រចៀកមនុស្សមានប្រតិកម្មជាលក្ខណៈលោការីតទៅនឹងសម្ពាធ រាល់ការកើនឡើងកម្រិតសំឡេង <span className="font-mono text-emerald-400">10 dB</span> មានន័យថាអាំងតង់ស៊ីតេថាមពលកើនឡើង <span className="font-mono">10 ដង</span>! នៅលើម៉ូដែល Simulator 2D ខាងលើ អ្នកអាចប៉ះនឹងឧបករណ៍បំពងសំឡេង និងមើលរលកសូរសព្ទប្រែប្រួលតាមប៉ារ៉ាម៉ែត្រ <span className="font-mono">a = {state.paramA.toFixed(1)}</span>។
                            </p>
                          </div>
                        )}
                        {activeApp === "richter" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-amber-300 text-xs">ទំហំថាមពលការរញ្ជួយដី មាត្រដ្ឋានរិកទ័រ (Richter Earthquake Magnitude)៖</div>
                            <p className="text-[11px] text-slate-300">
                              ទំហំរញ្ជួយដី <span className="font-mono text-cyan-300">M</span> ត្រូវបានគណនាដោយផ្អែកលើអំព្លីទុយតរលកអតិបរមា <span className="font-mono text-yellow-300">A</span> ដែលកត់ត្រាបានដោយឧបករណ៍ស្វ័យលេខក្រាប (Seismograph)៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">M = log₁₀(A / A₀)</span>
                              រាល់ពេលដែលកម្រិតស្វ័យគុណរិកទ័រកើនឡើង <span className="font-mono text-amber-400">1 ឯកតា</span> (ឧ. ពី 5 ទៅ 6) អំព្លីទុយតរលកដីនឹងកើនឡើង <span className="font-mono">10 ដង</span> ហើយថាមពលដែលបញ្ចេញនឹងកើនឡើងប្រមាណ <span className="font-mono">31.6 ដង</span>! ប៉ារ៉ាម៉ែត្រ <span className="font-mono">a = {state.paramA.toFixed(1)}</span> តំណាងឲ្យការកែតម្រូវកម្ពស់រលក Seismograph។
                            </p>
                          </div>
                        )}
                        {activeApp === "ph" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-cyan-300 text-xs">កំហាប់អ៊ីយ៉ុងអ៊ីដ្រូសែន និងសន្ទស្សន៍ pH (Acidity & pH Scale)៖</div>
                            <p className="text-[11px] text-slate-300">
                              សន្ទស្សន៍ pH សម្រាប់វាស់កម្រិតអាស៊ីត ឬបាសនៃសូលុយស្យុង ជាតម្លៃលោការីតអវិជ្ជមាននៃកំហាប់អ៊ីយ៉ុងអ៊ីដ្រូសែន <span className="font-mono text-cyan-300">[H⁺]</span> គិតជាម៉ូលក្នុងមួយលីត្រ៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">pH = -log₁₀([H⁺]) ⟹ [H⁺] = 10^(-pH)</span>
                              សូលុយស្យុងដែលមាន <span className="font-mono">pH = 7</span> គឺណឺត។ បើសិនជា <span className="font-mono">pH &lt; 7</span> គឺអាស៊ីត ហើយ <span className="font-mono">pH &gt; 7</span> គឺបាស។ ការផ្លាស់ប្តូរ <span className="font-mono text-cyan-400">1 ឯកតា pH</span> ធ្វើឲ្យកំហាប់ <span className="font-mono">[H⁺]</span> ប្រែប្រួល <span className="font-mono">10 ដង</span>! ប៉ារ៉ាម៉ែត្រ <span className="font-mono">a = {state.paramA.toFixed(1)}</span> កែតម្រូវកម្រិតមេគុណមាត្រដ្ឋាន pH។
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {activeApp === "population" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-amber-300 text-xs">កំណើនប្រជាជន និងមេរោគ (Exponential Growth)៖</div>
                            <p className="text-[11px] text-slate-300">
                              កំណើនប្រជាជន ឬមេរោគ <span className="font-mono text-cyan-300">P(t)</span> នៅខណៈពេល <span className="font-mono text-yellow-300">t</span> គិតជាថ្ងៃ ត្រូវបានគណនាតាមរូបមន្ត៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">P(t) = P₀ · e^(r·t) + c</span>
                              ដែល <span className="font-mono">P₀ = {(state.paramA * 100).toFixed(0)}</span> ជាចំនួនចាប់ផ្តើម និង <span className="font-mono">r = {state.paramB.toFixed(2)}</span> ជាអត្រាកំណើន។ នៅលើម៉ូដែល Simulator 2D ខាងលើ អ្នកអាចមើលឃើញបណ្តាញកោសិកា ឬវីរុសដែលកំពុងតែបង្កើនចំនួនយ៉ាងលឿនតាមលក្ខណៈស្វ័យគុណ!
                            </p>
                          </div>
                        )}
                        {activeApp === "interest" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-emerald-300 text-xs">ការប្រាក់បង្គរ និងកំណើនហិរញ្ញវត្ថុ (Compound Interest)៖</div>
                            <p className="text-[11px] text-slate-300">
                              ប្រាក់សន្សំសរុប <span className="font-mono text-emerald-400">A(t)</span> បន្ទាប់ពីរយៈពេល <span className="font-mono text-yellow-300">t</span> ឆ្នាំ ដោយមានការប្រាក់បង្គរបន្តបន្ទាប់ ត្រូវបានបង្ហាញតាមគំរូ៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">A(t) = P · e^(r·t) + c</span>
                              ដែល <span className="font-mono">P = ${(state.paramA * 1000).toFixed(0)}</span> ជាប្រាក់ដើមដំបូង និង <span className="font-mono">r = {(state.paramB * 100).toFixed(1)}%</span> ជាអត្រាការប្រាក់ប្រចាំឆ្នាំ។ នេះបង្ហាញពីអំណាចនៃការប្រាក់បង្គរ ដែលធ្វើឲ្យការវិនិយោគរយៈពេលយូរកើនឡើងយ៉ាងគំហុក!
                            </p>
                          </div>
                        )}
                        {activeApp === "decay" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-cyan-300 text-xs">ការបំបែកធាតុវិទ្យុសកម្ម និងអាយុកាលកាបូន (Radioactive Decay & Carbon Dating)៖</div>
                            <p className="text-[11px] text-slate-300">
                              ម៉ាសនៃសារធាតុវិទ្យុសកម្ម <span className="font-mono text-yellow-300">N(t)</span> ដែលនៅសេសសល់ក្រោយពេល <span className="font-mono text-purple-300">t</span> ម៉ោង៖
                              <br />
                              <span className="font-mono text-cyan-300 block my-1 bg-white/5 p-1 px-2 rounded w-fit">N(t) = N₀ · e^(-λ·t) + c</span>
                              ដែល <span className="font-mono">N₀ = {(state.paramA * 50).toFixed(0)} mg</span> ជាម៉ាសដើម និង <span className="font-mono">λ = {Math.abs(state.paramB).toFixed(2)}</span> ជាមេគុណបំបែក។ នេះត្រូវបានប្រើប្រាស់ដោយអ្នកវិទ្យាសាស្ត្រ ដើម្បីវាស់អាយុកាលហ្វូស៊ីលដាយណូស័រ ឬវត្ថុបុរាណតាមរយៈការថយចុះនៃកាបូន-១៤!
                            </p>
                          </div>
                        )}
                      </>
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
