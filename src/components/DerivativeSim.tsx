import React, { useEffect, useRef, useState } from "react";
import { DerivativeSimState } from "../types";
import { 
  Activity, 
  Sparkles, 
  Sliders, 
  Gauge, 
  Coins, 
  Rocket, 
  Cpu, 
  Maximize2,
  RefreshCw,
  TrendingUp,
  Info,
  Layers,
  Award
} from "lucide-react";

interface DerivativeSimProps {
  state: DerivativeSimState;
  onChange: (state: DerivativeSimState) => void;
  onExplainRequest: () => void;
}

export default function DerivativeSim({ state, onChange, onExplainRequest }: DerivativeSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation ticks
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Sub-options depending on mode
  const [motionType, setMotionType] = useState<"car" | "ball">("car");
  const [optimizationType, setOptimizationType] = useState<"box" | "profit">("box");
  const [engineeringType, setEngineeringType] = useState<"bridge" | "gear">("bridge");

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

    // Dark slate background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.03)";
    ctx.lineWidth = 1;
    const gridSize = 30;
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

    // 3D coordinate projection helper
    const project3D = (x: number, y: number, z: number, rotationAngle: number) => {
      // Rotate around Y axis
      const cosA = Math.cos(rotationAngle);
      const sinA = Math.sin(rotationAngle);
      
      const rotX = x * cosA - z * sinA;
      const rotZ = x * sinA + z * cosA + 150; // offset Z to prevent division by zero

      const scale = 220 / rotZ; // perspective division
      
      const projX = width / 2 + rotX * scale;
      const projY = height / 2 + 30 - y * scale;
      
      return { x: projX, y: projY, z: rotZ, scale };
    };

    // Axes standard variables
    const originX = width / 2 - 50;
    const originY = height / 2 + 50;
    const scaleX = 90;
    const scaleY = 75;

    const toCanvasX = (mx: number) => originX + mx * scaleX;
    const toCanvasY = (my: number) => originY - my * scaleY;

    // --- Mode 1: Instantaneous Rate of Change (គណនាអត្រាប្រែប្រួលភ្លាមៗ) ---
    if (state.mode === "rate") {
      if (state.is3d) {
        // Pseudo-3D Perspective Road / Ball rolling down
        const rot = time * 0.3;
        
        // Draw 3D Ground plane grids
        ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 1;
        for (let g = -4; g <= 4; g++) {
          ctx.beginPath();
          // lines parallel to Z
          const pStart = project3D(g * 30, -50, -100, rot);
          const pEnd = project3D(g * 30, -50, 200, rot);
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

          // lines parallel to X
          const pStartH = project3D(-120, -50, g * 30, rot);
          const pEndH = project3D(120, -50, g * 30, rot);
          ctx.moveTo(pStartH.x, pStartH.y);
          ctx.lineTo(pEndH.x, pEndH.y);
          ctx.stroke();
        }

        if (motionType === "car") {
          // 3D Moving Sportscar on a beautiful curve (sine wave track)
          const carT = (time * 0.4) % 4 - 2; // X coordinate
          const f = (x: number) => Math.sin(x * 1.5) * 20; // function path height
          const df = (x: number) => 1.5 * Math.cos(x * 1.5) * 20; // slope of height (derivative!)

          // Draw the 3D track path
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 4;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
          ctx.beginPath();
          let first = true;
          for (let tx = -3; tx <= 3; tx += 0.1) {
            const p = project3D(tx * 40, f(tx), 0, rot);
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else { ctx.lineTo(p.x, p.y); }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw 3D Car position
          const carPos = project3D(carT * 40, f(carT), 0, rot);
          const slope = df(carT);
          const angle = Math.atan(slope / 40);

          // Draw a neat 3D cyber-car box
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(carPos.x, carPos.y, 10 * carPos.scale, 0, Math.PI * 2);
          ctx.fill();

          // Tangent Vector representing Velocity Vector (v = s'(t))
          const nextPos = project3D((carT + 0.15) * 40, f(carT) + slope * 0.15, 0, rot);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(carPos.x, carPos.y);
          ctx.lineTo(nextPos.x, nextPos.y);
          ctx.stroke();

          // Arrow head
          const angleProj = Math.atan2(nextPos.y - carPos.y, nextPos.x - carPos.x);
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.moveTo(nextPos.x, nextPos.y);
          ctx.lineTo(nextPos.x - 8 * Math.cos(angleProj - 0.4), nextPos.y - 8 * Math.sin(angleProj - 0.4));
          ctx.lineTo(nextPos.x - 8 * Math.cos(angleProj + 0.4), nextPos.y - 8 * Math.sin(angleProj + 0.4));
          ctx.fill();

          // Labels
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText("៣ឌី ចលនានិងខ្សែប៉ះល្បឿន (3D Speed & Tangent)", 25, 40);
          ctx.fillStyle = "#fbbf24";
          ctx.font = "12px monospace";
          ctx.fillText(`ល្បឿនភ្លាមៗ v(t) = s'(t) = ${Math.abs(slope).toFixed(2)} m/s`, 25, 65);
        } else {
          // 3D Falling Ball under gravity
          const gravity = 9.8;
          const duration = 2.0;
          const t = (time * 0.7) % duration;
          const y = 80 - 0.5 * gravity * t * t * 15; // y position
          const dy = -gravity * t * 15; // instantaneous speed (derivative!)

          // Drop center axis
          ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          const axisTop = project3D(0, 80, 0, rot);
          const axisBot = project3D(0, -50, 0, rot);
          ctx.moveTo(axisTop.x, axisTop.y);
          ctx.lineTo(axisBot.x, axisBot.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw falling ball in 3D
          const ballPos = project3D(0, y, 0, rot);
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.arc(ballPos.x, ballPos.y, 12 * ballPos.scale, 0, Math.PI * 2);
          ctx.fill();

          // Speed vector downwards
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ballPos.x, ballPos.y);
          ctx.lineTo(ballPos.x, ballPos.y - dy * 0.15 * ballPos.scale);
          ctx.stroke();

          // Arrow tip
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          const tipY = ballPos.y - dy * 0.15 * ballPos.scale;
          ctx.moveTo(ballPos.x, tipY);
          ctx.lineTo(ballPos.x - 5, tipY - 6);
          ctx.lineTo(ballPos.x + 5, tipY - 6);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText("៣ឌី ស្ទុះធ្លាក់សេរី (3D Freefall Instantaneous Speed)", 25, 40);
          ctx.fillStyle = "#f43f5e";
          ctx.fillText(`ម៉ោង t = ${t.toFixed(2)} s`, 25, 65);
          ctx.fillStyle = "#fbbf24";
          ctx.font = "12px monospace";
          ctx.fillText(`ល្បឿនធ្លាក់ v(t) = s'(t) = g·t = ${Math.abs(dy/15).toFixed(2)} m/s`, 25, 85);
        }
      } else {
        // 2D graphs of position s(t) vs velocity v(t) = s'(t)
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1.5;
        // X and Y axes
        ctx.beginPath();
        ctx.moveTo(40, height - 60);
        ctx.lineTo(width - 40, height - 60); // X-axis
        ctx.moveTo(60, 20);
        ctx.lineTo(60, height - 20); // Y-axis
        ctx.stroke();

        if (motionType === "car") {
          // Position graph s(t) = t^2 (accelerating car)
          const tMax = 5.0;
          const currentT = state.xVal; // user control slider

          // Draw f(t) = 0.5 * a * t^2
          const acc = 2.0; // acceleration
          const s = (t: number) => 0.12 * acc * t * t;
          const ds = (t: number) => 0.24 * acc * t; // Derivative slope

          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let tIdx = 0; tIdx <= tMax; tIdx += 0.1) {
            const plotX = 60 + (tIdx / tMax) * (width - 120);
            const plotY = height - 60 - s(tIdx) * 50;
            if (tIdx === 0) ctx.moveTo(plotX, plotY);
            else ctx.lineTo(plotX, plotY);
          }
          ctx.stroke();

          // Interactive point
          const activeX = 60 + (currentT / tMax) * (width - 120);
          const activeY = height - 60 - s(currentT) * 50;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(activeX, activeY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Tangent slope line
          const slope = ds(currentT);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(activeX - 60, activeY + slope * 30);
          ctx.lineTo(activeX + 60, activeY - slope * 30);
          ctx.stroke();

          // Labels
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText("ចលនាល្បឿនកើនឡើង (Accelerating Car - Position vs Time)", 25, 40);
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px system-ui, sans-serif";
          ctx.fillText(`ពេលវេលា t = ${currentT.toFixed(2)} វិនាទី`, activeX - 40, activeY - 30);
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 12px monospace";
          ctx.fillText(`មេគុណប្រាប់ទិស Tangent (ល្បឿនភ្លាមៗ) v = s'(t) = ${(slope*10).toFixed(1)} m/s`, 25, height - 25);
        } else {
          // Ball Toss up and down s(t) = v0*t - 0.5*g*t^2
          const tMax = 4.0;
          const currentT = state.xVal;
          const v0 = 15.0;
          const g = 7.5;
          const s = (t: number) => v0 * t - 0.5 * g * t * t;
          const ds = (t: number) => v0 - g * t; // Derivative v(t)

          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let tIdx = 0; tIdx <= tMax; tIdx += 0.1) {
            const plotX = 60 + (tIdx / tMax) * (width - 120);
            const plotY = height - 60 - s(tIdx) * 5;
            if (tIdx === 0) ctx.moveTo(plotX, plotY);
            else ctx.lineTo(plotX, plotY);
          }
          ctx.stroke();

          // Active point
          const activeX = 60 + (currentT / tMax) * (width - 120);
          const activeY = height - 60 - s(currentT) * 5;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(activeX, activeY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Tangent line
          const slope = ds(currentT);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(activeX - 50, activeY + slope * 2.5);
          ctx.lineTo(activeX + 50, activeY - slope * 2.5);
          ctx.stroke();

          ctx.fillStyle = "#f43f5e";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText("គន្លងទម្រង់ប៉ារ៉ាបូល (Ball Projectile - Height vs Time)", 25, 40);
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 12px monospace";
          ctx.fillText(`ល្បឿនខណៈ v(t) = s'(t) = v₀ - gt = ${slope.toFixed(2)} m/s`, 25, height - 25);
        }
      }
    }

    // --- Mode 2: Optimization (ការរកតម្លៃអតិបរមា និងអប្បបរមា) ---
    else if (state.mode === "optimization") {
      if (optimizationType === "box") {
        // Bento-Box corner cut cardboard volume optimization
        // Cardboard size: W = 30, H = 20. Corner cuts of size x.
        // Volume V(x) = x * (30 - 2x) * (20 - 2x)
        const maxCut = 10.0;
        const currentCut = state.xVal * 3; // map [1.0, 3.0] to [3.0, 9.0]
        
        const calcVol = (x: number) => x * (30 - 2*x) * (20 - 2*x);
        // Derivative dV/dx = 12x^2 - 200x + 600
        const calcDeriv = (x: number) => 12*x*x - 200*x + 600;

        if (state.is3d) {
          // Draw gorgeous 3D Wireframe Box representing the folded box
          const rot = time * 0.4;
          const boxW = (30 - 2 * currentCut) * 3;
          const boxH = (20 - 2 * currentCut) * 3;
          const boxD = currentCut * 4; // depth scale

          // Center coordinates
          const renderBox = (w: number, h: number, d: number) => {
            const vertices = [
              project3D(-w, -d, -h, rot), // 0
              project3D(w, -d, -h, rot),  // 1
              project3D(w, d, -h, rot),   // 2
              project3D(-w, d, -h, rot),  // 3
              project3D(-w, -d, h, rot),  // 4
              project3D(w, -d, h, rot),   // 5
              project3D(w, d, h, rot),    // 6
              project3D(-w, d, h, rot),   // 7
            ];

            // Bottom plane fill
            ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            ctx.lineTo(vertices[1].x, vertices[1].y);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.lineTo(vertices[3].x, vertices[3].y);
            ctx.fill();

            // Wireframe Edges
            ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
            ctx.lineWidth = 1.5;
            const edges = [
              [0,1], [1,2], [2,3], [3,0], // bot
              [4,5], [5,6], [6,7], [7,4], // top
              [0,4], [1,5], [2,6], [3,7]  // pillars
            ];
            for (const edge of edges) {
              ctx.beginPath();
              ctx.moveTo(vertices[edge[0]].x, vertices[edge[0]].y);
              ctx.lineTo(vertices[edge[1]].x, vertices[edge[1]].y);
              ctx.stroke();
            }

            // Draw cut cardboard sheet schematic inside 3D
            ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
          };

          renderBox(boxW, boxH, boxD);

          // Render current Volume info
          const currentVol = calcVol(currentCut);
          const currentSlope = calcDeriv(currentCut);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText(`៣ឌី ម៉ូដែលប្រអប់ (3D Box Volume Fold Optimization)`, 25, 40);
          ctx.fillStyle = "#10b981";
          ctx.fillText(`ទំហំកាត់ជ្រុង x = ${currentCut.toFixed(1)} cm`, 25, 65);
          ctx.fillText(`មាឌប្រអប់ V(x) = ${currentVol.toFixed(0)} cm³`, 25, 85);
          
          ctx.fillStyle = Math.abs(currentSlope) < 15 ? "#10b981" : "#fbbf24";
          ctx.fillText(`ដេរីវេ (dV/dx) = ${currentSlope.toFixed(1)} (អត្រាប្រែប្រួលមាឌ)`, 25, 110);
          if (Math.abs(currentSlope) < 15) {
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 12px system-ui, sans-serif";
            ctx.fillText("✓ មាឌអតិបរមាសម្រេចបាន! (dV/dx = 0)", 25, 135);
          }
        } else {
          // 2D Cardboard Cut layout representation
          const sheetW = 240;
          const sheetH = 160;
          const sX = width / 2 - sheetW / 2;
          const sY = height / 2 - sheetH / 2 + 10;

          // Main cardboard outline
          ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
          ctx.fillStyle = "rgba(148, 163, 184, 0.05)";
          ctx.lineWidth = 2;
          ctx.fillRect(sX, sY, sheetW, sheetH);
          ctx.strokeRect(sX, sY, sheetW, sheetH);

          // Draw the corner cut dashed lines of size 'currentCut' scaled
          const scaleCut = currentCut * 6; // visual scale
          ctx.strokeStyle = "#ef4444";
          ctx.fillStyle = "#020617";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);

          // Corner boxes to cut
          const corners = [
            [sX, sY],
            [sX + sheetW - scaleCut, sY],
            [sX, sY + sheetH - scaleCut],
            [sX + sheetW - scaleCut, sY + sheetH - scaleCut]
          ];

          for (const c of corners) {
            ctx.fillRect(c[0], c[1], scaleCut, scaleCut);
            ctx.strokeRect(c[0], c[1], scaleCut, scaleCut);
          }
          ctx.setLineDash([]);

          // Fold lines
          ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // horizontal folds
          ctx.moveTo(sX, sY + scaleCut); ctx.lineTo(sX + sheetW, sY + scaleCut);
          ctx.moveTo(sX, sY + sheetH - scaleCut); ctx.lineTo(sX + sheetW, sY + sheetH - scaleCut);
          // vertical folds
          ctx.moveTo(sX + scaleCut, sY); ctx.lineTo(sX + scaleCut, sY + sheetH);
          ctx.moveTo(sX + sheetW - scaleCut, sY); ctx.lineTo(sX + sheetW - scaleCut, sY + sheetH);
          ctx.stroke();

          // Labels
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.fillText("គម្រូសន្លឹកកាតុងកាត់ជ្រុង (2D Cutout Layout Plan)", 25, 40);
          ctx.fillStyle = "#ef4444";
          ctx.fillText(`ជ្រុងកាត់ចោល x = ${currentCut.toFixed(1)} cm`, sX + 10, sY - 10);
          ctx.fillStyle = "#10b981";
          ctx.fillText(`មាឌ V(x) = ${calcVol(currentCut).toFixed(1)} cm³`, sX + 10, sY + sheetH + 25);
        }
      } else {
        // Business Profit Optimization: P(x) = Revenue(x) - Cost(x)
        const maxQ = 100.0;
        const currentQ = state.xVal * 30; // quantity produced [30 to 90]

        // Revenue: R(q) = -0.15 q^2 + 25 q
        // Cost: C(q) = 5 q + 150
        // Profit: P(q) = R - C = -0.15 q^2 + 20 q - 150
        const R = (q: number) => -0.15 * q * q + 25 * q;
        const C = (q: number) => 5 * q + 150;
        const P = (q: number) => R(q) - C(q);
        const dP = (q: number) => -0.3 * q + 20; // Marginal Profit (derivative!)

        // Draw 2D economic curves
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, height - 50); ctx.lineTo(width - 50, height - 50); // Q axis
        ctx.moveTo(60, 30); ctx.lineTo(60, height - 30); // Currency axis
        ctx.stroke();

        // Draw Revenue Curve (Yellow)
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let q = 0; q <= maxQ; q += 2) {
          const px = 60 + (q / maxQ) * (width - 130);
          const py = height - 50 - R(q) * 0.35;
          if (q === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw Cost Line (Pink)
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let q = 0; q <= maxQ; q += 2) {
          const px = 60 + (q / maxQ) * (width - 130);
          const py = height - 50 - C(q) * 0.35;
          if (q === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw Profit Curve (Green)
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let q = 0; q <= maxQ; q += 2) {
          const px = 60 + (q / maxQ) * (width - 130);
          const py = height - 50 - P(q) * 0.35;
          if (q === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Active production quantity line and points
        const activeX = 60 + (currentQ / maxQ) * (width - 130);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(activeX, height - 50);
        ctx.lineTo(activeX, 30);
        ctx.stroke();
        ctx.setLineDash([]);

        // Profit tangent slope representing Marginal Profit (dP/dq)
        const slope = dP(currentQ);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        const profitY = height - 50 - P(currentQ) * 0.35;
        ctx.beginPath();
        ctx.moveTo(activeX - 35, profitY + slope * 35 * 0.35);
        ctx.lineTo(activeX + 35, profitY - slope * 35 * 0.35);
        ctx.stroke();

        // Highlight profit dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(activeX, profitY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("បង្កើនប្រាក់ចំណេញអតិបរមា (Maximize Business Profit)", 25, 40);
        
        ctx.fillStyle = "#10b981";
        ctx.fillText(`បរិមាណផលិត Q = ${currentQ.toFixed(0)} គ្រឿង`, width - 180, 50);
        ctx.fillText(`ចំណេញសរុប P(q) = $${P(currentQ).toFixed(0)}`, width - 180, 75);
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`ដេរីវេ P'(q) (Marginal Profit) = $${slope.toFixed(1)} / unit`, width - 250, 105);

        // Max profit indicator when slope is close to zero
        if (Math.abs(slope) < 1.5) {
          ctx.fillStyle = "#10b981";
          ctx.font = "bold 12px system-ui, sans-serif";
          ctx.fillText("★ ចំណុចចំណេញខ្ពស់បំផុត! Marginal Profit (P') = $0", 25, height - 25);
        }
      }
    }

    // --- Mode 3: Motion & Physics (ចលនានិងរូបវិទ្យា) ---
    else if (state.mode === "motion") {
      // Rocket launching path
      const rot = time * 0.35;
      const launchAngle = state.xVal * 25 + 20; // range [45 to 95 degrees]
      const rad = launchAngle * Math.PI / 180;
      
      const v0 = 55.0;
      const g = 9.8;

      // Rocket parametric path equations
      const posX = (t: number) => v0 * Math.cos(rad) * t;
      const posY = (t: number) => v0 * Math.sin(rad) * t - 0.5 * g * t * t;
      
      // Derivatives (Velocity components dx/dt, dy/dt)
      const velX = (t: number) => v0 * Math.cos(rad);
      const velY = (t: number) => v0 * Math.sin(rad) - g * t;

      if (state.is3d) {
        // Draw 3D curved trajectory of rocket launch
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1;
        // Floor Grid
        for (let xG = -3; xG <= 3; xG++) {
          ctx.beginPath();
          const pStart = project3D(xG * 40, -40, -100, rot);
          const pEnd = project3D(xG * 40, -40, 150, rot);
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }

        // Draw parabolic flight path trajectory in 3D Space
        ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let first = true;
        for (let tIdx = 0; tIdx <= 7; tIdx += 0.1) {
          const rx = posX(tIdx) - 80;
          const ry = posY(tIdx) - 40;
          const rz = Math.sin(tIdx * 0.5) * 50; // add a little 3D curve sway
          
          if (ry < -40) break; // hit ground

          const p = project3D(rx, ry, rz, rot);
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else { ctx.lineTo(p.x, p.y); }
        }
        ctx.stroke();

        // Draw 3D Earth hemisphere at bottom
        ctx.fillStyle = "#0f2142";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        const earthCenter = project3D(0, -300, 0, rot);
        ctx.beginPath();
        ctx.arc(earthCenter.x, earthCenter.y, 250 * earthCenter.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Render Animated Rocket position
        const tActive = (time * 0.8) % 6;
        const rx = posX(tActive) - 80;
        const ry = posY(tActive) - 40;
        const rz = Math.sin(tActive * 0.5) * 50;

        if (ry >= -40) {
          const rocketPos = project3D(rx, ry, rz, rot);
          
          // Draw bright propulsion flame
          ctx.fillStyle = "#ff6b35";
          ctx.beginPath();
          ctx.arc(rocketPos.x, rocketPos.y, 10 * rocketPos.scale * (1 + Math.sin(time*20)*0.2), 0, Math.PI * 2);
          ctx.fill();

          // Draw cyber Rocket capsule
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(rocketPos.x, rocketPos.y, 6 * rocketPos.scale, 0, Math.PI * 2);
          ctx.fill();

          // Speed direction vector (Derivative components dx/dt, dy/dt)
          const vx = velX(tActive);
          const vy = velY(tActive);
          const vz = 0.5 * Math.cos(tActive * 0.5) * 50; // dz/dt
          
          const vectorEnd = project3D(rx + vx * 0.4, ry + vy * 0.4, rz + vz * 0.4, rot);

          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(rocketPos.x, rocketPos.y);
          ctx.lineTo(vectorEnd.x, vectorEnd.y);
          ctx.stroke();

          // Arrow tip for speed
          const angleProj = Math.atan2(vectorEnd.y - rocketPos.y, vectorEnd.x - rocketPos.x);
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.moveTo(vectorEnd.x, vectorEnd.y);
          ctx.lineTo(vectorEnd.x - 7 * Math.cos(angleProj - 0.4), vectorEnd.y - 7 * Math.sin(angleProj - 0.4));
          ctx.lineTo(vectorEnd.x - 7 * Math.cos(angleProj + 0.4), vectorEnd.y - 7 * Math.sin(angleProj + 0.4));
          ctx.fill();
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("៣ឌី គន្លងហោះហើររ៉ុក្កែត (3D Rocket Orbit Path)", 25, 40);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`មុំបាញ់បង្ហោះ៖ ${launchAngle.toFixed(0)}°`, 25, 65);
      } else {
        // 2D Projectile motion with tangent speed vectors
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1.5;
        // ground
        ctx.beginPath();
        ctx.moveTo(30, height - 50); ctx.lineTo(width - 30, height - 50);
        ctx.stroke();

        // Plot trajectory curve
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let first = true;
        for (let tIdx = 0; tIdx <= 6; tIdx += 0.1) {
          const cx = 50 + posX(tIdx) * 1.8;
          const cy = height - 50 - posY(tIdx) * 1.8;
          if (cy > height - 50) break; // landed
          
          if (first) { ctx.moveTo(cx, cy); first = false; }
          else { ctx.lineTo(cx, cy); }
        }
        ctx.stroke();

        // Moving projectile & velocity components
        const tActive = (time * 0.7) % 5;
        const cx = 50 + posX(tActive) * 1.8;
        const cy = height - 50 - posY(tActive) * 1.8;

        if (cy <= height - 50) {
          // Ball projectile
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();

          // Draw tangent Velocity vector (v_vector)
          const vx = velX(tActive);
          const vy = velY(tActive);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + vx * 1.5, cy - vy * 1.5);
          ctx.stroke();

          // Arrow head
          const angleProj = Math.atan2(-vy, vx);
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.moveTo(cx + vx * 1.5, cy - vy * 1.5);
          ctx.lineTo(cx + vx * 1.5 - 7 * Math.cos(angleProj - 0.4), cy - vy * 1.5 + 7 * Math.sin(angleProj - 0.4));
          ctx.lineTo(cx + vx * 1.5 - 7 * Math.cos(angleProj + 0.4), cy - vy * 1.5 + 7 * Math.sin(angleProj + 0.4));
          ctx.fill();

          // Draw components dx/dt and dy/dt
          ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          // dx/dt component (horizontal)
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + vx * 1.5, cy);
          ctx.stroke();
          ctx.fillText(`dx/dt: ${vx.toFixed(1)}`, cx + vx * 0.6, cy - 5);

          // dy/dt component (vertical)
          ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy - vy * 1.5);
          ctx.stroke();
          ctx.fillText(`dy/dt: ${vy.toFixed(1)}`, cx + 8, cy - vy * 0.8);
          ctx.setLineDash([]);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("ច្បាប់ចលនា និងវ៉ិចទ័រល្បឿនប៉ះ (Velocity vectors on path)", 25, 40);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "12px monospace";
        ctx.fillText(`ដេរីវេនៃចលនា៖ v_x = dx/dt, v_y = dy/dt (ល្បឿនផ្លាស់ប្តូរតាមទិសនីមួយៗ)`, 25, 65);
      }
    }

    // --- Mode 4: Economic Models (ម៉ូដែលសេដ្ឋកិច្ច) ---
    else if (state.mode === "economics") {
      // Marginal analysis representation (Marginal Cost/Marginal Revenue)
      // Visualizer of goods production rate
      // Cost function C(x) = x^3 - 6x^2 + 15x + 50
      // Marginal Cost MC = dC/dx = 3x^2 - 12x + 15
      const currentUnits = state.xVal * 3; // range [3 to 9]
      
      const calcCost = (x: number) => x*x*x - 6*x*x + 15*x + 50;
      const calcMC = (x: number) => 3*x*x - 12*x + 15;

      // Draw cost plot
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, height - 60); ctx.lineTo(width - 50, height - 60);
      ctx.stroke();

      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= 10; x += 0.2) {
        const plotX = 60 + (x / 10) * (width - 120);
        const plotY = height - 60 - calcCost(x) * 1.5;
        if (x === 0) ctx.moveTo(plotX, plotY);
        else ctx.lineTo(plotX, plotY);
      }
      ctx.stroke();

      // Tangent illustrating Marginal Cost (MC)
      const activeX = 60 + (currentUnits / 10) * (width - 120);
      const activeY = height - 60 - calcCost(currentUnits) * 1.5;
      const slopeMC = calcMC(currentUnits);

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(activeX - 40, activeY + slopeMC * 40 * 1.5 / 10);
      ctx.lineTo(activeX + 40, activeY - slopeMC * 40 * 1.5 / 10);
      ctx.stroke();

      // Point marker
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(activeX, activeY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Factory and Money Icon visually
      ctx.fillStyle = "rgba(236, 72, 153, 0.08)";
      ctx.fillRect(width - 220, 30, 200, 100);
      ctx.strokeStyle = "rgba(236, 72, 153, 0.2)";
      ctx.strokeRect(width - 220, 30, 200, 100);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("វិភាគថ្លៃដើមផលិតផល (Cost Analysis)", width - 210, 50);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#ec4899";
      ctx.fillText(`ថ្លៃដើមសរុប C(x) = $${calcCost(currentUnits).toFixed(1)}`, width - 210, 75);
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`ថ្លៃដើមបន្ថែម MC = $${slopeMC.toFixed(2)}/ឯកតា`, width - 210, 100);

      // Khmer translation text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText("គំនិតដេរីវេក្នុងសេដ្ឋកិច្ច (Marginal Analysis in Economics)", 25, 40);
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.fillText("Marginal Cost (MC) គឺជាដេរីវេនៃថ្លៃដើមសរុប (C') ដែលវាស់ស្ទង់ថ្លៃផលិតបន្ថែមមួយឯកតាទៀត។", 25, 65);
    }

    // --- Mode 5: Engineering & Bridges (វិស្វកម្ម និងបច្ចេកវិទ្យា) ---
    else if (state.mode === "engineering") {
      if (engineeringType === "bridge") {
        // Suspension Bridge Loading Curve slope tension vectors
        // Cable shape is a parabola: y = a * x^2 + d
        const spanW = width - 100;
        const bridgeX = 50;
        const bridgeY = height - 80;

        // Draw bridge deck road
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(bridgeX, bridgeY);
        ctx.lineTo(bridgeX + spanW, bridgeY);
        ctx.stroke();

        // Draw support pillars/towers
        ctx.fillStyle = "#334155";
        ctx.fillRect(bridgeX, bridgeY - 120, 15, 120);
        ctx.fillRect(bridgeX + spanW - 15, bridgeY - 120, 15, 120);

        // Draw main suspension cable
        // f(x) = 0.0012 * (x - mid)^2 + 40
        const midX = bridgeX + spanW / 2;
        const cableF = (x: number) => 0.0013 * Math.pow(x - midX, 2) + (bridgeY - 100);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let cx = bridgeX; cx <= bridgeX + spanW; cx += 2) {
          const cy = cableF(cx);
          if (cx === bridgeX) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Draw vertical suspender hangers cables
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1;
        for (let cx = bridgeX + 20; cx < bridgeX + spanW; cx += 20) {
          ctx.beginPath();
          ctx.moveTo(cx, bridgeY);
          ctx.lineTo(cx, cableF(cx));
          ctx.stroke();
        }

        // Draw an interactive Truck crossing the bridge (position controlled by slider)
        const truckX = bridgeX + 30 + state.xVal * (spanW - 80);
        
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(truckX - 18, bridgeY - 12, 36, 12);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(truckX - 10, bridgeY, 4, 0, Math.PI * 2);
        ctx.arc(truckX + 10, bridgeY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Calculate and show local slope/derivative of the cable above the truck
        const cableY = cableF(truckX);
        const hVal = 1;
        const slopeCable = (cableF(truckX + hVal) - cableF(truckX)) / hVal;

        // Draw stress vectors at that point (tension is proportional to slope/derivative)
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(truckX, cableY);
        // Draw force vector pointing along the tangent
        ctx.lineTo(truckX + 40, cableY + slopeCable * 40);
        ctx.stroke();

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        const arrowX = truckX + 40;
        const arrowY = cableY + slopeCable * 40;
        const angleV = Math.atan(slopeCable);
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 6 * Math.cos(angleV - 0.4), arrowY - 6 * Math.sin(angleV - 0.4));
        ctx.lineTo(arrowX - 6 * Math.cos(angleV + 0.4), arrowY - 6 * Math.sin(angleV + 0.4));
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("គម្រូរចនាសម្ព័ន្ធស្ពានខ្សែកាប (Suspension Bridge Cable Design)", 25, 40);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "12px monospace";
        ctx.fillText(`មេគុណប្រាប់ទិសខ្សែកាប (Derivative dy/dx) = ${slopeCable.toFixed(3)}`, 25, 65);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("កម្លាំងទាញតង់ស្យុង (Tension Force) គឺសមាមាត្រទៅនឹងដេរីវេនៃរាងធរណីមាត្រខ្សែកាប!", 25, 85);
      } else {
        // Rotating gear system with angular speed derivatives
        const rot = time * 0.8;
        const r1 = 60;
        const r2 = 30;
        const g1X = width / 2 - 50;
        const g1Y = height / 2 + 10;
        const g2X = width / 2 + 40;
        const g2Y = height / 2 + 10;

        // Helper to draw a gear with teeth
        const drawGear = (x: number, y: number, r: number, teeth: number, ang: number, color: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.fillStyle = "rgba(56, 189, 248, 0.05)";
          
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // draw teeth
          ctx.lineWidth = 3;
          for (let i = 0; i < teeth; i++) {
            const toothAng = ang + (i / teeth) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(toothAng) * r, y + Math.sin(toothAng) * r);
            ctx.lineTo(x + Math.cos(toothAng) * (r + 8), y + Math.sin(toothAng) * (r + 8));
            ctx.stroke();
          }

          // Center joint
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        };

        // Angular velocities w1 = dθ/dt, w2 = -w1 * (r1/r2)
        const w1 = state.xVal * 0.5; // primary gear angular velocity
        const w2 = -w1 * (r1 / r2);

        const ang1 = rot * w1;
        const ang2 = -rot * w1 * (r1/r2) + 0.2; // offset for mesh alignment

        drawGear(g1X, g1Y, r1, 16, ang1, "#10b981");
        drawGear(g2X, g2Y, r2, 8, ang2, "#38bdf8");

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("ប្រព័ន្ធកង់ចក្រវិល (Rotational Gears Velocity Control)", 25, 40);
        ctx.font = "12px monospace";
        ctx.fillStyle = "#10b981";
        ctx.fillText(`ល្បឿនមុំកង់ទី១ w₁ = dθ₁/dt = ${w1.toFixed(1)} rad/s`, 25, 65);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`ល្បឿនមុំកង់ទី២ w₂ = dθ₂/dt = ${w2.toFixed(1)} rad/s`, 25, 85);
      }
    }

  }, [state.mode, state.xVal, state.is3d, motionType, optimizationType, engineeringType, time, isPlaying]);

  const handleModeChange = (mode: DerivativeSimState["mode"]) => {
    onChange({
      ...state,
      mode,
      xVal: 2.0 // reset slider to middle
    });
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            <TrendingUp className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ម៉ាស៊ីនពិសោធន៍ ដេរីវេនៃអនុគមន៍ <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">DERIVATIVES</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              សិក្សាអត្រាប្រែប្រួលភ្លាមៗ ស្វែងរកបរិមាណអតិបរមា/អប្បបរមា និងការអនុវត្តរូបវិទ្យា/សេដ្ឋកិច្ច
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-explain-derivative"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-yellow-500/20 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-white" />
          ពន្យល់លម្អិតដោយ AI
        </button>
      </div>

      {/* 5 Tabs corresponding directly to the Khmer Derivative Poster */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
        <button
          id="tab-deriv-rate"
          onClick={() => handleModeChange("rate")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "rate"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">១. អត្រាប្រែប្រួល</span>
          <span className="text-xs font-bold leading-tight">ល្បឿនខណៈ & Tangent</span>
        </button>

        <button
          id="tab-deriv-optimization"
          onClick={() => handleModeChange("optimization")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "optimization"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">២. អតិបរមា-អប្បបរមា</span>
          <span className="text-xs font-bold leading-tight">Optimization ប្រអប់</span>
        </button>

        <button
          id="tab-deriv-motion"
          onClick={() => handleModeChange("motion")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "motion"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៣. ចលនា & រូបវិទ្យា</span>
          <span className="text-xs font-bold leading-tight">គន្លងហោះហើររ៉ុក្កែត</span>
        </button>

        <button
          id="tab-deriv-economics"
          onClick={() => handleModeChange("economics")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "economics"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៤. ម៉ូដែលសេដ្ឋកិច្ច</span>
          <span className="text-xs font-bold leading-tight">Marginal Cost ថ្លៃដើម</span>
        </button>

        <button
          id="tab-deriv-engineering"
          onClick={() => handleModeChange("engineering")}
          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all border ${
            state.mode === "engineering"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <span className="text-[10px] uppercase font-mono opacity-60">៥. វិស្វកម្មស្ពាន</span>
          <span className="text-xs font-bold leading-tight">Cable Tension & កង់</span>
        </button>
      </div>

      {/* Main Workspace Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Canvas (2/3 size) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex flex-col relative min-h-[380px] shadow-inner justify-center">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Floating overlays for specific sub-modes */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => onChange({ ...state, is3d: !state.is3d })}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                state.is3d
                  ? "bg-amber-500 text-white border-amber-400"
                  : "bg-slate-900 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {state.is3d ? "៣ឌី (3D View) 🟢" : "២ឌី (2D Graphic)"}
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1.5 bg-slate-900 border border-white/10 text-white hover:bg-white/5 rounded-lg text-[11px] transition-all"
            >
              {isPlaying ? "ផ្អាកដំណើរការ" : "ដំណើរការ"}
            </button>
          </div>

          {/* Interactive Sub-options */}
          {state.mode === "rate" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              <button
                onClick={() => setMotionType("car")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  motionType === "car" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ឡានស្ទុះល្បឿន
              </button>
              <button
                onClick={() => setMotionType("ball")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  motionType === "ball" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                បាល់ធ្លាក់សេរី
              </button>
            </div>
          )}

          {state.mode === "optimization" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              <button
                onClick={() => setOptimizationType("box")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  optimizationType === "box" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ការបត់ប្រអប់កាតុង (Box Fold)
              </button>
              <button
                onClick={() => setOptimizationType("profit")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  optimizationType === "profit" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ប្រាក់ចំណេញសរុប (Profit Max)
              </button>
            </div>
          )}

          {state.mode === "engineering" && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 p-1 rounded-lg border border-white/10 flex gap-1">
              <button
                onClick={() => setEngineeringType("bridge")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  engineeringType === "bridge" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ស្ពានខ្សែយោង
              </button>
              <button
                onClick={() => setEngineeringType("gear")}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  engineeringType === "gear" ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ប្រព័ន្ធកង់ចក្រវិល
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Parameters Explorer (1/3 size) */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-yellow-400" />
              ដែនពិសោធន៍ (Controls)
            </h3>

            {/* Slider Parameters dependent on the selected tab */}
            {state.mode === "rate" && !state.is3d && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">ពេលវេលាវិភាគ t៖</span>
                    <span className="text-yellow-400 font-mono font-bold">{state.xVal.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="4.9"
                    step="0.05"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-yellow-400 font-bold mb-1"> instantaneous Rate:</p>
                  ដោយការផ្លាស់ប្តូរពេលវេលា $t$ អ្នកអាចមើលឃើញចំណុច Tangent និងការផ្លាស់ប្តូរមេគុណប្រាប់ទិស ដែលជាល្បឿនពិតជាក់ស្តែងនាខណៈនោះ។
                </div>
              </div>
            )}

            {state.mode === "optimization" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">
                      {optimizationType === "box" ? "ទំហំកាត់ជ្រុងប្រអប់ x៖" : "បរិមាណចែកចាយផលិតផល Q៖"}
                    </span>
                    <span className="text-yellow-400 font-mono font-bold">
                      {optimizationType === "box" ? `${(state.xVal * 3).toFixed(1)} cm` : `${(state.xVal * 30).toFixed(0)} គ្រឿង`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-emerald-400 font-bold mb-1">Optimization Concept:</p>
                  នៅត្រង់ចំណុចខ្ពស់បំផុត (អតិបរមា) ខ្សែបន្ទាត់ Tangent គឺដេកស្មើនឹង 0 (ដេរីវេ f'(x) = 0)។ នេះគឺជាគោលការណ៍គណិតវិទ្យាដ៏មានឥទ្ធិពលក្នុងឧស្សាហកម្ម និងធុរកិច្ច។
                </div>
              </div>
            )}

            {state.mode === "motion" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">មុំនៃការបាញ់បង្ហោះ (Launch Angle)៖</span>
                    <span className="text-yellow-400 font-mono font-bold">{(state.xVal * 25 + 20).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-blue-400 font-bold mb-1">Motion Parametrics:</p>
                  ដេរីវេនៃចម្ងាយធៀបនឹងពេលគឺជាល្បឿន ដេរីវេនៃល្បឿនធៀបនឹងពេលគឺសន្ទុះ។ វ៉ិចទ័រល្បឿនតែងតែរត់ស្របប៉ះគន្លងចលនានៃរ៉ុក្កែតជានិច្ច។
                </div>
              </div>
            )}

            {state.mode === "economics" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">បរិមាណផលិត Q (Production volume)៖</span>
                    <span className="text-yellow-400 font-mono font-bold">{(state.xVal * 3).toFixed(1)}K ឯកតា</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-pink-400 font-bold mb-1">Marginal Cost:</p>
                  Marginal cost (MC) ប្រាប់អ្នកអំពីល្បឿនកើនឡើងនៃថ្លៃដើម។ ក្រុមហ៊ុនប្រើប្រាស់ដេរីវេដើម្បីកំណត់ថា តើការបង្កើនការផលិតមួយឯកតាបន្ថែមទៀត ចំណេញ ឬខាត។
                </div>
              </div>
            )}

            {state.mode === "engineering" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">
                      {engineeringType === "bridge" ? "ទីតាំងឡានធ្វើដំណើរលើស្ពាន៖" : "ល្បឿនបង្វិលកង់បញ្ជា primary gear៖"}
                    </span>
                    <span className="text-yellow-400 font-mono font-bold">
                      {engineeringType === "bridge" ? `${(state.xVal * 33.3).toFixed(0)}%` : `${(state.xVal * 1.5).toFixed(1)} rad/s`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={state.xVal}
                    onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-teal-400 font-bold mb-1">Engineering Slopes:</p>
                  ក្នុងវិស្វកម្មសំណង់ ដូចជាស្ពានខ្សែយោង ដេរីវេជួយកំណត់មុំ tension force នៃខ្សែកាបដើម្បីរក្សាការទ្រទ្រង់ទម្ងន់ឱ្យមានសុវត្ថិភាពខ្ពស់។
                </div>
              </div>
            )}
          </div>

          {/* Quick facts Khmer Card */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 p-4 rounded-2xl flex flex-col gap-3">
            <h4 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              អត្ថប្រយោជន៍គន្លឹះនៃដេរីវេ (Derivative Essence)
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ដេរីវេគឺជារង្វាស់នៃអត្រាបម្រែបម្រួលភ្លាមៗ (Instantaneous rate of change)។ វាអនុញ្ញាតឱ្យយើងដឹងថា តើប្រព័ន្ធផ្លាស់ប្តូរលឿនកម្រិតណា និងរបៀបកំណត់ស្ថានភាពល្អប្រសើរបំផុត (Optimization)។
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
