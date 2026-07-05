import React, { useState, useEffect, useRef, useMemo } from "react";
import { VectorsInSpaceSimState } from "../types";
import { 
  HelpCircle, Info, Compass, Box, Rocket, Globe, Sun, Cpu, Activity, Move
} from "lucide-react";

interface VectorsInSpaceSimProps {
  state: VectorsInSpaceSimState;
  onChange: (state: VectorsInSpaceSimState) => void;
  onExplainRequest: () => void;
}

export default function VectorsInSpaceSim({ state, onChange, onExplainRequest }: VectorsInSpaceSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // local camera/rotation state (drag-to-rotate in 3D)
  const [rotation, setRotation] = useState({ alpha: 42, beta: 20 });
  const [zoom, setZoom] = useState(1.15);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Collapse stats panel on mobile device screens automatically
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowStats(false);
    }
  }, []);

  // Handle auto-rotation animation
  useEffect(() => {
    let animationId: number;
    if (autoRotate && state.is3d) {
      const animate = () => {
        setRotation((prev) => ({
          ...prev,
          alpha: (prev.alpha + 0.18) % 360,
        }));
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [autoRotate, state.is3d]);

  // Vector A (Primary target / position)
  const vectorA = useMemo(() => {
    return { x: state.xVal, y: state.yVal, z: state.is3d ? state.zVal : 0 };
  }, [state.xVal, state.yVal, state.zVal, state.is3d]);

  // Vector B (Secondary target / force / velocity / light vector)
  // We compute Vector B differently depending on the study mode for the best physics representation
  const vectorB = useMemo(() => {
    switch (state.mode) {
      case "engineering":
        // Anchored support point B
        return { x: -3.5, y: 4.5, z: state.is3d ? 4.0 : 0 };
      case "motion":
        // Velocity vector perpendicular to circular orbit path or tangent-like
        const speed = state.param2 * 2.5;
        // tangential vector in XY plane
        const r = Math.sqrt(vectorA.x**2 + vectorA.y**2);
        if (r === 0) return { x: speed, y: 0, z: 0 };
        return { x: (-vectorA.y / r) * speed, y: (vectorA.x / r) * speed, z: 0.8 * speed };
      case "graphics":
        // Light source vector rotated around the center based on param2
        const angle = state.param2 * Math.PI;
        const radius = 6.0;
        return {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          z: state.is3d ? 5.0 : 0
        };
      case "robotics":
        // Gripper orientation normal vector
        return { x: 1.5, y: 1.5, z: state.is3d ? -1.0 : 0 };
      case "calculus":
        // Tangent orbital momentum direction vector
        const calcSpeed = state.param2 * 3.0;
        const normDist = Math.sqrt(vectorA.x**2 + vectorA.y**2) || 1;
        return { x: (-vectorA.y / normDist) * calcSpeed, y: (vectorA.x / normDist) * calcSpeed, z: 0 };
      case "algebraic":
      default:
        // Basic scale of vector B
        const vectorBBase = { x: 3.5, y: 3.0, z: -2.5 };
        return {
          x: vectorBBase.x * state.param2,
          y: vectorBBase.y * state.param2,
          z: state.is3d ? vectorBBase.z * state.param2 : 0,
        };
    }
  }, [state.mode, state.param2, vectorA, state.is3d]);

  // Math Calculations
  const normA = useMemo(() => Math.sqrt(vectorA.x ** 2 + vectorA.y ** 2 + vectorA.z ** 2), [vectorA]);
  const normB = useMemo(() => Math.sqrt(vectorB.x ** 2 + vectorB.y ** 2 + vectorB.z ** 2), [vectorB]);
  
  const dotProduct = useMemo(() => {
    return vectorA.x * vectorB.x + vectorA.y * vectorB.y + vectorA.z * vectorB.z;
  }, [vectorA, vectorB]);

  const crossProduct = useMemo(() => {
    return {
      x: vectorA.y * vectorB.z - vectorA.z * vectorB.y,
      y: vectorA.z * vectorB.x - vectorA.x * vectorB.z,
      z: vectorA.x * vectorB.y - vectorA.y * vectorB.x,
    };
  }, [vectorA, vectorB]);

  const normCross = useMemo(() => {
    return Math.sqrt(crossProduct.x ** 2 + crossProduct.y ** 2 + crossProduct.z ** 2);
  }, [crossProduct]);

  const angleBetween = useMemo(() => {
    if (normA === 0 || normB === 0) return 0;
    const cosTheta = Math.max(-1, Math.min(1, dotProduct / (normA * normB)));
    return (Math.acos(cosTheta) * 180) / Math.PI;
  }, [dotProduct, normA, normB]);

  // Drag-to-rotate events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!state.is3d) return;
    isDraggingRef.current = true;
    setAutoRotate(false); // Stop auto-rotate when user interacts
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !state.is3d) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    
    setRotation((prev) => ({
      alpha: (prev.alpha - dx * 0.45) % 360,
      beta: Math.max(-80, Math.min(80, prev.beta - dy * 0.45)),
    }));
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!state.is3d || e.touches.length === 0) return;
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !state.is3d || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    
    setRotation((prev) => ({
      alpha: (prev.alpha - dx * 0.45) % 360,
      beta: Math.max(-80, Math.min(80, prev.beta - dy * 0.45)),
    }));
    
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid scaling factor (pixels per grid unit)
    const scaleFactor = 23 * zoom;

    ctx.clearRect(0, 0, width, height);

    // Coordinate Projection Function
    // Maps 3D Math space (X: horizontal, Y: depth, Z: vertical) to 2D screen coordinates
    const project3D = (x: number, y: number, z: number) => {
      if (!state.is3d) {
        // Flat 2D view (XY projection)
        return {
          x: centerX + x * scaleFactor * 1.35,
          y: centerY - y * scaleFactor * 1.35,
          visible: true,
        };
      }

      // Convert vertical/pitch (beta) and horizontal/yaw (alpha) to radians
      const radAlpha = (rotation.alpha * Math.PI) / 180;
      const radBeta = (rotation.beta * Math.PI) / 180;

      // 1. Rotate around Z axis (yaw - alpha rotation)
      const x1 = x * Math.cos(radAlpha) - y * Math.sin(radAlpha);
      const y1 = x * Math.sin(radAlpha) + y * Math.cos(radAlpha);
      const z1 = z;

      // 2. Rotate around X axis (pitch - beta rotation)
      const x2 = x1;
      const y2 = y1 * Math.cos(radBeta) - z1 * Math.sin(radBeta);
      const z2 = y1 * Math.sin(radBeta) + z1 * Math.cos(radBeta);

      // Perspective projection
      const d = 22; // camera distance
      const distanceScale = d / (d + y2); // Y acts as depth

      return {
        x: centerX + x2 * scaleFactor * distanceScale * 1.25,
        y: centerY - z2 * scaleFactor * distanceScale * 1.25, // Z maps upwards on screen
        visible: y2 > -d,
      };
    };

    // Helper to draw an arrow on canvas
    const drawArrow = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: string,
      lineWidth: number,
      dash: number[] = []
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dash.length > 0) {
        ctx.setLineDash(dash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Arrow head (only if not a dashed line)
      if (dash.length === 0) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - 10 * Math.cos(angle - Math.PI / 6),
          to.y - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - 10 * Math.cos(angle + Math.PI / 6),
          to.y - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    };

    // Draw reference grids
    const maxVal = 9;
    
    // Draw 3D/2D grid plane
    ctx.setLineDash([]);
    if (state.is3d) {
      // Draw grid plane on the horizontal XY plane (Z = 0)
      ctx.strokeStyle = "rgba(148, 163, 184, 0.07)";
      ctx.lineWidth = 1;
      for (let i = -maxVal; i <= maxVal; i++) {
        const p1 = project3D(i, -maxVal, 0);
        const p2 = project3D(i, maxVal, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const p3 = project3D(-maxVal, i, 0);
        const p4 = project3D(maxVal, i, 0);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }
    } else {
      // 2D grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.07)";
      ctx.lineWidth = 1;
      for (let i = -maxVal; i <= maxVal; i++) {
        // vertical grid lines
        const p1 = project3D(i, -maxVal, 0);
        const p2 = project3D(i, maxVal, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // horizontal grid lines
        const p3 = project3D(-maxVal, i, 0);
        const p4 = project3D(maxVal, i, 0);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }
    }

    // Draw Coordinate Axes
    const origin = project3D(0, 0, 0);
    const xAxisTip = project3D(maxVal, 0, 0);
    const yAxisTip = project3D(0, maxVal, 0);
    const zAxisTip = project3D(0, 0, maxVal);

    // Negative axes (dashed)
    const xAxisNeg = project3D(-maxVal, 0, 0);
    const yAxisNeg = project3D(0, -maxVal, 0);
    const zAxisNeg = project3D(0, 0, -maxVal);

    // Draw negative axes first
    drawArrow(origin, xAxisNeg, "rgba(239, 68, 68, 0.15)", 1, [4, 4]);
    drawArrow(origin, yAxisNeg, "rgba(34, 197, 94, 0.15)", 1, [4, 4]);
    if (state.is3d) {
      drawArrow(origin, zAxisNeg, "rgba(59, 130, 246, 0.15)", 1, [4, 4]);
    }

    // Draw positive axes
    drawArrow(origin, xAxisTip, "#ef4444", 1.8); // X-axis (Red)
    drawArrow(origin, yAxisTip, "#22c55e", 1.8); // Y-axis (Green)
    if (state.is3d) {
      drawArrow(origin, zAxisTip, "#3b82f6", 1.8); // Z-axis (Blue)
    }

    // Label axes
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("X+", xAxisTip.x + 5, xAxisTip.y + 3);
    ctx.fillStyle = "#22c55e";
    ctx.fillText("Y+", yAxisTip.x + 5, yAxisTip.y - 5);
    if (state.is3d) {
      ctx.fillStyle = "#3b82f6";
      ctx.fillText("Z+", zAxisTip.x - 5, zAxisTip.y - 8);
    }

    // Project Core Vectors
    const pA = project3D(vectorA.x, vectorA.y, vectorA.z);
    const pB = project3D(vectorB.x, vectorB.y, vectorB.z);

    // Dynamic rendering depending on the selected mode
    switch (state.mode) {
      case "algebraic": {
        // --- 1. ALGEBRAIC MODE (Standard Math vectors) ---
        // Coordinate projections for Vector A
        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
        ctx.lineWidth = 1;
        
        const pA_xy = project3D(vectorA.x, vectorA.y, 0);
        const pA_x = project3D(vectorA.x, 0, 0);
        const pA_y = project3D(0, vectorA.y, 0);
        
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pA_xy.x, pA_xy.y);
        ctx.lineTo(pA_x.x, pA_x.y);
        ctx.moveTo(pA_xy.x, pA_xy.y);
        ctx.lineTo(pA_y.x, pA_y.y);
        ctx.stroke();

        if (state.is3d) {
          const pA_z = project3D(0, 0, vectorA.z);
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pA_z.x, pA_z.y);
          ctx.stroke();
        }

        // Draw Vector A (Cyan)
        drawArrow(origin, pA, "#06b6d4", 3);
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("A", pA.x + 10, pA.y - 5);

        // Draw Vector B (Orange / Yellow)
        drawArrow(origin, pB, "#f97316", 3);
        ctx.fillStyle = "#f97316";
        ctx.fillText("B", pB.x + 10, pB.y + 12);

        // Vector Sum A + B (Pink / Fuchsia)
        const vectorSum = {
          x: vectorA.x + vectorB.x,
          y: vectorA.y + vectorB.y,
          z: vectorA.z + vectorB.z,
        };
        const pSum = project3D(vectorSum.x, vectorSum.y, vectorSum.z);
        
        // Parallelogram outline
        ctx.strokeStyle = "rgba(236, 72, 153, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pSum.x, pSum.y);
        ctx.moveTo(pB.x, pB.y);
        ctx.lineTo(pSum.x, pSum.y);
        ctx.stroke();

        // Draw Sum Vector Arrow
        drawArrow(origin, pSum, "#ec4899", 2.5);
        ctx.fillStyle = "#ec4899";
        ctx.fillText("A + B (Resultant)", pSum.x + 8, pSum.y - 8);

        // Cross Product (Purple)
        if (state.is3d && normCross > 0) {
          const maxDrawLen = 7;
          const rawLen = normCross;
          const crossScale = rawLen > maxDrawLen ? maxDrawLen / rawLen : 1;
          const scaledCross = {
            x: crossProduct.x * crossScale,
            y: crossProduct.y * crossScale,
            z: crossProduct.z * crossScale
          };
          const pCross = project3D(scaledCross.x, scaledCross.y, scaledCross.z);
          drawArrow(origin, pCross, "#a855f7", 2);
          ctx.fillStyle = "#a855f7";
          ctx.fillText("A × B (Cross Product)", pCross.x - 15, pCross.y - 12);
        }
        break;
      }

      case "engineering": {
        // --- 2. ENGINEERING & CONSTRUCTION (Bridge Truss Support Force) ---
        // Draw horizontal bridge truss structure span
        ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        // Structural bridge nodes
        const nodes = [
          project3D(-7, 0, 4),
          project3D(-3.5, 0, 4),
          project3D(0, 0, 4),
          project3D(3.5, 0, 4),
          project3D(7, 0, 4),
          project3D(-5.25, 0, 6.5),
          project3D(-1.75, 0, 6.5),
          project3D(1.75, 0, 6.5),
          project3D(5.25, 0, 6.5),
        ];

        // Draw bridge trusses
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < 5; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(nodes[5].x, nodes[5].y);
        for (let i = 6; i < 9; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.stroke();

        // Truss web diagonals
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(nodes[5].x, nodes[5].y);
        ctx.lineTo(nodes[1].x, nodes[1].y);
        ctx.lineTo(nodes[6].x, nodes[6].y);
        ctx.lineTo(nodes[2].x, nodes[2].y);
        ctx.lineTo(nodes[7].x, nodes[7].y);
        ctx.lineTo(nodes[3].x, nodes[3].y);
        ctx.lineTo(nodes[8].x, nodes[8].y);
        ctx.lineTo(nodes[4].x, nodes[4].y);
        ctx.stroke();

        // Ground anchor supports
        const anchorL = project3D(-7, 0, 0);
        const anchorR = project3D(7, 0, 0);
        ctx.strokeStyle = "rgba(71, 85, 105, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(anchorL.x, anchorL.y);
        ctx.lineTo(nodes[0].x, nodes[0].y);
        ctx.moveTo(anchorR.x, anchorR.y);
        ctx.lineTo(nodes[4].x, nodes[4].y);
        ctx.stroke();

        // Draw Cable A (Cyan vector) supporting hanging mass from node center
        // Cable anchors at Vector A and Vector B
        drawArrow(origin, pA, "#06b6d4", 3);
        ctx.fillStyle = "#06b6d4";
        ctx.fillText("ខ្សែរកាប A (Tension A)", pA.x + 8, pA.y - 5);

        drawArrow(origin, pB, "#f97316", 3);
        ctx.fillStyle = "#f97316";
        ctx.fillText("ខ្សែរកាប B (Tension B)", pB.x - 12, pB.y - 8);

        // Hanging payload sphere under origin
        const payloadMass = state.param2 * 9.5;
        const massAnchor = project3D(0, 0, -2.5);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(massAnchor.x, massAnchor.y);
        ctx.stroke();

        // Draw hanging payload box
        ctx.fillStyle = "rgba(219, 39, 119, 0.85)";
        ctx.strokeStyle = "#db2777";
        ctx.lineWidth = 2.5;
        ctx.fillRect(massAnchor.x - 14, massAnchor.y - 14, 28, 28);
        ctx.strokeRect(massAnchor.x - 14, massAnchor.y - 14, 28, 28);

        // Box stripes
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(massAnchor.x - 14, massAnchor.y - 14);
        ctx.lineTo(massAnchor.x + 14, massAnchor.y + 14);
        ctx.moveTo(massAnchor.x + 14, massAnchor.y - 14);
        ctx.lineTo(massAnchor.x - 14, massAnchor.y + 14);
        ctx.stroke();

        // Label mass
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`${payloadMass.toFixed(0)} kg`, massAnchor.x - 14, massAnchor.y + 4);

        // Force gravity vector F_g (downward, red)
        const pFg = project3D(0, 0, -4);
        drawArrow(origin, pFg, "#ef4444", 2.2);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("កម្លាំងទំនាញ (F_g)", pFg.x + 8, pFg.y + 12);

        // Counter resultant upward force vector F_R (green dashed)
        const pFR = project3D(0, 0, 4);
        drawArrow(origin, pFR, "#10b981", 2, [3, 3]);
        ctx.fillStyle = "#10b981";
        ctx.fillText("កម្លាំងទ្រលំនឹង (F_R)", pFR.x + 8, pFR.y - 5);
        break;
      }

      case "motion": {
        // --- 3. PHYSICS & MOTION (Satellite / Spaceship Orbit Vectors) ---
        // Draw Planet Earth at the origin
        const planetRadius = 42 * zoom;
        ctx.beginPath();
        const planetGrad = ctx.createRadialGradient(
          origin.x - 10, origin.y - 10, 5,
          origin.x, origin.y, planetRadius
        );
        planetGrad.addColorStop(0, "#38bdf8"); // bright cyan
        planetGrad.addColorStop(0.4, "#0284c7"); // ocean blue
        planetGrad.addColorStop(0.85, "#0f172a"); // space black edge
        ctx.fillStyle = planetGrad;
        ctx.arc(origin.x, origin.y, planetRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Planet green continents outlines
        ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(origin.x - 8, origin.y + 5, planetRadius * 0.4, -0.5, 2.5);
        ctx.stroke();

        // Draw Circular Orbit Path of satellite on XY plane
        const orbitalRadius = normA;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (state.is3d) {
          // Project circular orbit nodes
          for (let th = 0; th <= 360; th += 8) {
            const rad = (th * Math.PI) / 180;
            const pt = project3D(orbitalRadius * Math.cos(rad), orbitalRadius * Math.sin(rad), 0);
            if (th === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
        } else {
          ctx.arc(origin.x, origin.y, orbitalRadius * scaleFactor * 1.35, 0, 2 * Math.PI);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Position Vector A (Cyan, from Earth center to spaceship)
        drawArrow(origin, pA, "#06b6d4", 2);
        ctx.fillStyle = "#06b6d4";
        ctx.fillText("វ៉ិចទ័រទីតាំង (r)", (origin.x + pA.x)/2 + 8, (origin.y + pA.y)/2 - 5);

        // Draw Spaceship icon at pA (vector A tip)
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(pA.x, pA.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw satellite solar panels
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pA.x - 12, pA.y);
        ctx.lineTo(pA.x + 12, pA.y);
        ctx.stroke();

        // Draw Velocity Vector B starting from satellite tip
        const pVelocityEnd = { x: pA.x + (pB.x - origin.x), y: pA.y + (pB.y - origin.y) };
        drawArrow(pA, pVelocityEnd, "#f97316", 2.5);
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("វ៉ិចទ័រល្បឿន (v)", pVelocityEnd.x + 8, pVelocityEnd.y);

        // Gravitational Force vector pulling spaceship back to planet center (Red)
        const gravityDir = { x: -vectorA.x / normA * 3.5, y: -vectorA.y / normA * 3.5, z: -vectorA.z / normA * 3.5 };
        const pFgTip = project3D(vectorA.x + gravityDir.x, vectorA.y + gravityDir.y, vectorA.z + gravityDir.z);
        drawArrow(pA, pFgTip, "#ef4444", 2);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("កម្លាំងទំនាញ (F_g)", pFgTip.x - 15, pFgTip.y + 12);
        break;
      }

      case "graphics": {
        // --- 4. COMPUTER GRAPHICS & GAMES (3D Surface Shading & Light Normal) ---
        // Light Source Vector B pointing towards the Sun light source
        const pLightSource = project3D(vectorB.x, vectorB.y, vectorB.z);

        // Draw glowing golden Sun at the light source coordinate (tip of Vector B)
        ctx.beginPath();
        const sunGrad = ctx.createRadialGradient(
          pLightSource.x, pLightSource.y, 2,
          pLightSource.x, pLightSource.y, 18
        );
        sunGrad.addColorStop(0, "#fffbeb");
        sunGrad.addColorStop(0.3, "#fef08a");
        sunGrad.addColorStop(0.7, "#f59e0b");
        sunGrad.addColorStop(1, "transparent");
        ctx.fillStyle = sunGrad;
        ctx.arc(pLightSource.x, pLightSource.y, 18, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Sun rays lines
        ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        for (let a = 0; a < 360; a += 45) {
          const rad = (a * Math.PI) / 180;
          ctx.moveTo(pLightSource.x + 8 * Math.cos(rad), pLightSource.y + 8 * Math.sin(rad));
          ctx.lineTo(pLightSource.x + 22 * Math.cos(rad), pLightSource.y + 22 * Math.sin(rad));
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Light Source Direction Vector (Vector B from origin)
        drawArrow(origin, pLightSource, "#eab308", 2, [3, 3]);
        ctx.fillStyle = "#eab308";
        ctx.fillText("ពន្លឺថ្ងៃ (Light vector L)", pLightSource.x + 10, pLightSource.y + 22);

        // Draw a solid 3D Diamond / Pyramid at the center
        // Let's project pyramid vertices
        const pyrBase = [
          project3D(-2.8, -2.8, -1.5),
          project3D(2.8, -2.8, -1.5),
          project3D(2.8, 2.8, -1.5),
          project3D(-2.8, 2.8, -1.5),
        ];
        const pyrApex = project3D(0, 0, 3.2);

        // Lambert Shading calculations based on Dot Product of Vector A (Normal) & Vector B (Light Source)
        const dotN_L = dotProduct / (normA * normB || 1); // cos(theta)
        const diffuseAmount = Math.max(0.12, dotN_L); // ambient light is 0.12

        // Shade faces
        // Let's draw side 1 (front-facing side)
        ctx.beginPath();
        ctx.moveTo(pyrBase[0].x, pyrBase[0].y);
        ctx.lineTo(pyrBase[1].x, pyrBase[1].y);
        ctx.lineTo(pyrApex.x, pyrApex.y);
        ctx.closePath();
        
        // Face lighting color
        const baseColor = { r: 6, g: 182, b: 212 }; // Cyan base color
        const lR = Math.round(baseColor.r * 0.3 + baseColor.r * 0.7 * diffuseAmount);
        const lG = Math.round(baseColor.g * 0.3 + baseColor.g * 0.7 * diffuseAmount);
        const lB = Math.round(baseColor.b * 0.3 + baseColor.b * 0.7 * diffuseAmount);
        ctx.fillStyle = `rgb(${lR}, ${lG}, ${lB})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw other face (shaded slightly darker for depth)
        ctx.beginPath();
        ctx.moveTo(pyrBase[1].x, pyrBase[1].y);
        ctx.lineTo(pyrBase[2].x, pyrBase[2].y);
        ctx.lineTo(pyrApex.x, pyrApex.y);
        ctx.closePath();
        const sideFactor = Math.max(0.08, diffuseAmount * 0.7);
        const lR2 = Math.round(baseColor.r * 0.25 + baseColor.r * 0.5 * sideFactor);
        const lG2 = Math.round(baseColor.g * 0.25 + baseColor.g * 0.5 * sideFactor);
        const lB2 = Math.round(baseColor.b * 0.25 + baseColor.b * 0.5 * sideFactor);
        ctx.fillStyle = `rgb(${lR2}, ${lG2}, ${lB2})`;
        ctx.fill();
        ctx.stroke();

        // Draw Surface Normal Vector A (pointing outwards from face center or apex)
        // Let's place normal vector starting from apex pointing upwards/outwards
        drawArrow(pyrApex, pA, "#06b6d4", 3);
        ctx.fillStyle = "#06b6d4";
        ctx.fillText("វ៉ិចទ័រណរម៉ាល់ផ្ទៃ (Normal A)", pA.x + 10, pA.y - 5);

        // Draw angle indicator arc between Normal A and Light L
        break;
      }

      case "robotics": {
        // --- 5. ROBOTICS & AUTOMATION (Robotic Arm Inverse Kinematics) ---
        // Target coordinates at Vector A (destination gripper position)
        // Draw target Cargo box at Vector A tip
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.fillRect(pA.x - 10, pA.y - 10, 20, 20);
        ctx.strokeRect(pA.x - 10, pA.y - 10, 20, 20);
        ctx.fillStyle = "#475569";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("📦", pA.x - 6, pA.y + 4);

        // Base stand cylinder at origin
        const baseOffset = project3D(0, 0, -1.8);
        ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(origin.x - 16, origin.y);
        ctx.lineTo(origin.x + 16, origin.y);
        ctx.lineTo(baseOffset.x + 10, baseOffset.y);
        ctx.lineTo(baseOffset.x - 10, baseOffset.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Robotic joint calculation: Shoulder to Elbow (L1), Elbow to Target (L2)
        // Let L1 = 4.5 units, L2 = 4.0 units
        const L1 = 4.5;
        const distTarget = normA;
        
        // Calculate elbow point in 3D
        // Interpolate along target vector, but bend it upwards (Z coordinate)
        let elbow = { x: vectorA.x * 0.5, y: vectorA.y * 0.5, z: vectorA.z * 0.5 + 3.0 };
        // normalize and scale to match L1 link constraint roughly
        const dElb = Math.sqrt(elbow.x**2 + elbow.y**2 + elbow.z**2) || 1;
        elbow = {
          x: (elbow.x / dElb) * L1,
          y: (elbow.y / dElb) * L1,
          z: (elbow.z / dElb) * L1,
        };

        const pElbow = project3D(elbow.x, elbow.y, elbow.z);

        // Draw Shoulder to Elbow link (metallic, cyan glow)
        ctx.strokeStyle = "rgba(51, 65, 85, 0.95)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(pElbow.x, pElbow.y);
        ctx.stroke();

        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Elbow to Gripper link
        ctx.strokeStyle = "rgba(51, 65, 85, 0.95)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pElbow.x, pElbow.y);
        ctx.lineTo(pA.x, pA.y);
        ctx.stroke();

        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.lineCap = "butt";

        // Draw glowing hinge joints
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(pElbow.x, pElbow.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw claw gripper fingers at target Cargo box (Vector A tip)
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Left finger claw
        ctx.moveTo(pA.x - 3, pA.y - 1);
        ctx.quadraticCurveTo(pA.x - 11, pA.y - 8, pA.x - 12, pA.y - 2);
        // Right finger claw
        ctx.moveTo(pA.x + 3, pA.y - 1);
        ctx.quadraticCurveTo(pA.x + 11, pA.y - 8, pA.x + 12, pA.y - 2);
        ctx.stroke();

        // Vector A showing mathematical target coordinate displacement (from origin)
        drawArrow(origin, pA, "#06b6d4", 1.5, [2, 3]);
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("វ៉ិចទ័រគោលដៅ (A Target)", pA.x + 12, pA.y + 16);
        break;
      }

      case "calculus": {
        // --- 6. ADVANCED MATHEMATICS & ASTRONOMY (Planetary Calculus & Momentum) ---
        // Draw golden central Star / Sun at origin
        const sunRadius = 25 * zoom;
        ctx.beginPath();
        const starGrad = ctx.createRadialGradient(
          origin.x, origin.y, 1,
          origin.x, origin.y, sunRadius
        );
        starGrad.addColorStop(0, "#fffbeb");
        starGrad.addColorStop(0.35, "#fbbf24");
        starGrad.addColorStop(0.85, "#ea580c");
        starGrad.addColorStop(1, "transparent");
        ctx.fillStyle = starGrad;
        ctx.arc(origin.x, origin.y, sunRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Elliptical Orbit Track line
        ctx.strokeStyle = "rgba(249, 115, 22, 0.16)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const aOrbit = 7.0; // semi-major axis
        const bOrbit = 5.2; // semi-minor axis
        if (state.is3d) {
          for (let th = 0; th <= 360; th += 6) {
            const rad = (th * Math.PI) / 180;
            const pt = project3D(aOrbit * Math.cos(rad), bOrbit * Math.sin(rad), 0);
            if (th === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
        } else {
          ctx.ellipse(origin.x, origin.y, aOrbit * scaleFactor * 1.35, bOrbit * scaleFactor * 1.35, 0, 0, 2 * Math.PI);
        }
        ctx.stroke();

        // Draw planet Earth at Vector A
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(pA.x, pA.y, 6.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw planet atmosphere glow
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pA.x, pA.y, 8.5, 0, 2 * Math.PI);
        ctx.stroke();

        // Position Vector r (Cyan, from Sun to Earth)
        drawArrow(origin, pA, "#06b6d4", 2);
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("វ៉ិចទ័រកាំចម្ងាយ (r)", (origin.x + pA.x)/2 + 10, (origin.y + pA.y)/2 - 4);

        // Orbital Velocity Vector v (Orange, starting from planet)
        const pVelEnd = { x: pA.x + (pB.x - origin.x), y: pA.y + (pB.y - origin.y) };
        drawArrow(pA, pVelEnd, "#f97316", 2.2);
        ctx.fillStyle = "#f97316";
        ctx.fillText("ល្បឿនគោចរ (v = dr/dt)", pVelEnd.x + 8, pVelEnd.y);

        // Acceleration Vector a pointing directly to center (Red)
        const aDir = { x: -vectorA.x / normA * 3.5, y: -vectorA.y / normA * 3.5, z: 0 };
        const pAccTip = project3D(vectorA.x + aDir.x, vectorA.y + aDir.y, 0);
        drawArrow(pA, pAccTip, "#ef4444", 1.8);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("សន្ទុះទំនាញ (a = dv/dt)", pAccTip.x - 12, pAccTip.y + 12);

        // Angular Momentum Vector L = r × v (Purple vector upward perpendicular to orbit plane!)
        if (state.is3d) {
          // Angular momentum is perpendicular to planar motion (pointing straight up Z)
          const momLen = 4.2;
          const pMomentum = project3D(0, 0, momLen);
          drawArrow(origin, pMomentum, "#a855f7", 2.5);
          ctx.fillStyle = "#a855f7";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("អាំងតង់ស៊ីតេម៉ូម៉ង់ (L = r × v)", pMomentum.x - 10, pMomentum.y - 12);

          // Draw planar orbit grid highlight to show the conservation of angular momentum
          ctx.fillStyle = "rgba(168, 85, 247, 0.04)";
          ctx.beginPath();
          const orbitalMesh = [
            project3D(-aOrbit, -bOrbit, 0),
            project3D(aOrbit, -bOrbit, 0),
            project3D(aOrbit, bOrbit, 0),
            project3D(-aOrbit, bOrbit, 0)
          ];
          ctx.moveTo(orbitalMesh[0].x, orbitalMesh[0].y);
          for (let k = 1; k < 4; k++) ctx.lineTo(orbitalMesh[k].x, orbitalMesh[k].y);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
    }

  }, [state, rotation, zoom, vectorA, vectorB, crossProduct, dotProduct, normA, normB, normCross]);

  // Handle Resize correctly with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleSliderChange = (key: keyof VectorsInSpaceSimState, val: number) => {
    onChange({ ...state, [key]: val });
  };

  // Helper translations for study modes
  const studyModes = [
    { id: "algebraic", name: "ពិជគណិត", icon: Compass, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { id: "engineering", name: "វិស្វកម្ម & សំណង់", icon: Box, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { id: "motion", name: "រូបវិទ្យា & ចលនា", icon: Rocket, color: "text-rose-400", bg: "bg-rose-500/10" },
    { id: "graphics", name: "ក្រាហ្វិក & ហ្គេម", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "robotics", name: "រ៉ូបូត & ស្វ័យប្រវត្ត", icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "calculus", name: "គណិតវិទ្យាជាន់ខ្ពស់", icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div id="vectors-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              ពិសោធន៍វិចទ័រក្នុងលំហ (Vectors in 2D / 3D Space)
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              ស្វែងយល់ការគណនាវិចទ័រ កូអរដោនេក្នុងលំហ ផលគុណ និងការវិភាគរូបមន្តអនុវត្តជាក់ស្តែង
            </p>
          </div>
        </div>
        <button
          id="btn-vectors-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-yellow-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់រូបមន្តដោយគ្រូ AI
        </button>
      </div>

      {/* Simulator view area (Upper portion) */}
      <div ref={containerRef} className="flex-1 relative min-h-[350px] md:min-h-[440px] overflow-hidden bg-gradient-to-b from-[#080d1a] to-black">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
        
        {/* Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Dynamic visual parameters floating overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 text-right bg-black/85 p-2.5 md:p-3.5 rounded-xl border border-white/10 backdrop-blur-md max-w-[220px] transition-all duration-300 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-1 mb-1">
            <button 
              onClick={() => setShowStats(!showStats)} 
              className="text-cyan-400 hover:text-cyan-300 p-1 rounded hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
              title={showStats ? "លាក់ប៉ារ៉ាម៉ែត្រ (Collapse)" : "បង្ហាញប៉ារ៉ាម៉ែត្រ (Expand)"}
            >
              <Info className="w-3.5 h-3.5" />
              {!showStats && <span className="font-sans">បង្ហាញព័ត៌មាន</span>}
            </button>
            {showStats && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">កូអរដោនេ</span>}
          </div>
          {showStats && (
            <>
              <div className="text-xs text-cyan-400 font-mono font-bold">
                {state.mode === "graphics" ? " Normal N" : " Vector A"} = ({state.xVal.toFixed(1)}, {state.yVal.toFixed(1)}, {state.is3d ? state.zVal.toFixed(1) : "0.0"})
              </div>
              <div className="text-xs text-orange-400 font-mono font-bold">
                {state.mode === "graphics" ? " Light Vector L" : " Vector B"} = ({vectorB.x.toFixed(1)}, {vectorB.y.toFixed(1)}, {vectorB.z.toFixed(1)})
              </div>
              <div className="h-[1px] bg-slate-800/80 my-1"></div>
              <span className="text-[9px] text-slate-400 font-mono block">ប្រវែង ||A|| ≈ {normA.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 font-mono block">ប្រវែង ||B|| ≈ {normB.toFixed(2)}</span>
              {state.mode === "graphics" && (
                <span className="text-[9px] text-yellow-400 font-mono font-semibold block">N · L (Cosine θ) ≈ {(dotProduct / (normA * normB || 1)).toFixed(2)}</span>
              )}
            </>
          )}
        </div>

        {/* 3D rotate instructions */}
        {state.is3d && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded border border-white/5 text-[9px] text-slate-400 font-medium">
            <Move className="w-3.5 h-3.5 text-cyan-400" />
            <span>ចុចអូសលើរូប (Drag on canvas) ដើម្បីបង្វិលលំហ 3D</span>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          className={`absolute inset-0 w-full h-full block z-0 ${state.is3d ? "cursor-grab active:cursor-grabbing" : ""}`} 
        />
      </div>

      {/* Controller Controls (Lower portion) */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Mode and Display Options */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">របៀបសិក្សា (Study Mode)</label>
              <div className="grid grid-cols-2 gap-2">
                {studyModes.map((mode) => {
                  const IconComp = mode.icon;
                  const isSelected = state.mode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onChange({ ...state, mode: mode.id as any })}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border text-left ${
                        isSelected
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-semibold shadow-inner"
                          : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${mode.color}`} />
                      <span className="truncate">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">ទម្រង់បង្ហាញ (Dimension View)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChange({ ...state, is3d: false })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      !state.is3d
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                    }`}
                  >
                    2D Flat (X-Y)
                  </button>
                  <button
                    onClick={() => onChange({ ...state, is3d: true })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      state.is3d
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                    }`}
                  >
                    3D Perspective
                  </button>
                </div>
              </div>

              {state.is3d && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">បង្វិលស្វ័យប្រវត្ត (Auto Rotate)</span>
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      autoRotate 
                        ? "bg-green-500/10 text-green-400 border-green-500/30" 
                        : "bg-slate-800 text-slate-400 border-transparent"
                    }`}
                  >
                    {autoRotate ? "បើក" : "បិទ"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Coordinate & Parameter Sliders */}
          <div className="lg:col-span-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {state.mode === "graphics" ? "កែសម្រួលណរម៉ាល់ផ្ទៃ N" : "កែសម្រួលវ៉ិចទ័រ A (Vector A)"}
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                ({state.xVal.toFixed(1)}, {state.yVal.toFixed(1)}, {state.zVal.toFixed(1)})
              </span>
            </div>

            {/* Slider X */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>កូអរដោនេ X</span>
                <span className="font-mono text-cyan-400 font-bold">{state.xVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-7"
                max="7"
                step="0.5"
                value={state.xVal}
                onChange={(e) => handleSliderChange("xVal", parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>កូអរដោនេ Y</span>
                <span className="font-mono text-cyan-400 font-bold">{state.yVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-7"
                max="7"
                step="0.5"
                value={state.yVal}
                onChange={(e) => handleSliderChange("yVal", parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider Z */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>កូអរដោនេ Z {!state.is3d && <span className="text-slate-600 text-[10px]">(ត្រូវការរបៀប 3D)</span>}</span>
                <span className="font-mono text-cyan-400 font-bold">{state.zVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-7"
                max="7"
                step="0.5"
                disabled={!state.is3d}
                value={state.zVal}
                onChange={(e) => handleSliderChange("zVal", parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Parameter 2: Adaptive description */}
            <div className="space-y-1 border-t border-white/5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  {state.mode === "algebraic" && "មេគុណមាត្រដ្ឋានវ៉ិចទ័រ B"}
                  {state.mode === "engineering" && "ម៉ាស់ទម្ងាយព្យួរ (Payload mass)"}
                  {state.mode === "motion" && "កម្រិតល្បឿនគោចរយាន (Orbital Speed)"}
                  {state.mode === "graphics" && "ទិសដៅមុំប្រភពពន្លឺថ្ងៃ (Light angle)"}
                  {state.mode === "robotics" && "ប្រវែងដែនកំណត់ដៃរ៉ូបូត"}
                  {state.mode === "calculus" && "ម៉ាស់ផ្កាយស្នូលទំនាញកណ្តាល"}
                </span>
                <span className="font-mono text-orange-400 font-bold">
                  {state.mode === "algebraic" && `s = ${state.param2.toFixed(2)}`}
                  {state.mode === "engineering" && `${(state.param2 * 9.5).toFixed(0)} kg`}
                  {state.mode === "motion" && `${(state.param2 * 7.9).toFixed(1)} km/s`}
                  {state.mode === "graphics" && `${(state.param2 * 180).toFixed(0)}°`}
                  {state.mode === "robotics" && `${(state.param2 * 8.5).toFixed(1)} m`}
                  {state.mode === "calculus" && `${(state.param2 * 10).toFixed(1)} ×10²⁴ kg`}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={state.param2}
                onChange={(e) => handleSliderChange("param2", parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          {/* Column 3: Mathematical Properties Details */}
          <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">
              {state.mode === "algebraic" && "លទ្ធផលពិជគណិតវិចទ័រ"}
              {state.mode === "engineering" && "លទ្ធផលកម្លាំងរចនាសម្ព័ន្ធវិស្វកម្ម"}
              {state.mode === "motion" && "លទ្ធផលចលនាគន្លងគោចររូបវិទ្យា"}
              {state.mode === "graphics" && "លទ្ធផលបំភ្លឺផ្ទៃកុំព្យូទ័រក្រាហ្វិក"}
              {state.mode === "robotics" && "កូអរដោនេចលនាស្វ័យប្រវត្តដៃរ៉ូបូត"}
              {state.mode === "calculus" && "គណនា Calculus និងតារាសាស្ត្រ"}
            </span>

            {/* Mode-specific calculated outputs */}
            {state.mode === "algebraic" && (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">||A|| (ប្រវែងវិចទ័រ A):</span>
                  <span className="text-white font-semibold">≈ {normA.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">||B|| (ប្រវែងវិចទ័រ B):</span>
                  <span className="text-white font-semibold">≈ {normB.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A · B (ផលគុណស្កាលែ):</span>
                  <span className="text-yellow-400 font-bold">{dotProduct.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A × B (ផលគុណវិចទ័រ):</span>
                  <span className="text-fuchsia-400 font-bold">
                    ({crossProduct.x.toFixed(1)}, {crossProduct.y.toFixed(1)}, {crossProduct.z.toFixed(1)})
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-slate-400">មុំរវាងវិចទ័រ (Angle θ):</span>
                  <span className="text-green-400 font-bold">{angleBetween.toFixed(1)}°</span>
                </div>
              </div>
            )}

            {state.mode === "engineering" && (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">កម្លាំងទំនាញ (Force F_g):</span>
                  <span className="text-red-400 font-bold">{(state.param2 * 9.5 * 9.81).toFixed(1)} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">កម្លាំងទប់ (Resultant F_R):</span>
                  <span className="text-green-400 font-bold">{(state.param2 * 9.5 * 9.81).toFixed(1)} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">សម្ពាធទាញកាប A (Tension A):</span>
                  <span className="text-cyan-400">≈ {(normA * state.param2 * 11).toFixed(1)} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">សម្ពាធទាញកាប B (Tension B):</span>
                  <span className="text-orange-400">≈ {(normB * state.param2 * 11).toFixed(1)} N</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/5 pt-1 text-slate-400 font-sans">
                  * វិចទ័រជួយវិស្វករគណនាកម្លាំងផ្ទុកនៅលើបង្គោល និងស្ពាន 3D ដើម្បីកុំឱ្យសំណង់បាក់ស្រុត។
                </p>
              </div>
            )}

            {state.mode === "motion" && (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">កម្ពស់គន្លង (Radius r):</span>
                  <span className="text-cyan-400">{(6371 + normA * 150).toFixed(0)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ល្បឿនគោចរ (Speed v):</span>
                  <span className="text-orange-400">{(state.param2 * 7.9).toFixed(1)} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">កម្លាំង centrifugal (F_c):</span>
                  <span className="text-rose-400">≈ {(state.param2 * 34).toFixed(0)} kN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ល្បឿនលោតរួច (Escape v):</span>
                  <span className="text-green-400">≈ 11.2 km/s</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/5 pt-1 text-slate-400 font-sans">
                  * វិចទ័រទីតាំង 🚀 និងល្បឿន tangent ជួយកំណត់គន្លងផ្លូវហោះហើររបស់ផ្កាយរណប។
                </p>
              </div>
            )}

            {state.mode === "graphics" && (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">ណរម៉ាល់ផ្ទៃ N:</span>
                  <span className="text-cyan-400">({state.xVal.toFixed(1)}, {state.yVal.toFixed(1)}, {state.zVal.toFixed(1)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ទិសដៅពន្លឺ L:</span>
                  <span className="text-yellow-400">({vectorB.x.toFixed(1)}, {vectorB.y.toFixed(1)}, {vectorB.z.toFixed(1)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ផលគុណស្កាលែ N · L:</span>
                  <span className="text-emerald-400 font-bold">{dotProduct.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">កម្រិតពន្លឺ (Brightness):</span>
                  <span className="text-white">{(Math.max(0.12, dotProduct / (normA * normB || 1)) * 100).toFixed(0)}%</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/5 pt-1 text-slate-400 font-sans">
                  * ផលគុណស្កាលែរវាងវិចទ័រណរម៉ាល់ផ្ទៃ និងទិសដៅពន្លឺ ប្រើសម្រាប់គណនាស្រមោលពិតៗក្នុងហ្គេម 3D។
                </p>
              </div>
            )}

            {state.mode === "robotics" && (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">ប្រវែងទីតាំងគោលដៅ:</span>
                  <span className="text-cyan-400">≈ {normA.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ប្រវែង Segment L1:</span>
                  <span className="text-white">4.5 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ប្រវែង Segment L2:</span>
                  <span className="text-white">4.0 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">មុំកែងកែងដៃ (Joint angle):</span>
                  <span className="text-purple-400 font-bold">{(180 - angleBetween).toFixed(1)}°</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/5 pt-1 text-slate-400 font-sans">
                  * វិចទ័រជួយបញ្ជាដៃរ៉ូបូតស្វ័យប្រវត្តឱ្យផ្លាស់ទី និងចាប់កាន់កញ្ចប់ទំនិញបានច្បាស់លាស់។
                </p>
              </div>
            )}

            {state.mode === "calculus" && (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">ផលគុណវិចទ័រ r × v:</span>
                  <span className="text-fuchsia-400">({crossProduct.x.toFixed(1)}, {crossProduct.y.toFixed(1)}, {crossProduct.z.toFixed(1)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ម៉ូម៉ង់កម្លាំង (Momentum L):</span>
                  <span className="text-purple-400 font-bold">≈ {normCross.toFixed(1)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ល្បឿនបោសផ្ទៃ (dA/dt):</span>
                  <span className="text-green-400">≈ {(normCross / 2).toFixed(2)} units/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">មុំលំអៀងគន្លង (Incline):</span>
                  <span className="text-amber-400">{(rotation.beta).toFixed(1)}°</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/5 pt-1 text-slate-400 font-sans">
                  * ផលគុណវិចទ័រជួយបកស្រាយច្បាប់កែប្លែរ (Kepler) ថាគន្លងគោចរគឺស្ថិតនៅក្នុងប្លង់តែមួយជានិច្ច។
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
