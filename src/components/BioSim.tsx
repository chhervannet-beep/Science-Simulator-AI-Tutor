import React, { useEffect, useRef, useState } from "react";
import { BioSimState } from "../types";
import { Play, Pause, Plus, HelpCircle, Leaf, Rabbit } from "lucide-react";

interface BioSimProps {
  state: BioSimState;
  onChange: (state: BioSimState) => void;
  onExplainRequest: () => void;
}

interface Creature {
  id: number;
  type: "rabbit" | "fox";
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  age: number;
}

interface Grass {
  x: number;
  y: number;
}

export default function BioSim({ state, onChange, onExplainRequest }: BioSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [grassList, setGrassList] = useState<Grass[]>([]);
  
  // Historical data logs for plotting population trends
  const [history, setHistory] = useState<{ t: number; rabbits: number; foxes: number }[]>([]);
  const historyCounterRef = useRef<number>(0);

  // Initialize ecosystem
  useEffect(() => {
    const initialCreatures: Creature[] = [];
    let idCounter = 1;

    // Spawn initial rabbits
    for (let i = 0; i < 30; i++) {
      initialCreatures.push({
        id: idCounter++,
        type: "rabbit",
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        energy: 40,
        age: 0,
      });
    }

    // Spawn initial foxes
    for (let i = 0; i < 6; i++) {
      initialCreatures.push({
        id: idCounter++,
        type: "fox",
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        energy: 100,
        age: 0,
      });
    }

    // Spawn grass
    const initialGrass: Grass[] = [];
    for (let i = 0; i < 40; i++) {
      initialGrass.push({
        x: Math.random() * 400 + 20,
        y: Math.random() * 300 + 20,
      });
    }

    setCreatures(initialCreatures);
    setGrassList(initialGrass);
    setHistory([{ t: 0, rabbits: 30, foxes: 6 }]);
    historyCounterRef.current = 1;
  }, []);

  // Update loop
  useEffect(() => {
    if (!isPlaying) return;

    let idCounter = creatures.length > 0 ? Math.max(...creatures.map(c => c.id)) + 1 : 1;
    const interval = setInterval(() => {
      // 1. Move and update physics for creatures
      let currentCreatures = creatures.map((c) => {
        let vx = c.vx;
        let vy = c.vy;

        // Simple behaviors:
        // Rabbits wander randomly, but get attracted to the nearest grass
        if (c.type === "rabbit") {
          let nearestGrass: Grass | null = null;
          let minDist = 150;
          grassList.forEach((g) => {
            const dist = Math.hypot(g.x - c.x, g.y - c.y);
            if (dist < minDist) {
              minDist = dist;
              nearestGrass = g;
            }
          });

          if (nearestGrass) {
            const angle = Math.atan2((nearestGrass as Grass).y - c.y, (nearestGrass as Grass).x - c.x);
            vx += Math.cos(angle) * 0.4;
            vy += Math.sin(angle) * 0.4;
          } else {
            vx += (Math.random() - 0.5) * 0.5;
            vy += (Math.random() - 0.5) * 0.5;
          }

          // Speed limit
          const speed = Math.hypot(vx, vy);
          if (speed > 3) {
            vx = (vx / speed) * 3;
            vy = (vy / speed) * 3;
          }
        }

        // Foxes chase the nearest rabbit
        if (c.type === "fox") {
          let nearestRabbit: Creature | null = null;
          let minDist = 250;
          creatures.forEach((r) => {
            if (r.type === "rabbit") {
              const dist = Math.hypot(r.x - c.x, r.y - c.y);
              if (dist < minDist) {
                minDist = dist;
                nearestRabbit = r;
              }
            }
          });

          if (nearestRabbit) {
            const angle = Math.atan2((nearestRabbit as Creature).y - c.y, (nearestRabbit as Creature).x - c.x);
            vx += Math.cos(angle) * 0.6;
            vy += Math.sin(angle) * 0.6;
          } else {
            vx += (Math.random() - 0.5) * 0.4;
            vy += (Math.random() - 0.5) * 0.4;
          }

          // Speed limit for foxes
          const speed = Math.hypot(vx, vy);
          if (speed > 4.5) {
            vx = (vx / speed) * 4.5;
            vy = (vy / speed) * 4.5;
          }
        }

        // Apply friction/drag boundary bounce
        let x = c.x + vx;
        let y = c.y + vy;

        if (x < 10 || x > 440) vx *= -1;
        if (y < 10 || y > 340) vy *= -1;

        x = Math.max(10, Math.min(440, x));
        y = Math.max(10, Math.min(340, y));

        // Deduct baseline energy
        const energyLoss = c.type === "rabbit" ? 0.1 : state.foxMortalityRate * 0.4;

        return {
          ...c,
          x,
          y,
          vx,
          vy,
          energy: c.energy - energyLoss,
          age: c.age + 1,
        };
      });

      // 2. Collsions and Feeding
      // Rabbits eating grass
      let nextGrassList = [...grassList];
      currentCreatures = currentCreatures.map((c) => {
        if (c.type === "rabbit") {
          let grassEatenIdx = -1;
          for (let i = 0; i < nextGrassList.length; i++) {
            const g = nextGrassList[i];
            if (Math.hypot(g.x - c.x, g.y - c.y) < 12) {
              grassEatenIdx = i;
              break;
            }
          }
          if (grassEatenIdx !== -1) {
            nextGrassList.splice(grassEatenIdx, 1);
            return { ...c, energy: Math.min(100, c.energy + 25) };
          }
        }
        return c;
      });

      // Foxes eating rabbits
      const eatenRabbitIds = new Set<number>();
      currentCreatures = currentCreatures.map((c) => {
        if (c.type === "fox") {
          let preyEaten: Creature | null = null;
          for (let i = 0; i < currentCreatures.length; i++) {
            const r = currentCreatures[i];
            if (r.type === "rabbit" && !eatenRabbitIds.has(r.id)) {
              if (Math.hypot(r.x - c.x, r.y - c.y) < 14) {
                preyEaten = r;
                break;
              }
            }
          }
          if (preyEaten) {
            eatenRabbitIds.add((preyEaten as Creature).id);
            return { ...c, energy: Math.min(150, c.energy + 45) };
          }
        }
        return c;
      });

      // Remove eaten rabbits & starved creatures
      currentCreatures = currentCreatures.filter((c) => {
        if (c.type === "rabbit" && eatenRabbitIds.has(c.id)) return false;
        if (c.energy <= 0) return false;
        return true;
      });

      // 3. Reproduction (Mitosis / Breeding)
      const babies: Creature[] = [];
      currentCreatures = currentCreatures.map((c) => {
        // Rabbits multiply based on rabbitGrowthRate setting
        if (c.type === "rabbit" && c.energy >= 70 && Math.random() < state.rabbitGrowthRate * 0.1) {
          babies.push({
            id: idCounter++,
            type: "rabbit",
            x: c.x + (Math.random() - 0.5) * 15,
            y: c.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            energy: 35,
            age: 0,
          });
          return { ...c, energy: 35 }; // divide energy
        }

        // Foxes multiply based on foxPredationRate setting
        if (c.type === "fox" && c.energy >= 120 && Math.random() < state.foxPredationRate * 0.08) {
          babies.push({
            id: idCounter++,
            type: "fox",
            x: c.x + (Math.random() - 0.5) * 15,
            y: c.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            energy: 60,
            age: 0,
          });
          return { ...c, energy: 60 };
        }

        return c;
      });

      // Spawn new grass over time
      if (nextGrassList.length < 80 && Math.random() < state.grassGrowthRate * 0.3) {
        nextGrassList.push({
          x: Math.random() * 420 + 15,
          y: Math.random() * 320 + 15,
        });
      }

      const nextCreatures = [...currentCreatures, ...babies];
      setCreatures(nextCreatures);
      setGrassList(nextGrassList);

      // Append population counts to history for charts
      const numRabbits = nextCreatures.filter((c) => c.type === "rabbit").length;
      const numFoxes = nextCreatures.filter((c) => c.type === "fox").length;

      // Update parent component state for AI synchronization
      onChange({
        ...state,
        rabbits: numRabbits,
        foxes: numFoxes,
      });

      if (historyCounterRef.current % 10 === 0) {
        setHistory((prev) => {
          const nextHistory = [...prev, { t: prev.length, rabbits: numRabbits, foxes: numFoxes }];
          if (nextHistory.length > 50) nextHistory.shift(); // keep graph scrolling
          return nextHistory;
        });
      }
      historyCounterRef.current++;

    }, 100);

    return () => clearInterval(interval);
  }, [creatures, grassList, isPlaying, state]);

  // Drawing elements on Canvas
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

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // 1. Draw Forest Meadow Meadow area (Left column)
      const meadowWidth = width * 0.55;
      const graphWidth = width * 0.4;
      const graphX = width * 0.58;

      // Clear transparently so HTML backdrop gradients and glows shine through
      ctx.clearRect(0, 0, width, height);

      // Meadow translucent glass box
      ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
      ctx.fillRect(10, 10, meadowWidth, height - 20);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, meadowWidth, height - 20);

      // Draw grass dots (glowing small green stars/circles)
      ctx.fillStyle = "#22c55e"; // emerald-500
      grassList.forEach((g) => {
        // Map relative coordinates to meadow fit
        const drawX = 10 + (g.x / 450) * (meadowWidth - 20);
        const drawY = 10 + (g.y / 350) * (height - 40);

        ctx.beginPath();
        ctx.arc(drawX, drawY, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Creatures
      creatures.forEach((c) => {
        const drawX = 10 + (c.x / 450) * (meadowWidth - 20);
        const drawY = 10 + (c.y / 350) * (height - 40);

        if (c.type === "rabbit") {
          // Rabbit: White jumping fluffy circle with pink ears
          ctx.beginPath();
          ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#f8fafc"; // slate-50
          ctx.fill();

          // Ears
          ctx.fillStyle = "#fda4af"; // rose-300
          ctx.fillRect(drawX - 2, drawY - 9, 1.5, 5);
          ctx.fillRect(drawX + 0.5, drawY - 9, 1.5, 5);
        } else {
          // Fox: Orange pointy circle with ears and white face accents
          ctx.beginPath();
          ctx.arc(drawX, drawY, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = "#f97316"; // orange-500
          ctx.fill();

          // Ears
          ctx.fillStyle = "#ea580c"; // orange-600
          ctx.beginPath();
          ctx.moveTo(drawX - 5, drawY - 4);
          ctx.lineTo(drawX - 8, drawY - 11);
          ctx.lineTo(drawX - 1, drawY - 5);
          ctx.moveTo(drawX + 5, drawY - 4);
          ctx.lineTo(drawX + 8, drawY - 11);
          ctx.lineTo(drawX + 1, drawY - 5);
          ctx.fill();
        }
      });

      // --- 2. Draw Population Trend Line Graph (Right column) ---
      const graphY = 30;
      const graphHeight = height - 70;

      // Axis for plot
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY);
      ctx.lineTo(graphX, graphY + graphHeight);
      ctx.lineTo(graphX + graphWidth, graphY + graphHeight);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText("ពេលវេលា (Time)", graphX + graphWidth - 80, graphY + graphHeight + 15);
      ctx.fillText("ចំនួន Population", graphX - 5, graphY - 10);

      if (history.length > 1) {
        // Find max value in history to scale graph dynamically
        const maxPop = Math.max(
          50,
          ...history.map((h) => Math.max(h.rabbits, h.foxes))
        );

        const getX = (index: number) => graphX + (index / (history.length - 1)) * graphWidth;
        const getY = (val: number) => graphY + graphHeight - (val / maxPop) * (graphHeight - 10);

        // Plot Rabbits (White line)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(history[0].rabbits));
        for (let i = 1; i < history.length; i++) {
          ctx.lineTo(getX(i), getY(history[i].rabbits));
        }
        ctx.stroke();

        // Plot Foxes (Orange line)
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(history[0].foxes));
        for (let i = 1; i < history.length; i++) {
          ctx.lineTo(getX(i), getY(history[i].foxes));
        }
        ctx.stroke();

        // Legends
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(graphX + 20, graphY + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`ទន្សាយ (Rabbits): ${state.rabbits}`, graphX + 30, graphY + 18);

        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(graphX + 20, graphY + 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`កញ្ជ្រោង (Foxes): ${state.foxes}`, graphX + 30, graphY + 33);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [creatures, grassList, history, state]);

  // Handle manually adding populations
  const handleAddCreatures = (type: "rabbit" | "fox") => {
    let idCounter = creatures.length > 0 ? Math.max(...creatures.map(c => c.id)) + 1 : 1;
    const added: Creature[] = [];
    const count = type === "rabbit" ? 15 : 3;

    for (let i = 0; i < count; i++) {
      added.push({
        id: idCounter++,
        type,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        energy: type === "rabbit" ? 40 : 100,
        age: 0,
      });
    }

    setCreatures([...creatures, ...added]);
  };

  const handleSliderChange = (key: keyof BioSimState, val: number) => {
    onChange({ ...state, [key]: val });
  };

  return (
    <div id="biology-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              គំរូអេកូឡូស៊ី សត្វប្រមាញ់ និងជនរងគ្រោះ (Predator-Prey Eco-System Dynamics)
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              ស្វែងយល់អំពីតុល្យភាពធម្មជាតិ តាមម៉ូដែល Lotka-Volterra រវាងទន្សាយ និងកញ្ជ្រោង
            </p>
          </div>
        </div>
        <button
          id="btn-biology-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់ទ្រឹស្តីដោយគ្រូ AI
        </button>
      </div>

      {/* Simulator view area (Upper portion) */}
      <div className="flex-1 relative min-h-[300px] md:min-h-[400px] overflow-hidden bg-gradient-to-b from-[#0f172a] to-black">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
        
        {/* Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
      </div>

      {/* Controller Controls (Lower portion) */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulation status / animation controls */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">របារចលនា (Simulation State)</span>
            <button
              id="btn-bio-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                isPlaying
                  ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "ផ្អាកពិសោធន៍ (Pause)" : "បន្តចលនា (Resume)"}
            </button>

            {/* Manual Spawning Add Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                id="btn-bio-add-rabbits"
                onClick={() => handleAddCreatures("rabbit")}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                +15 ទន្សាយ
              </button>
              <button
                id="btn-bio-add-foxes"
                onClick={() => handleAddCreatures("fox")}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                +3 កញ្ជ្រោង
              </button>
            </div>
          </div>

          {/* Core ecosystem biological parameters */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">អត្រាកំណើនទន្សាយ (Rabbit Growth Rate)</span>
                  <span className="text-cyan-400 font-bold">{state.rabbitGrowthRate.toFixed(2)}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-bio-rabbit-growth"
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={state.rabbitGrowthRate}
                    onChange={(e) => handleSliderChange("rabbitGrowthRate", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">អត្រាដុះស្មៅ (Grass Regrowth Speed)</span>
                  <span className="text-cyan-400 font-bold">{state.grassGrowthRate.toFixed(2)}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-bio-grass-growth"
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={state.grassGrowthRate}
                    onChange={(e) => handleSliderChange("grassGrowthRate", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Right sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">អត្រាប្រមាញ់របស់កញ្ជ្រោង (Fox Hunt Efficiency)</span>
                  <span className="text-purple-400 font-bold">{state.foxPredationRate.toFixed(2)}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-bio-fox-hunt"
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={state.foxPredationRate}
                    onChange={(e) => handleSliderChange("foxPredationRate", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">អត្រាស្លាប់របស់កញ្ជ្រោង (Fox Mortality Rate)</span>
                  <span className="text-purple-400 font-bold">{state.foxMortalityRate.toFixed(2)}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="slider-bio-fox-mortality"
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={state.foxMortalityRate}
                    onChange={(e) => handleSliderChange("foxMortalityRate", parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-full cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
