import React, { useEffect, useRef, useState } from "react";
import { ProbabilitySimState } from "../types";
import { 
  Sparkles, 
  Activity,
  Lightbulb,
  Shield,
  HelpCircle,
  Cpu,
  Globe,
  RefreshCw,
  Box
} from "lucide-react";

interface ProbabilitySimProps {
  state: ProbabilitySimState;
  onChange: (state: ProbabilitySimState) => void;
  onExplainRequest: () => void;
}

export default function ProbabilitySim({ state, onChange, onExplainRequest }: ProbabilitySimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [time, setTime] = useState<number>(0);
  const [diceValues, setDiceValues] = useState<number[]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
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

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (state.mode === "decision") {
      drawDecisionMaking(ctx, width, height, time);
    } else if (state.mode === "risk") {
      drawRiskManagement(ctx, width, height, time);
    } else if (state.mode === "randomness") {
      drawRandomness(ctx, width, height, time);
    } else if (state.mode === "ai_science") {
      drawAiScience(ctx, width, height, time);
    } else if (state.mode === "applications") {
      drawApplications(ctx, width, height, time);
    }

  }, [state.mode, state.xVal, state.param2, state.is3d, time, diceValues, isRolling]);

  const handleModeChange = (mode: ProbabilitySimState["mode"]) => {
    onChange({ ...state, mode });
  };

  const handleToggle3D = () => {
    onChange({ ...state, is3d: !state.is3d });
  };

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  // 1. Informed Decision-Making (Scale / Decision boundary)
  const drawDecisionMaking = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("១. ការធ្វើសេចក្តីសម្រេចចិត្តផ្អែកលើព័ត៌មាន (Informed Decision-Making)", 20, 30);

    const threshold = state.xVal / 100; // 0.1 to 1.0

    if (state.is3d) {
      // Draw 3D Decision boundary separating two clouds of data points
      const cx = w / 2;
      const cy = h / 2 + 30;
      const angle = t * 0.4;

      // Draw 3D floor grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      const points3D: {x: number, y: number, z: number, color: string}[] = [];

      // Generate stable points around two cluster centers in 3D
      // Cluster 1 (Low Risk, High Reward)
      for (let i = 0; i < 25; i++) {
        const seed = i * 17;
        const rx = Math.sin(seed) * 35 - 50;
        const ry = Math.cos(seed * 0.7) * 35 - 30;
        const rz = Math.sin(seed * 1.3) * 35 + 40;
        points3D.push({ x: rx, y: ry, z: rz, color: "#22c55e" }); // green
      }
      // Cluster 2 (High Risk, Low Reward)
      for (let i = 0; i < 25; i++) {
        const seed = i * 23;
        const rx = Math.sin(seed) * 35 + 50;
        const ry = Math.cos(seed * 0.9) * 35 + 30;
        const rz = Math.sin(seed * 1.5) * 35 - 40;
        points3D.push({ x: rx, y: ry, z: rz, color: "#ef4444" }); // red
      }

      // Rotate and Project function
      const project = (x: number, y: number, z: number) => {
        // Rotate Y
        const x1 = x * Math.cos(angle) - z * Math.sin(angle);
        const z1 = x * Math.sin(angle) + z * Math.cos(angle);
        // Rotate X
        const y2 = y * Math.cos(0.5) - z1 * Math.sin(0.5);
        const z2 = y * Math.sin(0.5) + z1 * Math.cos(0.5);
        // Perspective Zoom
        const zoom = 220 / (220 + z2);
        return {
          x: cx + x1 * 1.8 * zoom,
          y: cy + y2 * 1.8 * zoom,
          depth: z2
        };
      };

      // Draw a 3D decision plane cutting through space
      // Plane equation: x = threshold_offset
      const planeXOffset = (threshold - 0.5) * 160;
      const planeCorners = [
        { x: planeXOffset, y: -80, z: -80 },
        { x: planeXOffset, y: -80, z: 80 },
        { x: planeXOffset, y: 80, z: 80 },
        { x: planeXOffset, y: 80, z: -80 },
      ];
      const projectedPlane = planeCorners.map(p => project(p.x, p.y, p.z));

      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(projectedPlane[0].x, projectedPlane[0].y);
      for(let i=1; i<4; i++) ctx.lineTo(projectedPlane[i].x, projectedPlane[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sort points by depth for correct 3D rendering
      const projectedPoints = points3D.map(p => {
        const proj = project(p.x, p.y, p.z);
        return { ...p, projX: proj.x, projY: proj.y, depth: proj.depth };
      }).sort((a, b) => b.depth - a.depth);

      // Draw points
      projectedPoints.forEach(p => {
        // If point is on the wrong side of threshold plane, give it a glowing aura or classify it
        const isApproved = p.x < planeXOffset;
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isApproved ? 10 : 0;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Labeling 3D axes
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText("X: ហានិភ័យ (Risk)", cx + 110, cy + 80);
      ctx.fillText("Y: ផលលាភ (Reward)", cx - 180, cy - 90);
      ctx.fillText("ប្លង់សម្រេចចិត្ត (Decision Plane)", projectedPlane[0].x - 10, projectedPlane[0].y - 15);

    } else {
      // 2D Classic Balanced Scale representing Risk vs Reward Trade-off
      const cx = w / 2;
      const cy = h / 2 + 50;

      // Calculate tilt based on threshold: higher threshold = more weight on reward
      const tiltMaxAngle = 0.25; // radians
      const tiltAngle = (threshold - 0.5) * 2 * tiltMaxAngle;

      // Draw Scale Base / Pillar
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 110);
      ctx.stroke();

      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy);
      ctx.lineTo(cx + 50, cy);
      ctx.stroke();

      // Draw Central Pivot Joint
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(cx, cy - 110, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw Balanced Beam (Tilted)
      const beamHalfLen = 130;
      const leftX = cx - beamHalfLen * Math.cos(tiltAngle);
      const leftY = (cy - 110) - beamHalfLen * Math.sin(tiltAngle);
      const rightX = cx + beamHalfLen * Math.cos(tiltAngle);
      const rightY = (cy - 110) + beamHalfLen * Math.sin(tiltAngle);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Left Plate Strings & Basket (Risk - Red)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(leftX - 25, leftY + 70);
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(leftX + 25, leftY + 70);
      ctx.stroke();

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(leftX - 35, leftY + 70);
      ctx.lineTo(leftX + 35, leftY + 70);
      ctx.stroke();

      // Left Plate Weight Block
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(leftX - 18, leftY + 45, 36, 25, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px system-ui";
      ctx.fillText("ហានិភ័យ", leftX - 16, leftY + 61);

      // Right Plate Strings & Basket (Reward - Green)
      ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rightX, rightY);
      ctx.lineTo(rightX - 25, rightY + 70);
      ctx.moveTo(rightX, rightY);
      ctx.lineTo(rightX + 25, rightY + 70);
      ctx.stroke();

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(rightX - 35, rightY + 70);
      ctx.lineTo(rightX + 35, rightY + 70);
      ctx.stroke();

      // Right Plate Weight Block (Size scales with slider)
      const rewardWeightSize = 10 + threshold * 30;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.roundRect(rightX - rewardWeightSize/2, rightY + 70 - rewardWeightSize, rewardWeightSize, rewardWeightSize, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px system-ui";
      ctx.fillText("ផលលាភ", rightX - 14, rightY + 62);

      // Status text
      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px system-ui";
      const decisionText = threshold < 0.4 
        ? "សម្រេចចិត្តមិនធ្វើ (High Risk / Avoided)" 
        : threshold > 0.7 
        ? "សម្រេចចិត្តធ្វើសកម្មភាព (High Confidence / Action Taken)" 
        : "កំពុងវិភាគថ្លឹងថ្លែង (Balanced Assessment)";
      ctx.fillText(`ស្ថានភាព៖ ${decisionText}`, 20, 65);
    }
  };

  // 2. Risk Management and Assessment (Umbrella / Shield protecting from randomly falling risk particles)
  const drawRiskManagement = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("២. ការគ្រប់គ្រង និងវាយតម្លៃហានិភ័យ (Risk Management & Assessment)", 20, 30);

    const protectionSize = state.xVal; // 10 to 100

    if (state.is3d) {
      // 3D Rotating dome / shield protecting a city
      const cx = w / 2;
      const cy = h / 2 + 30;
      const angle = t * 0.35;

      // Draw 3D rotating platform
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      const rGrid = 130;
      ctx.beginPath();
      for(let i=0; i<8; i++) {
        const a = angle + (i * Math.PI / 4);
        const x1 = cx + Math.cos(a) * rGrid;
        const y1 = cy + Math.sin(a) * rGrid * 0.4;
        ctx.moveTo(cx, cy);
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();

      // Draw protective dome
      const domeRadius = 40 + (protectionSize / 100) * 80;
      
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5;

      // Draw dome wireframe lat/long
      for(let lat = 0; lat <= Math.PI/2; lat += Math.PI/10) {
        ctx.beginPath();
        const rLat = domeRadius * Math.cos(lat);
        const yLat = -domeRadius * Math.sin(lat);
        for(let lon = 0; lon <= Math.PI * 2; lon += 0.1) {
          const xLon = rLat * Math.cos(lon + angle);
          const zLon = rLat * Math.sin(lon + angle);
          const px = cx + xLon;
          const py = cy + yLat + zLon * 0.3;
          if (lon === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw city structures inside dome
      const drawBuilding3D = (bx: number, bz: number, bh: number, bw: number) => {
        // Rotate coordinates
        const xRot = bx * Math.cos(angle) - bz * Math.sin(angle);
        const zRot = bx * Math.sin(angle) + bz * Math.cos(angle);
        const px = cx + xRot;
        const py = cy + zRot * 0.3;

        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.fillRect(px - bw/2, py - bh, bw, bh);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.strokeRect(px - bw/2, py - bh, bw, bh);
      };

      drawBuilding3D(-25, -20, 50, 20);
      drawBuilding3D(20, -10, 65, 18);
      drawBuilding3D(-5, 20, 40, 22);

      // Hazard particles falling from top
      ctx.fillStyle = "#f43f5e";
      for (let i = 0; i < 6; i++) {
        const seed = i * 45;
        const hx = cx + Math.sin(t * 1.5 + seed) * 120;
        const hy = 80 + ((t * 120 + seed * 2) % 180);

        // Check distance to dome center
        const dx = hx - cx;
        const dy = hy - cy;
        const dist = Math.sqrt(dx*dx + dy*dy * 2.5); // squashed sphere distance

        if (dist < domeRadius) {
          // Splat on dome surface
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.fill();
        } else if (hy < cy) {
          ctx.beginPath();
          ctx.arc(hx, hy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    } else {
      // 2D Umbrella simulation protecting a target
      const cx = w / 2;
      const cy = h / 2 + 80;

      // Draw target building/house
      ctx.fillStyle = "#475569";
      ctx.fillRect(cx - 30, cy - 50, 60, 50);
      // roof
      ctx.beginPath();
      ctx.fillStyle = "#1e293b";
      ctx.moveTo(cx - 40, cy - 50);
      ctx.lineTo(cx, cy - 80);
      ctx.lineTo(cx + 40, cy - 50);
      ctx.closePath();
      ctx.fill();

      // Draw Umbrella
      const umbrellaRadius = 30 + (protectionSize / 100) * 80;
      const uY = cy - 100;

      // Handle
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, uY);
      ctx.stroke();

      // Canopy
      ctx.fillStyle = "rgba(14, 165, 233, 0.8)";
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, uY, umbrellaRadius, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Random rain of hazards
      ctx.fillStyle = "#f43f5e";
      for(let i=0; i<15; i++) {
        const rx = cx - 180 + ((i * 35 + t * 90) % 360);
        const ry = 90 + ((i * 40 + t * 150) % 200);

        // check if blocked by umbrella canopy
        const dx = rx - cx;
        const dy = ry - uY;
        const insideArc = (dy < 0 && Math.sqrt(dx*dx + dy*dy) < umbrellaRadius);

        if (insideArc) {
          // Blocked particle
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(rx - 2, ry, 4, 4);
        } else {
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 10);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "13px system-ui";
      ctx.fillText(`វិសាលភាពការពារហានិភ័យ៖ ${protectionSize}%`, 20, 65);
    }
  };

  // 3. Randomness and Uncertainty (Gaussian curve with shaded standard deviation)
  const drawRandomness = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("៣. ការយល់ដឹងពីភាពមិនប្រាកដប្រជា (Randomness & Uncertainty)", 20, 30);

    const stdDev = 15 + (state.param2 / 100) * 45; // Standard deviation mapping
    const mean = w / 2 + (state.xVal - 50) * 2; // Mean position mapped

    if (state.is3d) {
      // 3D Rotating Gaussian Bell Surface
      const cx = w / 2;
      const cy = h / 2 + 20;
      const rotationAngle = t * 0.5;

      // Draw central axis
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 120);
      ctx.lineTo(cx, cy + 80);
      ctx.stroke();

      // We will render a grid of points on the Gaussian bell curve
      // f(x, y) = A * exp(-(x^2 + y^2)/(2*sigma^2))
      const sigma = stdDev * 0.4;
      const maxH = 100;

      // Wireframe resolution
      const gridCount = 14;
      const step = 140 / gridCount;

      ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
      ctx.lineWidth = 1.5;

      const projectPoint = (gridX: number, gridY: number) => {
        // Calculate original 3D coordinate
        const d2 = gridX*gridX + gridY*gridY;
        const zVal = maxH * Math.exp(-d2 / (2 * sigma * sigma));

        // Rotate coordinates around Z-axis or Y-axis
        const rotatedX = gridX * Math.cos(rotationAngle) - gridY * Math.sin(rotationAngle);
        const rotatedY = gridX * Math.sin(rotationAngle) + gridY * Math.cos(rotationAngle);

        // Map to 3D perspective projection
        // X, Y are floor grid, Z is height going up
        const screenX = cx + rotatedX * 2.2;
        const screenY = cy - zVal + rotatedY * 0.8; // squashed height for isometric Y
        return { x: screenX, y: screenY };
      };

      // Draw rows and columns
      for (let i = -gridCount; i <= gridCount; i++) {
        ctx.beginPath();
        for (let j = -gridCount; j <= gridCount; j++) {
          const pt = projectPoint(i * step, j * step);
          if (j === -gridCount) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      for (let j = -gridCount; j <= gridCount; j++) {
        ctx.beginPath();
        for (let i = -gridCount; i <= gridCount; i++) {
          const pt = projectPoint(i * step, j * step);
          if (i === -gridCount) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText("ផ្ទៃរូបបៃ 3D Bell-Curve Gaussian", cx - 90, cy + 110);

    } else {
      // 2D Normal distribution bell curve with dynamic shading for percentiles
      const cy = h - 60;

      // Draw axes
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, cy);
      ctx.lineTo(w - 40, cy);
      ctx.stroke();

      // Generate curve points
      const points: {x: number, y: number}[] = [];
      const amp = 130; // height of peak

      for(let x = 40; x <= w - 40; x++) {
        const dx = x - mean;
        const y = cy - amp * Math.exp(-(dx*dx) / (2 * stdDev * stdDev));
        points.push({ x, y });
      }

      // 1. Draw Shaded Percentile Area (e.g. 1 sigma, which represents ~68% probability)
      ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
      ctx.beginPath();
      const xStart = Math.max(40, Math.floor(mean - stdDev));
      const xEnd = Math.min(w - 40, Math.floor(mean + stdDev));

      ctx.moveTo(xStart, cy);
      for(let x = xStart; x <= xEnd; x++) {
        const dx = x - mean;
        const y = cy - amp * Math.exp(-(dx*dx) / (2 * stdDev * stdDev));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(xEnd, cy);
      ctx.closePath();
      ctx.fill();

      // 2. Draw 2-sigma Area (~95% probability)
      ctx.fillStyle = "rgba(244, 63, 94, 0.1)";
      ctx.beginPath();
      const xStart2 = Math.max(40, Math.floor(mean - 2 * stdDev));
      const xEnd2 = Math.min(w - 40, Math.floor(mean + 2 * stdDev));

      ctx.moveTo(xStart2, cy);
      for(let x = xStart2; x <= xEnd2; x++) {
        const dx = x - mean;
        const y = cy - amp * Math.exp(-(dx*dx) / (2 * stdDev * stdDev));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(xEnd2, cy);
      ctx.closePath();
      ctx.fill();

      // Draw Curve Line
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for(let i=1; i<points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Draw Mean Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(mean, cy);
      ctx.lineTo(mean, cy - amp);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#fff";
      ctx.font = "12px system-ui";
      ctx.fillText("μ (Mean)", mean - 22, cy - amp - 8);

      // Shaded Area Label
      ctx.fillStyle = "#fb7185";
      ctx.fillText("±1σ (68.2%)", mean - 30, cy - 35);
      ctx.fillStyle = "rgba(244, 63, 94, 0.6)";
      ctx.fillText("±2σ (95.4%)", mean - 30, cy - 12);

      // Dice roll integration next to it if space allows
      const diceX = 50;
      const diceY = 90;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.roundRect(diceX, diceY, 180, 80, 10);
      ctx.fill();
      ctx.stroke();

      // Draw 2 Dice
      const drawSingleDie = (dx: number, dy: number, value: number) => {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(dx, dy, 40, 40, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0284c7";
        // Draw dots based on value
        const center = { x: dx + 20, y: dy + 20 };
        const d = 10;
        if (value === 1) {
          ctx.beginPath(); ctx.arc(center.x, center.y, 4, 0, Math.PI*2); ctx.fill();
        } else if (value === 2) {
          ctx.beginPath(); ctx.arc(center.x - d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
        } else if (value === 3) {
          ctx.beginPath(); ctx.arc(center.x - d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x, center.y, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
        } else if (value === 4) {
          ctx.beginPath(); ctx.arc(center.x - d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x - d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
        } else if (value === 5) {
          ctx.beginPath(); ctx.arc(center.x - d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x, center.y, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x - d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(center.x - d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y - d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x - d, center.y, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x - d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center.x + d, center.y + d, 3, 0, Math.PI*2); ctx.fill();
        }
      };

      drawSingleDie(diceX + 15, diceY + 20, diceValues[0]);
      drawSingleDie(diceX + 65, diceY + 20, diceValues[1]);

      // Button to roll dice
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px system-ui";
      ctx.fillText(isRolling ? "កំពុងក្រឡុក..." : "ក្រឡុកគ្រាប់ឡុកឡាក់", diceX + 115, diceY + 38);
      ctx.font = "11px system-ui";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(`លទ្ធផល៖ ${diceValues[0] + diceValues[1]}`, diceX + 115, diceY + 54);
    }
  };

  // 4. Foundation of Data Science and AI (Neural network nodes lighting up)
  const drawAiScience = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("៤. មូលដ្ឋានគ្រឹះនៃវិទ្យាសាស្ត្រទិន្នន័យ និង AI (AI & Data Science)", 20, 30);

    const threshold = state.xVal / 100; // slider controls node thresholds/activations

    if (state.is3d) {
      // 3D Rotating Neural Network
      const cx = w / 2;
      const cy = h / 2 + 30;
      const angle = t * 0.45;

      const project = (x: number, y: number, z: number) => {
        // Rotate Y
        const x1 = x * Math.cos(angle) - z * Math.sin(angle);
        const z1 = x * Math.sin(angle) + z * Math.cos(angle);
        // Rotate X
        const y2 = y * Math.cos(0.4) - z1 * Math.sin(0.4);
        const z2 = y * Math.sin(0.4) + z1 * Math.cos(0.4);
        const zoom = 180 / (180 + z2);
        return {
          x: cx + x1 * 2 * zoom,
          y: cy + y2 * 1.8 * zoom,
          depth: z2
        };
      };

      // Define standard layers in 3D: Input, Hidden, Output
      const layers = [
        // Input Layer at z = -60
        [
          { x: -80, y: -50, z: -40, val: 0.8 },
          { x: -80, y: 0, z: -40, val: 0.5 },
          { x: -80, y: 50, z: -40, val: 0.2 }
        ],
        // Hidden Layer at z = 0
        [
          { x: 0, y: -60, z: 0, val: 0.9 * threshold },
          { x: 0, y: -20, z: 0, val: 0.4 * threshold },
          { x: 0, y: 20, z: 0, val: 0.1 * threshold },
          { x: 0, y: 60, z: 0, val: 0.7 * threshold }
        ],
        // Output Layer at z = 60
        [
          { x: 80, y: -25, z: 40, val: 0.95 * threshold },
          { x: 80, y: 25, z: 40, val: 0.15 * threshold }
        ]
      ];

      // Draw synapses (connections) with pulsing waves
      ctx.lineWidth = 1.5;
      for (let l = 0; l < layers.length - 1; l++) {
        const currentLayer = layers[l];
        const nextLayer = layers[l+1];
        currentLayer.forEach(n1 => {
          nextLayer.forEach(n2 => {
            const p1 = project(n1.x, n1.y, n1.z);
            const p2 = project(n2.x, n2.y, n2.z);
            
            // Draw connections
            const intensity = n1.val * n2.val;
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + intensity * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Synapse active wave pulse
            const pulseT = (t * 1.5 + n1.x * 0.05) % 1.0;
            const px = p1.x + (p2.x - p1.x) * pulseT;
            const py = p1.y + (p2.y - p1.y) * pulseT;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#c084fc";
            ctx.fill();
          });
        });
      }

      // Draw Layer Nodes
      layers.forEach((layer) => {
        layer.forEach(node => {
          const proj = project(node.x, node.y, node.z);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = node.val > 0.5 ? "#c084fc" : "#1e1b4b";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = node.val > 0.5 ? 12 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      });

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText("បណ្តាញណឺរ៉ូនសិប្បនិម្មិត 3D Deep Learning", cx - 110, cy + 110);

    } else {
      // 2D Neural Network showing input/hidden/output probabilities
      const cx = w / 2;
      const cy = h / 2 + 20;

      // Draw input layer
      const inputs = [
        { y: cy - 70, label: "ទិន្នន័យ (Data)", val: 1.0 },
        { y: cy, label: "ទម្រង់ (Features)", val: 0.7 },
        { y: cy + 70, label: "លក្ខខណ្ឌ (State)", val: 0.4 }
      ];

      // Draw hidden layer
      const hiddens = [
        { y: cy - 90, val: 0.9 * threshold },
        { y: cy - 30, val: 0.6 * threshold },
        { y: cy + 30, val: 0.2 * threshold },
        { y: cy + 90, val: 0.8 * threshold }
      ];

      // Draw output layer
      const outputs = [
        { y: cy - 40, label: "លទ្ធផល A (Prediction A)", val: threshold > 0.5 ? "92%" : "45%" },
        { y: cy + 40, label: "លទ្ធផល B (Prediction B)", val: threshold > 0.5 ? "8%" : "55%" }
      ];

      // Draw connections
      ctx.lineWidth = 1.5;
      inputs.forEach(inp => {
        hiddens.forEach(hid => {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + hid.val * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(cx - 150, inp.y);
          ctx.lineTo(cx, hid.y);
          ctx.stroke();
        });
      });

      hiddens.forEach(hid => {
        outputs.forEach(out => {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + hid.val * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(cx, hid.y);
          ctx.lineTo(cx + 150, out.y);
          ctx.stroke();
        });
      });

      // Draw Input Nodes
      inputs.forEach(inp => {
        ctx.beginPath();
        ctx.arc(cx - 150, inp.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px system-ui";
        ctx.fillText(inp.label, cx - 240, inp.y + 4);
      });

      // Draw Hidden Nodes
      hiddens.forEach(hid => {
        ctx.beginPath();
        ctx.arc(cx, hid.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = hid.val > 0.4 ? "#a855f7" : "#3b0764";
        ctx.fill();
        ctx.strokeStyle = "#c084fc";
        ctx.stroke();
      });

      // Draw Output Nodes
      outputs.forEach(out => {
        ctx.beginPath();
        ctx.arc(cx + 150, out.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px system-ui";
        ctx.fillText(`${out.label}: ${out.val}`, cx + 175, out.y + 4);
      });
    }
  };

  // 5. Applications in Diverse Fields
  const drawApplications = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("៥. ការអនុវត្តក្នុងវិស័យផ្សេងៗ (Diverse Applications of Probability)", 20, 30);

    const testActive = state.xVal; // Slider controls rate / speed of items

    if (state.is3d) {
      // 3D Rotating Globe / Planet with Satellite Links (representing network probability)
      const cx = w / 2;
      const cy = h / 2 + 20;
      const angle = t * 0.3;

      // Draw sphere shadow / core
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Draw longitudinal and latitudinal lines rotating
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1.5;

      // Latitude lines
      for (let lat = -Math.PI/2; lat <= Math.PI/2; lat += Math.PI/6) {
        ctx.beginPath();
        const rLat = 80 * Math.cos(lat);
        const yLat = 80 * Math.sin(lat);
        // We draw the ellipse projection of the rotated latitude circle
        ctx.ellipse(cx, cy + yLat * 0.3, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines rotating
      for (let lon = 0; lon < Math.PI; lon += Math.PI/6) {
        ctx.beginPath();
        const curLon = lon + angle;
        // Project rotating circle
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const x = 80 * Math.cos(a) * Math.sin(curLon);
          const y = 80 * Math.sin(a);
          const z = 80 * Math.cos(a) * Math.cos(curLon);
          // Only draw points on the front hemisphere for standard view
          if (z >= 0) {
            const px = cx + x;
            const py = cy + y;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      // Draw pulsing Satellites orbiting in 3D
      const drawSat = (orbitRadius: number, speed: number, offset: number, satColor: string) => {
        const satAngle = t * speed + offset;
        const xVal = orbitRadius * Math.cos(satAngle);
        const zVal = orbitRadius * Math.sin(satAngle) * 0.5; // squash
        const yVal = orbitRadius * Math.sin(satAngle) * 0.3;

        const projX = cx + xVal;
        const projY = cy + yVal;

        // Draw connection beam
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 + Math.sin(t*3)*0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(projX, projY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(projX, projY, 6, 0, Math.PI * 2);
        ctx.fillStyle = satColor;
        ctx.shadowColor = satColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      drawSat(115, 0.7, 0, "#10b981");
      drawSat(130, -0.5, 2, "#0ea5e9");

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px system-ui";
      ctx.fillText("ប្រព័ន្ធទិន្នន័យទំនាក់ទំនងផ្កាយរណបសាកល", cx - 110, cy + 115);

    } else {
      // 2D Dashboard representing diverse field analytics (Finance, Healthcare, Space, Engineering)
      const cx = w / 2;
      const cy = h / 2 + 10;

      // 4 quadrant icons/metrics
      const drawMetricBox = (mx: number, my: number, mTitle: string, desc: string, rateVal: number, color: string) => {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.beginPath();
        ctx.roundRect(mx, my, 220, 100, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px system-ui";
        ctx.fillText(mTitle, mx + 15, my + 30);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px system-ui";
        ctx.fillText(desc, mx + 15, my + 50);

        // draw small dynamic bar
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(mx + 15, my + 65, 190, 8);
        ctx.fillStyle = color;
        ctx.fillRect(mx + 15, my + 65, 1.9 * rateVal, 8);

        ctx.font = "bold 11px monospace";
        ctx.fillText(`${rateVal.toFixed(0)}% Success`, mx + 15, my + 88);
      };

      drawMetricBox(cx - 240, cy - 90, "១. វិស័យអាកាសចរណ៍ (Aviation)", "អត្រាជោគជ័យនៃការហោះហើរសម្របអាកាសធាតុ", 60 + testActive * 0.35, "#38bdf8");
      drawMetricBox(cx + 10, cy - 90, "២. សុខាភិបាល (Healthcare)", "ប្រសិទ្ធភាពវ៉ាក់សាំង / ការពារជំងឺ", 40 + testActive * 0.5, "#10b981");
      drawMetricBox(cx - 240, cy + 25, "៣. ហិរញ្ញវត្ថុ (Finance/Risk)", "លទ្ធភាពជោគជ័យក្នុងការវិនិយោគទីផ្សារ", 20 + testActive * 0.65, "#f59e0b");
      drawMetricBox(cx + 10, cy + 25, "៤. វិស្វកម្មសំណង់ (Engineering)", "កម្រិតសុវត្ថិភាពស្ពាន និងអគារទំនើប", 80 + testActive * 0.15, "#ec4899");
    }
  };

  return (
    <div ref={containerRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-sky-500/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ហេតុអ្វីត្រូវរៀនពី 'ប្រូបាប' (នៃអនុគមន៍)? <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">PROBABILITY OF FUNCTIONS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ស្វែងយល់ពីរបាយប្រូបាប អាំងតេក្រាលនៃអនុគមន៍ប្រូបាបដង់ស៊ីតេ និងភាពមិនប្រាកដប្រជា
            </p>
          </div>
        </div>

        {/* Action Button & 2D/3D Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle3D}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            {state.is3d ? "ប្តូរទៅ 2D" : "ប្តូរទៅ 3D"}
          </button>
          
          <button
            onClick={onExplainRequest}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-white" />
            ពន្យល់លម្អិតដោយ AI
          </button>
        </div>
      </div>

      {/* Split Body Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1 min-h-0">
        
        {/* Left Column: Modes Selection & Parameter Controls */}
        <div className="w-full md:w-80 flex flex-col gap-4 flex-shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            ជ្រើសរើសប្រធានបទពិសោធន៍ (Choose Mode)
          </div>
          
          {/* Categories list */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => handleModeChange("decision")}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${
                state.mode === "decision"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">ការធ្វើសេចក្តីសម្រេចចិត្ត</div>
                <div className="text-[10px] font-mono opacity-60 truncate">Decision Making</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("risk")}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${
                state.mode === "risk"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">ការគ្រប់គ្រងហានិភ័យ</div>
                <div className="text-[10px] font-mono opacity-60 truncate">Risk Management</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("randomness")}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${
                state.mode === "randomness"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <HelpCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">ភាពមិនប្រាកដប្រជា</div>
                <div className="text-[10px] font-mono opacity-60 truncate">Uncertainty</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("ai_science")}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${
                state.mode === "ai_science"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">វិទ្យាសាស្ត្រទិន្នន័យ & AI</div>
                <div className="text-[10px] font-mono opacity-60 truncate">Data Science</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("applications")}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left col-span-2 md:col-span-1 ${
                state.mode === "applications"
                  ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">ការអនុវត្តទូទៅ</div>
                <div className="text-[10px] font-mono opacity-60 truncate">Applications</div>
              </div>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mt-2">
            លៃតម្រូវប៉ារ៉ាម៉ែត្រ (Parameters Control)
          </div>

          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span className="truncate">
                  {state.mode === "decision" ? "កម្រិតសម្រេចចិត្ត (Threshold)" : state.mode === "risk" ? "កម្រិតការពារ (Protection)" : state.mode === "randomness" ? "មធ្យមភាគ (Mean)" : "ប៉ារ៉ាម៉ែត្រ A (Activation)"}
                </span>
                <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
                  {state.xVal.toFixed(0)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={state.xVal}
                onChange={(e) => onChange({ ...state, xVal: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span className="truncate">
                  {state.mode === "randomness" ? "គម្លាតគំរូ (Std Deviation)" : "គម្លាត / អាំងតង់ស៊ីតេ (Variance)"}
                </span>
                <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
                  {state.param2.toFixed(0)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={state.param2}
                onChange={(e) => onChange({ ...state, param2: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Dice rolling floating controls if in randomness */}
          {state.mode === "randomness" && !state.is3d && (
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-semibold border border-slate-700 shadow-md transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRolling ? "animate-spin" : ""}`} />
              ក្រឡុកគ្រាប់ឡុកឡាក់ (Roll Dice)
            </button>
          )}
        </div>

        {/* Right Column: Active Live 2D/3D Simulator Canvas */}
        <div className="flex-1 flex flex-col min-h-[350px] md:min-h-[480px] relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
          
          {/* Header overlay for the Canvas status */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-cyan-300">
              {state.is3d ? "ការពិសោធន៍បែប 3D (3D Dynamic Model)" : "ការពិសោធន៍បែប 2D (2D Dynamic Model)"}
            </span>
          </div>

          {/* Glow Effects */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Canvas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

      </div>
    </div>
  );
}
