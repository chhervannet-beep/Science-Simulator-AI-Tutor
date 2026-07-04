import React, { useEffect, useRef, useState } from "react";
import { ComplexSimState } from "../types";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  Activity, 
  Zap, 
  Orbit, 
  Tv, 
  Grid, 
  Sliders, 
  Compass, 
  Plus, 
  RefreshCw,
  Info
} from "lucide-react";

interface ComplexSimProps {
  state: ComplexSimState;
  onChange: (state: ComplexSimState) => void;
  onExplainRequest: () => void;
}

export default function ComplexSim({ state, onChange, onExplainRequest }: ComplexSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Dragging states for Argand Plane
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Mode specific sub-states
  const [showConjugate, setShowConjugate] = useState<boolean>(true);
  const [showSquare, setShowSquare] = useState<boolean>(false);
  const [showInverse, setShowInverse] = useState<boolean>(false);
  
  // Fourier Mode - wave types
  const [fourierWaveType, setFourierWaveType] = useState<"square" | "sawtooth" | "triangle">("square");
  const [numHarmonics, setNumHarmonics] = useState<number>(4);

  // Graphics Mode - shape & dimension
  const [graphicsDimension, setGraphicsDimension] = useState<"2D" | "3D">("3D");
  
  // Fractal Mode - type and position
  const [fractalType, setFractalType] = useState<"mandelbrot" | "julia">("mandelbrot");
  const [juliaReal, setJuliaReal] = useState<number>(-0.7);
  const [juliaImag, setJuliaImag] = useState<number>(0.27015);
  const [fractalOffsetX, setFractalOffsetX] = useState<number>(-0.5);
  const [fractalOffsetY, setFractalOffsetY] = useState<number>(0);
  const [fractalZoom, setFractalZoom] = useState<number>(1.2);

  // RLC Circuit Preset Helper
  const setRLCPreset = (type: "inductive" | "capacitive" | "resonant") => {
    if (type === "inductive") {
      onChange({ ...state, r: 30, l: 150, c: 40, freq: 50 });
    } else if (type === "capacitive") {
      onChange({ ...state, r: 25, l: 30, c: 15, freq: 40 });
    } else if (type === "resonant") {
      // f = 1 / (2*pi * sqrt(LC))
      // Let's set matching values: L = 100mH, C = 25uF, f = ~100Hz
      onChange({ ...state, r: 50, l: 100, c: 25, freq: 100 });
    }
  };

  // Helper to change slider parameters
  const handleParamChange = (key: keyof ComplexSimState, val: number) => {
    onChange({
      ...state,
      [key]: val
    });
  };

  // Handle Play/Pause animation time
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const update = () => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        
        setTime((prev) => prev + delta);
        
        // Auto-increment rotation angle in graphics mode
        if (state.mode === "graphics") {
          onChange({
            ...state,
            angle: (state.angle + 0.5 * delta) % (Math.PI * 2)
          });
        }
        
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
  }, [isPlaying, state.mode, state.angle, onChange]);

  // Click & Drag handlers on Argand plane
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state.mode !== "argand" && state.mode !== "fractal") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (state.mode === "argand") {
      setIsDragging(true);
      updateArgandCoords(x, y, rect.width, rect.height);
    } else if (state.mode === "fractal") {
      setIsDragging(true);
      // Panning fractal
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.mode === "argand") {
      updateArgandCoords(x, y, rect.width, rect.height);
    } else if (state.mode === "fractal") {
      // Pan fractal by subtracting delta
      const dx = e.movementX / (rect.width * 0.4 * fractalZoom);
      const dy = e.movementY / (rect.height * 0.4 * fractalZoom);
      setFractalOffsetX((prev) => prev - dx);
      setFractalOffsetY((prev) => prev + dy); // vertical flip
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    if (state.mode === "fractal" && canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updateArgandCoords = (x: number, y: number, width: number, height: number) => {
    // Map screen x, y back to complex coordinates (range e.g. -4 to 4)
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const scale = Math.min(width, height) * 0.12; // pixels per unit
    
    const realVal = (x - centerX) / scale;
    const imagVal = -(y - centerY) / scale; // vertical flip in canvas
    
    onChange({
      ...state,
      real: Math.max(-4.5, Math.min(4.5, parseFloat(realVal.toFixed(2)))),
      imag: Math.max(-4.5, Math.min(4.5, parseFloat(imagVal.toFixed(2))))
    });
  };

  // Reset fractal zoom/offsets
  const resetFractal = () => {
    setFractalOffsetX(fractalType === "mandelbrot" ? -0.5 : 0);
    setFractalOffsetY(0);
    setFractalZoom(1.2);
  };

  // Redraw Canvas content based on the active mode
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
      drawAll();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const drawAll = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      
      // Clear with dark blue-black background
      ctx.clearRect(0, 0, w, h);
      
      // Draw grid
      drawTechGrid(ctx, w, h);
      
      switch (state.mode) {
        case "argand":
          drawArgand(ctx, w, h);
          break;
        case "electrical":
          drawElectrical(ctx, w, h);
          break;
        case "quantum":
          drawQuantum(ctx, w, h);
          break;
        case "fourier":
          drawFourier(ctx, w, h);
          break;
        case "graphics":
          drawGraphics(ctx, w, h);
          break;
        case "fractal":
          drawFractal(ctx, w, h);
          break;
      }
    };

    const drawTechGrid = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.strokeStyle = "rgba(51, 65, 85, 0.15)";
      c.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
    };

    // 1. Argand Diagram Drawer
    const drawArgand = (c: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w * 0.5;
      const centerY = h * 0.5;
      const scale = Math.min(w, h) * 0.12; // scale factor
      
      // Draw Axes
      c.strokeStyle = "rgba(255, 255, 255, 0.3)";
      c.lineWidth = 1.5;
      
      // X Axis (Real)
      c.beginPath();
      c.moveTo(20, centerY);
      c.lineTo(w - 20, centerY);
      c.stroke();
      
      // Y Axis (Imaginary)
      c.beginPath();
      c.moveTo(centerX, 20);
      c.lineTo(centerX, h - 20);
      c.stroke();

      // Draw axis arrows
      c.fillStyle = "rgba(255, 255, 255, 0.4)";
      // Real axis label
      c.font = "bold 10px font-mono, sans-serif";
      c.fillText("អ័ក្សពិត (Real Axis — Re)", w - 140, centerY - 8);
      // Imag axis label
      c.fillText("អ័ក្សនិម្មិត (Imaginary Axis — Im)", centerX + 8, 30);

      // Draw tick marks and labels
      c.fillStyle = "rgba(255, 255, 255, 0.2)";
      c.font = "9px font-mono, sans-serif";
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        // Real ticks
        const tx = centerX + i * scale;
        c.beginPath();
        c.moveTo(tx, centerY - 4);
        c.lineTo(tx, centerY + 4);
        c.stroke();
        c.fillText(i.toString(), tx - 3, centerY + 16);
        
        // Imag ticks
        const ty = centerY - i * scale;
        c.beginPath();
        c.moveTo(centerX - 4, ty);
        c.lineTo(centerX + 4, ty);
        c.stroke();
        c.fillText(`${i}i`, centerX + 8, ty + 3);
      }

      // Origin point circle
      c.beginPath();
      c.arc(centerX, centerY, 3, 0, Math.PI * 2);
      c.fillStyle = "rgba(255, 255, 255, 0.4)";
      c.fill();

      // Main Vector Z
      const zx = centerX + state.real * scale;
      const zy = centerY - state.imag * scale; // vertical flip
      
      // Projected dashed lines
      c.strokeStyle = "rgba(6, 182, 212, 0.3)"; // cyan-500/30
      c.setLineDash([3, 3]);
      c.lineWidth = 1;
      
      // Horizontal projection to Im axis
      c.beginPath();
      c.moveTo(zx, zy);
      c.lineTo(centerX, zy);
      c.stroke();
      
      // Vertical projection to Re axis
      c.beginPath();
      c.moveTo(zx, zy);
      c.lineTo(zx, centerY);
      c.stroke();
      
      c.setLineDash([]); // Reset dashed

      // Modulus angle arc
      const mod = Math.sqrt(state.real * state.real + state.imag * state.imag);
      const angleRad = Math.atan2(state.imag, state.real);
      if (mod > 0.5) {
        c.beginPath();
        c.arc(centerX, centerY, 30, 0, -angleRad, angleRad < 0);
        c.strokeStyle = "rgba(234, 179, 8, 0.5)"; // yellow
        c.lineWidth = 1.5;
        c.stroke();
        
        // Draw theta label
        const thetaDeg = ((angleRad * 180) / Math.PI).toFixed(0);
        c.fillStyle = "#eab308";
        c.fillText(`θ = ${thetaDeg}°`, centerX + 35 * Math.cos(angleRad / 2), centerY - 35 * Math.sin(angleRad / 2) + 3);
      }

      // Draw optional Conjugate z_bar
      if (showConjugate) {
        const cx = centerX + state.real * scale;
        const cy = centerY + state.imag * scale; // conjugate: real, -imag
        drawVector(c, centerX, centerY, cx, cy, "rgba(168, 85, 247, 0.6)", "z̄ = a - bi", 1.5);
      }

      // Draw optional Squared z^2
      if (showSquare) {
        // (a+bi)^2 = (a^2 - b^2) + 2abi
        const sqReal = state.real * state.real - state.imag * state.imag;
        const sqImag = 2 * state.real * state.imag;
        const sx = centerX + sqReal * scale;
        const sy = centerY - sqImag * scale;
        drawVector(c, centerX, centerY, sx, sy, "rgba(249, 115, 22, 0.6)", "z² = (a²-b²) + 2abi", 1.5);
      }

      // Draw optional Inverse 1/z
      if (showInverse && mod > 0.1) {
        // 1/z = (a - bi) / (a^2 + b^2)
        const d = state.real * state.real + state.imag * state.imag;
        const invReal = state.real / d;
        const invImag = -state.imag / d;
        const ix = centerX + invReal * scale;
        const iy = centerY - invImag * scale;
        // Inverse is usually very small, let's draw it clearly
        drawVector(c, centerX, centerY, ix, iy, "rgba(236, 72, 153, 0.7)", "1/z", 2);
      }

      // Draw main Vector Z (Bright glowing cyan)
      drawVector(c, centerX, centerY, zx, zy, "#06b6d4", "z = a + bi", 3);
      
      // Interactive Handle at Z
      c.beginPath();
      c.arc(zx, zy, 8, 0, Math.PI * 2);
      c.fillStyle = "#06b6d4";
      c.fill();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.stroke();
      
      // Draw outer glowing ring
      c.beginPath();
      c.arc(zx, zy, 14, 0, Math.PI * 2);
      c.strokeStyle = "rgba(6, 182, 212, 0.3)";
      c.lineWidth = 1;
      c.stroke();

      // Math Details HUD Overlay on Left
      c.fillStyle = "rgba(15, 23, 42, 0.85)";
      c.strokeStyle = "rgba(255, 255, 255, 0.1)";
      c.lineWidth = 1;
      roundRect(c, 25, h - 130, 240, 105, 12);
      c.fill();
      c.stroke();

      c.fillStyle = "#f8fafc";
      c.font = "bold 11px font-sans, sans-serif";
      c.fillText("ទិន្នន័យចំណុចកុំផ្លិច (Complex HUD)", 35, h - 112);
      
      c.font = "10px font-mono, monospace";
      c.fillStyle = "#22d3ee"; // cyan
      c.fillText(`កូអរដោនេ: z = ${state.real} + ${state.imag}i`, 35, h - 94);
      c.fillStyle = "#cbd5e1";
      c.fillText(`តម្លៃដាច់ខាត: |z| = r = ${mod.toFixed(2)}`, 35, h - 78);
      const angleVal = angleRad < 0 ? angleRad + Math.PI * 2 : angleRad;
      c.fillText(`មុំផាស (Phase): θ = ${angleVal.toFixed(2)} rad`, 35, h - 62);
      c.fillStyle = "#eab308";
      c.fillText(`ទម្រង់ប៉ូលែ: z = ${mod.toFixed(2)} × e^(${angleVal.toFixed(2)}i)`, 35, h - 46);
    };

    const drawVector = (c: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, label: string, thickness: number) => {
      c.strokeStyle = color;
      c.lineWidth = thickness;
      c.beginPath();
      c.moveTo(fromX, fromY);
      c.lineTo(toX, toY);
      c.stroke();

      // Arrow head
      const angle = Math.atan2(toY - fromY, toX - fromX);
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(toX, toY);
      c.lineTo(toX - 10 * Math.cos(angle - Math.PI / 6), toY - 10 * Math.sin(angle - Math.PI / 6));
      c.lineTo(toX - 10 * Math.cos(angle + Math.PI / 6), toY - 10 * Math.sin(angle + Math.PI / 6));
      c.fill();

      // Label at vector tip
      c.fillStyle = color;
      c.font = "bold 10px font-sans, sans-serif";
      c.fillText(label, toX + 12 * Math.cos(angle), toY + 12 * Math.sin(angle) + 3);
    };

    // 2. Electrical Engineering (AC RLC Circuit Analysis)
    const drawElectrical = (c: CanvasRenderingContext2D, w: number, h: number) => {
      // Split viewport: Left 45% is the Complex Impedance plane, Right 55% is the Waveforms
      const impWidth = w * 0.45;
      const waveWidth = w * 0.55;
      
      const impCenterX = impWidth * 0.5;
      const impCenterY = h * 0.5;
      const impScale = Math.min(impWidth, h) * 0.0035; // Pixels per ohm
      
      // Math Calculations
      // L unit is mH, C is uF, f is Hz
      const omega = 2 * Math.PI * state.freq;
      const R = state.r; // ohms
      const XL = omega * (state.l / 1000); // inductive reactance (ohms)
      const XC = 1 / (omega * (state.c / 1000000)); // capacitive reactance (ohms)
      const X = XL - XC; // net reactance
      const Z_mag = Math.sqrt(R * R + X * X); // Modulus of Impedance
      const phase_angle = Math.atan2(X, R); // Impedance Phase angle (phi)

      // --- Left Column: Impedance Complex Vector Plane ---
      // Draw axes
      c.strokeStyle = "rgba(255, 255, 255, 0.2)";
      c.lineWidth = 1;
      // Real axis
      c.beginPath();
      c.moveTo(10, impCenterY);
      c.lineTo(impWidth - 10, impCenterY);
      c.stroke();
      // Imag axis
      c.beginPath();
      c.moveTo(impCenterX, 10);
      c.lineTo(impCenterX, h - 10);
      c.stroke();

      c.fillStyle = "rgba(255, 255, 255, 0.4)";
      c.font = "8px font-mono, monospace";
      c.fillText("រេស៊ីស្តង់ R (Re)", impWidth - 65, impCenterY - 6);
      c.fillText("រេអាក់តង់ jX (Im)", impCenterX + 5, 20);

      // Draw R vector (horizontal - real axis)
      const rx = impCenterX + R * impScale;
      c.strokeStyle = "#10b981"; // emerald-500
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(impCenterX, impCenterY);
      c.lineTo(rx, impCenterY);
      c.stroke();
      c.fillStyle = "#10b981";
      c.fillText(`R = ${R.toFixed(0)}Ω`, rx - 10, impCenterY + 14);

      // Draw XL vector (upward imaginary)
      const xl_y = impCenterY - XL * impScale;
      c.strokeStyle = "#38bdf8"; // sky-400
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(impCenterX, impCenterY);
      c.lineTo(impCenterX, xl_y);
      c.stroke();
      c.fillStyle = "#38bdf8";
      c.fillText(`jXL = +${XL.toFixed(1)}Ω`, impCenterX - 75, xl_y + 3);

      // Draw XC vector (downward imaginary)
      const xc_y = impCenterY + XC * impScale;
      c.strokeStyle = "#f43f5e"; // rose-500
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(impCenterX, impCenterY);
      c.lineTo(impCenterX, xc_y);
      c.stroke();
      c.fillStyle = "#f43f5e";
      c.fillText(`-jXC = -${XC.toFixed(1)}Ω`, impCenterX - 75, xc_y + 3);

      // Draw total impedance Z = R + j(XL - XC)
      const z_y = impCenterY - X * impScale;
      drawVector(c, impCenterX, impCenterY, rx, z_y, "#a855f7", `Z = ${Z_mag.toFixed(1)}Ω`, 3);

      // Label angle phi
      if (Z_mag > 15) {
        c.beginPath();
        c.arc(impCenterX, impCenterY, 20, 0, -phase_angle, phase_angle < 0);
        c.strokeStyle = "rgba(168, 85, 247, 0.4)";
        c.stroke();
        c.fillStyle = "#a855f7";
        c.fillText(`φ = ${((phase_angle * 180) / Math.PI).toFixed(1)}°`, impCenterX + 22, impCenterY - 5 * Math.sin(phase_angle / 2) + 3);
      }

      // --- Right Column: Live Scrolling AC Waves ---
      const waveStartX = impWidth + 10;
      const waveHeight = h - 60;
      const waveCenterY = waveHeight * 0.5 + 20;
      
      // Separator line
      c.strokeStyle = "rgba(255, 255, 255, 0.1)";
      c.beginPath();
      c.moveTo(impWidth, 10);
      c.lineTo(impWidth, h - 10);
      c.stroke();

      // Draw oscilloscope background grid
      c.fillStyle = "rgba(15, 23, 42, 0.6)";
      c.fillRect(waveStartX, 20, waveWidth - 20, waveHeight);
      c.strokeStyle = "rgba(51, 65, 85, 0.3)";
      for (let x = waveStartX; x < waveStartX + waveWidth - 20; x += 30) {
        c.beginPath();
        c.moveTo(x, 20);
        c.lineTo(x, 20 + waveHeight);
        c.stroke();
      }
      for (let y = 20; y < 20 + waveHeight; y += 30) {
        c.beginPath();
        c.moveTo(waveStartX, y);
        c.lineTo(waveStartX + waveWidth - 20, y);
        c.stroke();
      }

      // Center baseline
      c.strokeStyle = "rgba(255, 255, 255, 0.2)";
      c.beginPath();
      c.moveTo(waveStartX, waveCenterY);
      c.lineTo(waveStartX + waveWidth - 20, waveCenterY);
      c.stroke();

      // Oscilloscope labels
      c.fillStyle = "#cbd5e1";
      c.font = "bold 11px font-sans, sans-serif";
      c.fillText("ទម្រង់រលកតង់ស្យុង (V) និងចរន្ត (I) ពេលវេលាពិត (AC Oscilloscope)", waveStartX + 15, 38);

      // Draw AC Voltage Wave (Cyan) & Current Wave (Yellow)
      // v(t) = V0 * sin(omega * t)
      // i(t) = I0 * sin(omega * t - phi)
      const voltageAmp = 40;
      // Current amplitude scale is relative to impedance
      const currentAmp = Math.min(60, (voltageAmp / Z_mag) * 45); 

      c.lineWidth = 2;
      
      // Plot paths
      c.beginPath();
      c.strokeStyle = "#38bdf8"; // Voltage - Sky blue
      for (let x = 0; x < waveWidth - 40; x++) {
        const tVal = time * 4 + x * 0.05;
        const v = voltageAmp * Math.sin(tVal);
        const screenX = waveStartX + 10 + x;
        const screenY = waveCenterY - v;
        if (x === 0) c.moveTo(screenX, screenY);
        else c.lineTo(screenX, screenY);
      }
      c.stroke();

      c.beginPath();
      c.strokeStyle = "#fbbf24"; // Current - Amber yellow
      for (let x = 0; x < waveWidth - 40; x++) {
        const tVal = time * 4 + x * 0.05;
        // Current lags voltage by phase_angle
        const i = currentAmp * Math.sin(tVal - phase_angle);
        const screenX = waveStartX + 10 + x;
        const screenY = waveCenterY - i;
        if (x === 0) c.moveTo(screenX, screenY);
        else c.lineTo(screenX, screenY);
      }
      c.stroke();

      // Legend & phase indicator
      c.font = "9px font-mono, monospace";
      c.fillStyle = "#38bdf8";
      c.fillRect(waveStartX + 15, waveCenterY + waveHeight * 0.35, 10, 6);
      c.fillText(`តង់ស្យុង v(t) = V₀·sin(ωt)`, waveStartX + 30, waveCenterY + waveHeight * 0.37);

      c.fillStyle = "#fbbf24";
      c.fillRect(waveStartX + waveWidth * 0.5, waveCenterY + waveHeight * 0.35, 10, 6);
      c.fillText(`ចរន្ត i(t) = I₀·sin(ωt - φ)`, waveStartX + waveWidth * 0.5 + 15, waveCenterY + waveHeight * 0.37);

      // Dynamic phase relationship helper text
      c.fillStyle = "#cbd5e1";
      c.font = "bold 9px font-sans, sans-serif";
      let shiftText = "";
      let shiftColor = "";
      if (Math.abs(X) < 0.5) {
        shiftText = "សៀគ្វីស្ថិតក្នុងសភាពអនុលោម (Resonant Circuit): ផាសដូចគ្នា φ = 0";
        shiftColor = "#10b981";
      } else if (X > 0) {
        shiftText = "សៀគ្វីលំអៀងទៅខាងអាំងឌុចទីវ (Inductive Circuit): ចរន្តយឺតជាងតង់ស្យុង (Current Lags Voltage)";
        shiftColor = "#38bdf8";
      } else {
        shiftText = "សៀគ្វីលំអៀងទៅខាងកាប៉ាស៊ីទីវ (Capacitive Circuit): ចរន្តលឿនជាងតង់ស្យុង (Current Leads Voltage)";
        shiftColor = "#f43f5e";
      }
      c.fillStyle = shiftColor;
      c.fillText(shiftText, waveStartX + 15, waveCenterY + waveHeight * 0.43);
    };

    // 3. Quantum Mechanics (Schrödinger Wave Function Dynamics)
    const drawQuantum = (c: CanvasRenderingContext2D, w: number, h: number) => {
      const centerY = h * 0.5;
      const waveLength = w - 80;
      
      // Technical horizontal axis
      c.strokeStyle = "rgba(255, 255, 255, 0.15)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(40, centerY);
      c.lineTo(w - 40, centerY);
      c.stroke();

      c.fillStyle = "rgba(255, 255, 255, 0.4)";
      c.font = "8px font-mono, monospace";
      c.fillText("-x (Space)", 45, centerY - 10);
      c.fillText("+x (Space)", w - 85, centerY - 10);

      // Model parameters based on sliders
      const k = 0.08; // wave momentum (spatial frequency)
      const omega = 1.8 * state.energy; // wave energy (temporal frequency)
      const envelopeWidth = 140; // width of Gaussian wavepacket envelope
      const centerPos = (w * 0.5); // Center of wavepacket

      // Lists for paths
      const rePoints: [number, number][] = [];
      const imPoints: [number, number][] = [];
      const probPoints: [number, number][] = [];

      // Generate points
      for (let xScreen = 40; xScreen < w - 40; xScreen++) {
        // Calculate coordinate relative to center
        const dx = xScreen - centerPos;
        // Gaussian envelope function: e^(-x^2 / 2s^2)
        const envelope = Math.exp(-(dx * dx) / (2 * envelopeWidth * envelopeWidth));
        
        // Complex phase value inside: exp(i * (kx - wt))
        const phaseVal = k * dx - omega * time;
        
        // Complex components
        const re = envelope * 70 * Math.cos(phaseVal); // real part (cosine)
        const im = envelope * 70 * Math.sin(phaseVal); // imag part (sine)
        const prob = envelope * envelope * 85;       // probability density |psi|^2
        
        rePoints.push([xScreen, centerY - re]);
        imPoints.push([xScreen, centerY - im]);
        probPoints.push([xScreen, centerY - prob]);
      }

      // Draw Probability Density Area (Stationary yellow translucent envelope)
      c.fillStyle = "rgba(234, 179, 8, 0.08)";
      c.beginPath();
      c.moveTo(probPoints[0][0], centerY);
      for (const p of probPoints) {
        c.lineTo(p[0], p[1]);
      }
      c.lineTo(probPoints[probPoints.length - 1][0], centerY);
      c.closePath();
      c.fill();
      
      // Draw Probability Density outline
      c.strokeStyle = "rgba(234, 179, 8, 0.5)"; // yellow
      c.lineWidth = 1.5;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(probPoints[0][0], probPoints[0][1]);
      for (let i = 1; i < probPoints.length; i++) {
        c.lineTo(probPoints[i][0], probPoints[i][1]);
      }
      c.stroke();
      c.setLineDash([]);

      // Draw Imaginary Part wave (Rose pink)
      c.strokeStyle = "rgba(236, 72, 153, 0.8)"; // pink-500
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(imPoints[0][0], imPoints[0][1]);
      for (let i = 1; i < imPoints.length; i++) {
        c.lineTo(imPoints[i][0], imPoints[i][1]);
      }
      c.stroke();

      // Draw Real Part wave (Cyan)
      c.strokeStyle = "#22d3ee"; // cyan-400
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(rePoints[0][0], rePoints[0][1]);
      for (let i = 1; i < rePoints.length; i++) {
        c.lineTo(rePoints[i][0], rePoints[i][1]);
      }
      c.stroke();

      // Legend labels on top right
      c.fillStyle = "rgba(15, 23, 42, 0.85)";
      roundRect(c, w - 240, 20, 220, 105, 10);
      c.fill();
      c.strokeStyle = "rgba(255, 255, 255, 0.1)";
      c.stroke();

      c.font = "bold 10px font-sans, sans-serif";
      c.fillStyle = "#cbd5e1";
      c.fillText("សមីការ Schrodinger (Wave Mechanics)", w - 225, 38);

      c.font = "9px font-mono, monospace";
      c.fillStyle = "#22d3ee"; // cyan
      c.fillRect(w - 225, 52, 12, 6);
      c.fillText("ផ្នែកពិត Re(Ψ) = A·cos(kx-ωt)", w - 205, 58);

      c.fillStyle = "#ec4899"; // pink
      c.fillRect(w - 225, 70, 12, 6);
      c.fillText("ផ្នែកនិម្មិត Im(Ψ) = A·sin(kx-ωt)", w - 205, 76);

      c.fillStyle = "#fbbf24"; // yellow
      c.fillRect(w - 225, 88, 12, 6);
      c.fillText("កម្រិតប្រូបាប៊ីលីតេ |Ψ|² = Re² + Im²", w - 205, 94);

      c.fillStyle = "rgba(255, 255, 255, 0.6)";
      c.fillText("Ψ(x,t) = Ae^(i(kx - ωt))", w - 225, 114);

      // Live formula readout at bottom
      c.font = "bold 11px font-sans, sans-serif";
      c.fillStyle = "#cbd5e1";
      c.fillText("មេកានិចកង់ទិច៖ ភាគល្អិតតូចៗដូចជាអេឡិចត្រុង ត្រូវបានតំណាងដោយ 'រលកកុំផ្លិច (Complex Wave Function)' ដែលកម្ពស់ផ្នែកពិត និងផ្នែកនិម្មិតវិលឆ្លាស់គ្នា។", 40, h - 30);
    };

    // 4. Digital Signal Processing & Fourier Transform (Phasor Epicycles)
    const drawFourier = (c: CanvasRenderingContext2D, w: number, h: number) => {
      // Split layout: Left 45% is rotating vectors (epicycles), Right 55% is the resulting time-domain wave
      const leftWidth = w * 0.42;
      const rightWidth = w * 0.58;
      
      const centerX = leftWidth * 0.5 + 20;
      const centerY = h * 0.5;
      const scale = 50; // master amplitude scaler

      const waveStartX = leftWidth + 10;
      
      // Calculate rotating phasors tip-to-tail
      const theta = time * 1.5; // fundamental frequency rotation rate
      let currentX = centerX;
      let currentY = centerY;

      const harmonicsData: { r: number; freq: number; phase: number }[] = [];

      // Determine harmonics based on wave type
      if (fourierWaveType === "square") {
        // Square wave: odd harmonics 1, 3, 5, 7... with amplitude 4/(n * pi)
        for (let i = 0; i < numHarmonics; i++) {
          const n = 2 * i + 1;
          const amp = (4 / (n * Math.PI)) * scale;
          harmonicsData.push({ r: amp, freq: n, phase: 0 });
        }
      } else if (fourierWaveType === "sawtooth") {
        // Sawtooth wave: all harmonics 1, 2, 3, 4... with amplitude 2/(n * pi) * (-1)^n
        for (let i = 1; i <= numHarmonics + 1; i++) {
          const amp = (2 / (i * Math.PI)) * scale;
          const sign = i % 2 === 0 ? -1 : 1;
          harmonicsData.push({ r: amp * sign, freq: i, phase: 0 });
        }
      } else if (fourierWaveType === "triangle") {
        // Triangle wave: odd harmonics with amplitude 8/(n^2 * pi^2) * (-1)^((n-1)/2)
        for (let i = 0; i < numHarmonics; i++) {
          const n = 2 * i + 1;
          const sign = i % 2 === 0 ? 1 : -1;
          const amp = (8 / (n * n * Math.PI * Math.PI)) * scale * sign;
          harmonicsData.push({ r: amp, freq: n, phase: 0 });
        }
      }

      // Draw phasor vectors tip to tail
      c.lineWidth = 1;
      harmonicsData.forEach((hVal, idx) => {
        const phi = hVal.freq * theta + hVal.phase;
        const nextX = currentX + hVal.r * Math.cos(phi);
        const nextY = currentY - hVal.r * Math.sin(phi); // canvas y-up inverse

        // Draw rotating circle guide
        c.strokeStyle = "rgba(6, 182, 212, 0.12)"; // cyan-500 translucent
        c.beginPath();
        c.arc(currentX, currentY, Math.abs(hVal.r), 0, Math.PI * 2);
        c.stroke();

        // Draw vector arrow
        const colorVal = idx === 0 ? "#06b6d4" : idx === 1 ? "#a855f7" : "rgba(255, 255, 255, 0.4)";
        c.strokeStyle = colorVal;
        c.fillStyle = colorVal;
        c.beginPath();
        c.moveTo(currentX, currentY);
        c.lineTo(nextX, nextY);
        c.stroke();
        
        // Draw small dot at node
        c.beginPath();
        c.arc(nextX, nextY, 2, 0, Math.PI * 2);
        c.fill();

        currentX = nextX;
        currentY = nextY;
      });

      // The final coordinate currentY is our synthesized wave's value at this time step!
      // Draw a connecting horizontal line from the final tip to the scrolling waveform start
      c.strokeStyle = "rgba(234, 179, 8, 0.4)"; // yellow dashed line
      c.setLineDash([2, 2]);
      c.beginPath();
      c.moveTo(currentX, currentY);
      c.lineTo(waveStartX, currentY);
      c.stroke();
      c.setLineDash([]);

      // Draw scrolling wave in the right oscilloscope window
      c.strokeStyle = "rgba(255, 255, 255, 0.1)";
      c.beginPath();
      c.moveTo(waveStartX, 20);
      c.lineTo(waveStartX, h - 20);
      c.stroke();

      // Osc background grid
      c.fillStyle = "rgba(15, 23, 42, 0.5)";
      c.fillRect(waveStartX, 20, rightWidth - 30, h - 40);
      c.strokeStyle = "rgba(51, 65, 85, 0.2)";
      for (let x = waveStartX; x < waveStartX + rightWidth - 30; x += 40) {
        c.beginPath();
        c.moveTo(x, 20);
        c.lineTo(x, h - 20);
        c.stroke();
      }

      // Plots of the synthesized wave over a history of time steps
      c.beginPath();
      c.strokeStyle = "#eab308"; // Glowing yellow synthesized wave
      c.lineWidth = 2.5;

      for (let x = 0; x < rightWidth - 45; x++) {
        // Calculate historical time for this screen position
        const histT = theta - x * 0.05; 
        let sumY = centerY;
        
        harmonicsData.forEach((hVal) => {
          const phi = hVal.freq * histT + hVal.phase;
          sumY -= hVal.r * Math.sin(phi); // Accumulate components
        });

        const screenX = waveStartX + x;
        if (x === 0) c.moveTo(screenX, sumY);
        else c.lineTo(screenX, sumY);
      }
      c.stroke();

      // Labels & metadata
      c.fillStyle = "#cbd5e1";
      c.font = "bold 11px font-sans, sans-serif";
      const waveNamesKhmer = {
        square: "រលកការ៉េ (Square Wave)",
        sawtooth: "រលកធ្មេញរណារ (Sawtooth Wave)",
        triangle: "រលកត្រីកោណ (Triangle Wave)"
      };
      c.fillText(`បម្លែង Fourier និងការសំយោគរលក៖ ${waveNamesKhmer[fourierWaveType]}`, waveStartX + 15, 38);
      c.font = "9px font-mono, monospace";
      c.fillStyle = "rgba(255, 255, 255, 0.5)";
      c.fillText(`ចំនួនតួសំយោគ (Harmonics): ${numHarmonics}`, waveStartX + 15, h - 30);
      c.fillText(`សមីការ Fourier៖ f(t) = ∑ A_n · sin(n·ω·t)`, waveStartX + 15, h - 45);

      // Red dot at current signal point on the curve
      c.fillStyle = "#ef4444";
      c.beginPath();
      c.arc(waveStartX, currentY, 4, 0, Math.PI * 2);
      c.fill();
    };

    // 5. Computer Graphics (2D & 3D coordinate rotations with Complex Exponentials)
    const drawGraphics = (c: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w * 0.5;
      const centerY = h * 0.5;

      if (graphicsDimension === "2D") {
        // Draw 2D Cartesian grid
        c.strokeStyle = "rgba(255, 255, 255, 0.1)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(centerX, 20); c.lineTo(centerX, h - 20);
        c.moveTo(20, centerY); c.lineTo(w - 20, centerY);
        c.stroke();

        const scale = 80;
        // Let's define vertices of a triangle/star shape to rotate
        // Vertices represent complex numbers: v0, v1, v2
        const vertices = [
          { x: 0, y: 1.2 },
          { x: -1, y: -0.6 },
          { x: 1, y: -0.6 }
        ];

        const rotAngle = state.angle; // rotated angle in radians
        // Complex multiplier: e^(i * rotAngle) = cos(rotAngle) + i * sin(rotAngle)
        const rotReal = Math.cos(rotAngle);
        const rotImag = Math.sin(rotAngle);

        // Calculate rotated vertices
        // (x + iy) * (cosθ + i sinθ) = (x cosθ - y sinθ) + i (x sinθ + y cosθ)
        const rotVertices = vertices.map((v) => {
          const rx = v.x * rotReal - v.y * rotImag;
          const ry = v.x * rotImag + v.y * rotReal;
          return { x: rx, y: ry };
        });

        // Draw original shape in dark transparent blue
        c.strokeStyle = "rgba(255, 255, 255, 0.15)";
        c.fillStyle = "rgba(255, 255, 255, 0.02)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(centerX + vertices[0].x * scale, centerY - vertices[0].y * scale);
        for (let i = 1; i < vertices.length; i++) {
          c.lineTo(centerX + vertices[i].x * scale, centerY - vertices[i].y * scale);
        }
        c.closePath();
        c.stroke();
        c.fill();

        // Draw rotated shape in glowing cyan
        c.strokeStyle = "#06b6d4"; // cyan
        c.fillStyle = "rgba(6, 182, 212, 0.15)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(centerX + rotVertices[0].x * scale, centerY - rotVertices[0].y * scale);
        for (let i = 1; i < rotVertices.length; i++) {
          c.lineTo(centerX + rotVertices[i].x * scale, centerY - rotVertices[i].y * scale);
        }
        c.closePath();
        c.stroke();
        c.fill();

        // Draw rotation arc
        c.strokeStyle = "#fbbf24";
        c.beginPath();
        c.arc(centerX, centerY, 50, 0, -rotAngle, true);
        c.stroke();

        // Draw vertex labels
        c.fillStyle = "#ffffff";
        c.font = "bold 9px font-mono, monospace";
        rotVertices.forEach((v, idx) => {
          const vx = centerX + v.x * scale;
          const vy = centerY - v.y * scale;
          c.beginPath();
          c.arc(vx, vy, 4, 0, Math.PI * 2);
          c.fillStyle = "#22d3ee";
          c.fill();
          
          c.fillStyle = "#cbd5e1";
          c.fillText(`v${idx}': (${v.x.toFixed(2)} + ${v.y.toFixed(2)}i)`, vx + 8, vy - 4);
        });

        // Formula display HUD
        c.fillStyle = "rgba(15, 23, 42, 0.9)";
        roundRect(c, 25, 25, 340, 100, 10);
        c.fill();
        c.strokeStyle = "rgba(255, 255, 255, 0.1)";
        c.stroke();

        c.fillStyle = "#f8fafc";
        c.font = "bold 10px font-sans, sans-serif";
        c.fillText("ការបង្វិលកូអរដោនេ 2D តាមវិធីគុណចំនួនកុំផ្លិច", 35, 42);
        c.font = "9px font-mono, monospace";
        c.fillStyle = "#38bdf8";
        c.fillText(`មុំបង្វិល θ = ${((rotAngle * 180) / Math.PI).toFixed(0)}°`, 35, 58);
        c.fillStyle = "#a855f7";
        c.fillText(`ចំនួនកុំផ្លិចបង្វិល: R_rot = cosθ + i·sinθ`, 35, 74);
        c.fillStyle = "#eab308";
        c.fillText(`រូបមន្ត៖ z' = z · R_rot = (x+iy)(cosθ+i·sinθ)`, 35, 90);
        c.fillText(`= (x·cosθ - y·sinθ) + i(x·sinθ + y·cosθ)`, 35, 106);

      } else {
        // 3D wireframe Cube Rotation using projection matrices & quaternions explanation
        const cubeScale = Math.min(w, h) * 0.22;
        
        // Vertices of a 3D unit cube
        const vertices3D = [
          { x: -1, y: -1, z: -1 },
          { x: 1, y: -1, z: -1 },
          { x: 1, y: 1, z: -1 },
          { x: -1, y: 1, z: -1 },
          { x: -1, y: -1, z: 1 },
          { x: 1, y: -1, z: 1 },
          { x: 1, y: 1, z: 1 },
          { x: -1, y: 1, z: 1 }
        ];

        // Edge connections for cube
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // Back face
          [4, 5], [5, 6], [6, 7], [7, 4], // Front face
          [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
        ];

        // Rotate vertices in 3D about Y and X axes
        const angleY = state.angle;
        const angleX = state.angle * 0.4; // Rotate slower on X

        const rotated3D = vertices3D.map((v) => {
          // Rotate around Y axis
          const cosY = Math.cos(angleY);
          const sinY = Math.sin(angleY);
          const x1 = v.x * cosY - v.z * sinY;
          const z1 = v.x * sinY + v.z * cosY;

          // Rotate around X axis
          const cosX = Math.cos(angleX);
          const sinX = Math.sin(angleX);
          const y2 = v.y * cosX - z1 * sinX;
          const z2 = v.y * sinX + z1 * cosX;

          // Perspective projection: d is camera distance
          const d = 3.5;
          const projScale = d / (d + z2);
          const screenX = centerX + x1 * cubeScale * projScale;
          const screenY = centerY - y2 * cubeScale * projScale;

          return { x: screenX, y: screenY };
        });

        // Draw edges with glowing blue/purple gradient lines
        c.lineWidth = 2;
        edges.forEach((edge, idx) => {
          const p1 = rotated3D[edge[0]];
          const p2 = rotated3D[edge[1]];
          
          c.strokeStyle = idx < 4 
            ? "rgba(6, 182, 212, 0.7)"  // Back face is blue
            : idx < 8 
              ? "rgba(168, 85, 247, 0.9)" // Front face is purple
              : "rgba(255, 255, 255, 0.35)"; // connectors are white-ish
              
          c.beginPath();
          c.moveTo(p1.x, p1.y);
          c.lineTo(p2.x, p2.y);
          c.stroke();
        });

        // Draw small floating vertex dots
        rotated3D.forEach((v) => {
          c.beginPath();
          c.arc(v.x, v.y, 4, 0, Math.PI * 2);
          c.fillStyle = "#ffffff";
          c.fill();
        });

        // Quaternion theory box on top left
        c.fillStyle = "rgba(15, 23, 42, 0.85)";
        roundRect(c, 25, 25, 330, 95, 10);
        c.fill();
        c.strokeStyle = "rgba(255, 255, 255, 0.1)";
        c.stroke();

        c.fillStyle = "#f8fafc";
        c.font = "bold 10px font-sans, sans-serif";
        c.fillText("ក្រាហ្វិក 3D & Quaternions (ចំនួនកុំផ្លិចជាន់ខ្ពស់)", 35, 42);
        c.font = "9px font-mono, monospace";
        c.fillStyle = "#38bdf8";
        c.fillText(`គណនាកូអរដោនេ: Y-Axis (θ = ${((angleY * 180)/Math.PI).toFixed(0)}°) X-Axis (θ = ${((angleX * 180)/Math.PI).toFixed(0)}°)`, 35, 58);
        c.fillStyle = "#cbd5e1";
        c.fillText("ក្នុងក្រាហ្វិក 3D (ហ្គេម យន្តហោះ) ការបង្វិលវត្ថុបីវិមាត្រ", 35, 74);
        c.fillText("គឺប្រើ 'Quaternions' q = w + xi + yj + zk ដើម្បីជៀសវាង Gimbal Lock។", 35, 90);
      }
    };

    // 6. Fractals & Complex Geometry (Real-time Mandelbrot & Julia sets)
    const drawFractal = (c: CanvasRenderingContext2D, w: number, h: number) => {
      // Calculate smaller pixel resolution for fast responsive rendering
      const dWidth = 220;
      const dHeight = 140;
      
      const imgData = c.createImageData(dWidth, dHeight);
      const data = imgData.data;

      const maxIter = 40; // Max iterations for escape-time fractal (keeps performance high)
      
      // Mandelbrot vs Julia set calculations
      // Complex bounds scaled by zoom and offsets
      const zoomFactor = 1.8 / fractalZoom;
      const startX = fractalOffsetX - zoomFactor;
      const endX = fractalOffsetX + zoomFactor;
      const startY = fractalOffsetY - (zoomFactor * dHeight) / dWidth;
      const endY = fractalOffsetY + (zoomFactor * dHeight) / dWidth;

      const stepX = (endX - startX) / dWidth;
      const stepY = (endY - startY) / dHeight;

      for (let py = 0; py < dHeight; py++) {
        const cy = endY - py * stepY; // vertical invert
        for (let px = 0; px < dWidth; px++) {
          const cx = startX + px * stepX;
          
          let zr = cx;
          let zi = cy;
          
          let juliaConstReal = juliaReal;
          let juliaConstImag = juliaImag;

          if (fractalType === "mandelbrot") {
            // Mandelbrot: z_0 = 0, c = complex pixel coordinate
            zr = 0;
            zi = 0;
            juliaConstReal = cx;
            juliaConstImag = cy;
          }

          let i = 0;
          while (i < maxIter) {
            const r2 = zr * zr;
            const i2 = zi * zi;
            if (r2 + i2 > 4) break; // Escape radius = 2

            // z_{n+1} = z_n^2 + c
            // (zr + i zi)^2 = (zr^2 - zi^2) + i(2 zr zi)
            const temp = r2 - i2 + juliaConstReal;
            zi = 2 * zr * zi + juliaConstImag;
            zr = temp;
            i++;
          }

          // Coloring based on exit iteration
          const pixelIndex = (py * dWidth + px) * 4;
          if (i === maxIter) {
            // inside set - black
            data[pixelIndex] = 2;
            data[pixelIndex + 1] = 6;
            data[pixelIndex + 2] = 23; // very dark slate-950
            data[pixelIndex + 3] = 255;
          } else {
            // Outside set - colorful escape gradient
            const ratio = i / maxIter;
            data[pixelIndex] = Math.floor(ratio * 120 + 10); // Red
            data[pixelIndex + 1] = Math.floor(ratio * 220 + 30); // Green (cyan tint)
            data[pixelIndex + 2] = Math.floor(ratio * 255 + 50); // Blue
            data[pixelIndex + 3] = 255;
          }
        }
      }

      // Draw the pixel data scaled up to full canvas size with pixelated styling (retro/cool grid feel)
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = dWidth;
      tempCanvas.height = dHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(imgData, 0, 0);
        c.imageSmoothingEnabled = false; // pixel art aesthetic / high performance
        c.drawImage(tempCanvas, 0, 0, w, h);
      }

      // Draw interactive panel instructions & details overlay
      c.fillStyle = "rgba(15, 23, 42, 0.85)";
      roundRect(c, 25, 25, 360, 115, 12);
      c.fill();
      c.strokeStyle = "rgba(255, 255, 255, 0.1)";
      c.stroke();

      c.fillStyle = "#ffffff";
      c.font = "bold 11px font-sans, sans-serif";
      c.fillText(`រូបភាពប្រភាគធរណីមាត្រ (Fractal): សំណុំ ${fractalType === "mandelbrot" ? "Mandelbrot" : "Julia"}`, 35, 42);
      c.font = "9px font-mono, monospace";
      c.fillStyle = "#22d3ee"; // cyan
      c.fillText(`រូបមន្ត៖ z_{n+1} = z_n² + c  (ចំនួនកុំផ្លិចស្វ័យគណនា)`, 35, 58);
      c.fillStyle = "#cbd5e1";
      c.fillText(`ការបង្រួម/ពង្រីក (Zoom): ${fractalZoom.toFixed(1)}x`, 35, 74);
      c.fillText(`ទីតាំងផ្ចិត: X = ${fractalOffsetX.toFixed(3)}, Y = ${fractalOffsetY.toFixed(3)}`, 35, 90);
      
      if (fractalType === "julia") {
        c.fillStyle = "#f43f5e";
        c.fillText(`ប៉ារ៉ាម៉ែត្រថេរ Julia៖ c = ${juliaReal.toFixed(4)} + ${juliaImag.toFixed(4)}i`, 35, 106);
      } else {
        c.fillStyle = "#fbbf24";
        c.fillText("អូសម៉ៅលើរូបភាព ដើម្បីរំកិល និងរុករកផ្ទៃ Mandelbrot", 35, 106);
      }

      c.fillStyle = "rgba(255, 255, 255, 0.7)";
      c.font = "bold 9px font-sans, sans-serif";
      c.fillText("ចុចប៊ូតុង + ឬ - នៅផ្នែកបញ្ជាខាងក្រោម ដើម្បី Zoom ទីតាំង", 35, 125);
    };

    // Helper rounded rect
    const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
    };

    drawAll();
  }, [state, showConjugate, showSquare, showInverse, time, fourierWaveType, numHarmonics, graphicsDimension, fractalType, juliaReal, juliaImag, fractalOffsetX, fractalOffsetY, fractalZoom, isDragging]);

  return (
    <div id="complex-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      
      {/* Simulation Header with Khmer titles */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight flex items-center gap-2">
              ម៉ាស៊ីនពិសោធន៍ចំនួនកុំផ្លិច (Interactive Complex Numbers Simulator)
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              ស្វែងយល់ការអនុវត្តចំនួនកុំផ្លិចក្នុង គណិតវិទ្យា វិស្វកម្មអគ្គិសនី រូបវិទ្យា និងក្រាហ្វិក
            </p>
          </div>
        </div>
        <button
          id="btn-complex-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់ទ្រឹស្តីដោយគ្រូ AI
        </button>
      </div>

      {/* Mode Navigation Tabs (6 modes from uploaded image) */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-black/20 border-b border-white/5 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => onChange({ ...state, mode: "argand" })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "argand"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          1. គណិតវិទ្យា (Math)
        </button>
        <button
          onClick={() => onChange({ ...state, mode: "electrical" })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "electrical"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          2. វិស្វកម្មអគ្គិសនី (RLC)
        </button>
        <button
          onClick={() => onChange({ ...state, mode: "quantum" })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "quantum"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Orbit className="w-3.5 h-3.5" />
          3. កង់ទិច (Quantum)
        </button>
        <button
          onClick={() => onChange({ ...state, mode: "fourier" })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "fourier"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          4. ឌីជីថល (Signal)
        </button>
        <button
          onClick={() => onChange({ ...state, mode: "graphics" })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "graphics"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          5. ក្រាហ្វិក 2D/3D
        </button>
        <button
          onClick={() => {
            onChange({ ...state, mode: "fractal" });
            resetFractal();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state.mode === "fractal"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          6. ប្រភាគធរណីមាត្រ (Fractal)
        </button>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 relative min-h-[350px] md:min-h-[420px] overflow-hidden bg-gradient-to-b from-[#0f172a] to-black">
        {/* Ambient Glow background */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="absolute inset-0 w-full h-full block z-10 cursor-crosshair touch-none"
        />
      </div>

      {/* Controller Area */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Universal control column */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">របារចលនា (Simulation State)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  isPlaying
                    ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? "ផ្អាក (Pause)" : "លេង (Play)"}
              </button>
              
              <button
                onClick={() => {
                  setTime(0);
                  if (state.mode === "graphics") handleParamChange("angle", 0);
                  if (state.mode === "fractal") resetFractal();
                }}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
                title="Reset simulation parameters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode specific parameters column */}
          <div className="lg:col-span-9">
            
            {/* Mode 1: Argand plane sliders */}
            {state.mode === "argand" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">ផ្នែកពិត Real (a)</span>
                    <span className="text-cyan-400 font-bold">{state.real.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="4.0"
                    step="0.1"
                    value={state.real}
                    onChange={(e) => handleParamChange("real", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full h-1.5 cursor-pointer"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">ផ្នែកនិម្មិត Imaginary (b)</span>
                    <span className="text-cyan-400 font-bold">{state.imag.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="4.0"
                    step="0.1"
                    value={state.imag}
                    onChange={(e) => handleParamChange("imag", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full h-1.5 cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showConjugate}
                      onChange={(e) => setShowConjugate(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    Conjugate z̄
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSquare}
                      onChange={(e) => setShowSquare(e.target.checked)}
                      className="accent-orange-500 rounded"
                    />
                    Squared z²
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInverse}
                      onChange={(e) => setShowInverse(e.target.checked)}
                      className="accent-pink-500 rounded"
                    />
                    Inverse 1/z
                  </label>
                </div>
              </div>
            )}

            {/* Mode 2: RLC circuit sliders */}
            {state.mode === "electrical" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">រេស៊ីស្តង់ R (Resistance)</span>
                      <span className="text-emerald-400 font-bold">{state.r} Ω</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={state.r}
                      onChange={(e) => handleParamChange("r", parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">ស្វ័យចង្អុល L (Inductance)</span>
                      <span className="text-sky-400 font-bold">{state.l} mH</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={state.l}
                      onChange={(e) => handleParamChange("l", parseInt(e.target.value))}
                      className="w-full accent-sky-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">កាប៉ាស៊ីតេ C (Capacitance)</span>
                      <span className="text-rose-400 font-bold">{state.c} µF</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={state.c}
                      onChange={(e) => handleParamChange("c", parseInt(e.target.value))}
                      className="w-full accent-rose-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">ហ្វ្រេកង់ f (Frequency)</span>
                      <span className="text-amber-400 font-bold">{state.freq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={state.freq}
                      onChange={(e) => handleParamChange("freq", parseInt(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Circuit Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">សភាពសៀគ្វីគំរូ (Presets)៖</span>
                  <button
                    onClick={() => setRLCPreset("inductive")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-sky-400 rounded-md border border-white/5"
                  >
                    ចរន្តយឺតជាង (Inductive L-heavy)
                  </button>
                  <button
                    onClick={() => setRLCPreset("capacitive")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-rose-400 rounded-md border border-white/5"
                  >
                    ចរន្តលឿនជាង (Capacitive C-heavy)
                  </button>
                  <button
                    onClick={() => setRLCPreset("resonant")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-emerald-400 rounded-md border border-white/5"
                  >
                    រេសូណង់ (Resonant φ ≈ 0)
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Quantum wave sliders */}
            {state.mode === "quantum" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">ថាមពលភាគល្អិត E (Energy Level / Time Rate)</span>
                    <span className="text-cyan-400 font-bold">{state.energy.toFixed(1)} eV</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={state.energy}
                    onChange={(e) => handleParamChange("energy", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full h-1.5 cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Orbit className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 font-sans leading-tight">
                    ការកែប្រែថាមពល <span className="text-cyan-400 font-bold">E</span> ធ្វើឱ្យរលកកុំផ្លិចវិលក្នុងល្បឿនខុសគ្នា។ ច្បាប់ប្រូបាប៊ីលីតេ <span className="#fbbf24 font-bold">|Ψ|²</span> បង្ហាញពីឱកាសរកឃើញភាគល្អិត។
                  </p>
                </div>
              </div>
            )}

            {/* Mode 4: Fourier signal sliders */}
            {state.mode === "fourier" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">ចំនួនរលករងសំយោគ (Harmonic Sine Terms)</span>
                    <span className="text-cyan-400 font-bold">N = {numHarmonics} terms</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={numHarmonics}
                    onChange={(e) => setNumHarmonics(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full h-1.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">ប្រភេទរលកគោលដៅ (Wave Target)៖</span>
                  <button
                    onClick={() => setFourierWaveType("square")}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      fourierWaveType === "square" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    រលកការ៉េ (Square)
                  </button>
                  <button
                    onClick={() => setFourierWaveType("sawtooth")}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      fourierWaveType === "sawtooth" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    រលកធ្មេញរណារ (Sawtooth)
                  </button>
                  <button
                    onClick={() => setFourierWaveType("triangle")}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      fourierWaveType === "triangle" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    រលកត្រីកោណ (Triangle)
                  </button>
                </div>
              </div>
            )}

            {/* Mode 5: Graphics sliders */}
            {state.mode === "graphics" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">មុំបង្វិលដោយដៃ (Manual Rotate Angle)</span>
                    <span className="text-cyan-400 font-bold">{((state.angle * 180) / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6.28"
                    step="0.05"
                    value={state.angle}
                    onChange={(e) => handleParamChange("angle", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full h-1.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">វិមាត្រគំរូ (Dimension Mode)៖</span>
                  <button
                    onClick={() => setGraphicsDimension("2D")}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      graphicsDimension === "2D" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    បង្វិលប្លង់ 2D (Complex Multiplication)
                  </button>
                  <button
                    onClick={() => setGraphicsDimension("3D")}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      graphicsDimension === "3D" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    បង្វិលរូប 3D (3D Cube projection)
                  </button>
                </div>
              </div>
            )}

            {/* Mode 6: Fractal zoom & select */}
            {state.mode === "fractal" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFractalType("mandelbrot")}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      fractalType === "mandelbrot" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    សំណុំ Mandelbrot Set
                  </button>
                  <button
                    onClick={() => {
                      setFractalType("julia");
                      resetFractal();
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      fractalType === "julia" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    សំណុំ Julia Set
                  </button>
                </div>

                {/* Julia constants adjustment if Julia is selected */}
                {fractalType === "julia" ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">ថេរ Julia: c</span>
                      <span className="text-pink-400 font-bold">{juliaReal.toFixed(2)} + {juliaImag.toFixed(2)}i</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="range"
                        min="-1.5"
                        max="0.5"
                        step="0.05"
                        value={juliaReal}
                        onChange={(e) => setJuliaReal(parseFloat(e.target.value))}
                        className="flex-1 accent-pink-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                        title="Julia Real part constant"
                      />
                      <input
                        type="range"
                        min="-1.0"
                        max="1.0"
                        step="0.05"
                        value={juliaImag}
                        onChange={(e) => setJuliaImag(parseFloat(e.target.value))}
                        className="flex-1 accent-pink-500 bg-slate-800 rounded-full h-1 cursor-pointer"
                        title="Julia Imag part constant"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 p-2 rounded-lg border border-white/5">
                    <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Mandelbrot z = z² + c គឺជាផែនទីធរណីមាត្រកុំផ្លិចគ្មានទីបញ្ចប់។</span>
                  </div>
                )}

                {/* Zoom controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">Zoom:</span>
                  <button
                    onClick={() => setFractalZoom((prev) => Math.min(20, prev * 1.3))}
                    className="flex-1 py-1 bg-cyan-500 text-slate-950 font-bold text-xs rounded hover:bg-cyan-400 transition-colors"
                  >
                    + ពង្រីក
                  </button>
                  <button
                    onClick={() => setFractalZoom((prev) => Math.max(0.5, prev / 1.3))}
                    className="flex-1 py-1 bg-white/5 text-slate-300 hover:text-white font-bold text-xs rounded border border-white/10 transition-colors"
                  >
                    - បង្រួម
                  </button>
                  <button
                    onClick={resetFractal}
                    className="py-1 px-2.5 bg-white/5 text-slate-400 hover:text-white text-[10px] rounded border border-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
