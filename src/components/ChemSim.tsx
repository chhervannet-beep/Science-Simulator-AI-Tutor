import React, { useEffect, useRef, useState } from "react";
import { ChemSimState } from "../types";
import { Plus, Minus, HelpCircle, Atom, ShieldAlert, ShieldCheck } from "lucide-react";
import { 
  playAtomIncrementSound, 
  playAtomDecrementSound, 
  playStableChordSound, 
  playUnstableWarningSound 
} from "../utils/audio";

interface ChemSimProps {
  state: ChemSimState;
  onChange: (state: ChemSimState) => void;
  onExplainRequest: () => void;
}

// Periodic table elements up to atomic number 12 (Magnesium)
const elements = [
  { nameKhmer: "អ៊ីដ្រូសែន", symbol: "H", nameEng: "Hydrogen", mass: 1 },
  { nameKhmer: "ហេល្យូម", symbol: "He", nameEng: "Helium", mass: 4 },
  { nameKhmer: "លីចូម", symbol: "Li", nameEng: "Lithium", mass: 7 },
  { nameKhmer: "បេរីល្យូម", symbol: "Be", nameEng: "Beryllium", mass: 9 },
  { nameKhmer: "ប៊រ", symbol: "B", nameEng: "Boron", mass: 11 },
  { nameKhmer: "កាបូន", symbol: "C", nameEng: "Carbon", mass: 12 },
  { nameKhmer: "អាសូត", symbol: "N", nameEng: "Nitrogen", mass: 14 },
  { nameKhmer: "អុកស៊ីសែន", symbol: "O", nameEng: "Oxygen", mass: 16 },
  { nameKhmer: "ហ្លុយអ័រ", symbol: "F", nameEng: "Fluorine", mass: 19 },
  { nameKhmer: "ណេអុង", symbol: "Ne", nameEng: "Neon", mass: 20 },
  { nameKhmer: "សូដ្យូម", symbol: "Na", nameEng: "Sodium", mass: 23 },
  { nameKhmer: "ម៉ាញេស្យូម", symbol: "Mg", nameEng: "Magnesium", mass: 24 }
];

export default function ChemSim({ state, onChange, onExplainRequest }: ChemSimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [electronAngle, setElectronAngle] = useState<number>(0);

  // Animate the electron orbit rotation
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setElectronAngle((prev) => (prev + 0.03) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Compute elemental state
  const atomicNumber = state.protons;
  const activeElement = atomicNumber > 0 && atomicNumber <= elements.length 
    ? elements[atomicNumber - 1] 
    : atomicNumber > elements.length 
      ? { nameKhmer: "ធាតុធ្ងន់ណាស់", symbol: `U-${state.protons}`, nameEng: "Heavy Element", mass: state.protons + state.neutrons }
      : null;

  const netCharge = state.protons - state.electrons;
  const massNumber = state.protons + state.neutrons;

  // Stability guideline: Stable isotopes for lightweight atoms have proton-neutron ratio roughly 1:1 up to 1:1.5
  let isStable = true;
  if (state.protons > 0) {
    const ratio = state.neutrons / state.protons;
    if (state.protons === 1) {
      isStable = state.neutrons <= 2; // Hydrogen can be 1H, 2H (deuterium), 3H (tritium - unstable)
    } else {
      isStable = ratio >= 0.8 && ratio <= 1.4;
    }
  }

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

      // Clear canvas so the HTML background gradient and glows show through
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Draw Orbit Shell Rings (max 3 rings)
      const shellRadii = [60, 110, 160];
      const maxShells = 3;

      // Draw Shell circles with dashed glow
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)"; // sky-400
      ctx.lineWidth = 1;
      for (let i = 0; i < maxShells; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, shellRadii[i], 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Protons and Neutrons in Nucleus
      // To look like a realistic cluster, we place them randomly with small offset or structured
      const randomSeed = 42; // static seed to prevent wild jittering, but we can add small micro-vibrations
      const pCount = state.protons;
      const nCount = state.neutrons;
      const totalNucleons = pCount + nCount;

      // Nucleus radius depends on nucleon count
      const nucleusRadius = Math.max(12, Math.min(30, 8 + Math.sqrt(totalNucleons) * 4));

      // Nucleus center glow
      if (totalNucleons > 0) {
        const radGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, nucleusRadius + 20);
        radGlow.addColorStop(0, "rgba(244, 63, 94, 0.15)"); // Rose / red
        radGlow.addColorStop(1, "rgba(244, 63, 94, 0)");
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, nucleusRadius + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Generate stable/consistent positions for nucleus particles using a simple spiral algorithm
      const particles: { type: "p" | "n"; x: number; y: number }[] = [];
      const goldenAngle = 137.5 * (Math.PI / 180);
      
      let pAdded = 0;
      let nAdded = 0;

      for (let i = 0; i < totalNucleons; i++) {
        // Spiral spacing
        const r = Math.sqrt(i + 0.5) * 6; 
        const theta = i * goldenAngle;
        
        // Micro oscillation to look "alive"
        const jitterX = Math.sin(electronAngle * 4 + i) * 0.5;
        const jitterY = Math.cos(electronAngle * 4 + i * 2) * 0.5;

        const px = centerX + r * Math.cos(theta) + jitterX;
        const py = centerY + r * Math.sin(theta) + jitterY;

        // Alternating proton / neutron placements
        let type: "p" | "n" = "p";
        if (pAdded < pCount && (nAdded >= nCount || i % 2 === 0)) {
          type = "p";
          pAdded++;
        } else if (nAdded < nCount) {
          type = "n";
          nAdded++;
        } else {
          type = "p";
        }

        particles.push({ type, x: px, y: py });
      }

      // Draw Neutrons first (grey-blue background spheres)
      particles.forEach((part) => {
        if (part.type === "n") {
          ctx.beginPath();
          ctx.arc(part.x, part.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#64748b"; // slate-500
          ctx.fill();
          // Sphere 3D gradient highlight
          ctx.beginPath();
          ctx.arc(part.x - 1.5, part.y - 1.5, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#cbd5e1";
          ctx.fill();
        }
      });

      // Draw Protons (glowing deep rose-red spheres)
      particles.forEach((part) => {
        if (part.type === "p") {
          ctx.beginPath();
          ctx.arc(part.x, part.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#f43f5e"; // rose-500
          ctx.fill();
          // Sphere highlight
          ctx.beginPath();
          ctx.arc(part.x - 1.5, part.y - 1.5, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#fecdd3";
          ctx.fill();
        }
      });

      // Draw Electrons revolving in Orbits
      // Electron shells standard arrangement: Ring 1 (K shell): max 2. Ring 2 (L shell): max 8. Ring 3 (M shell): remaining (max 8 in basic Bohr)
      const eCount = state.electrons;
      const electronPositions: { x: number; y: number }[] = [];

      let electronsRemaining = eCount;
      const shellCapacities = [2, 8, 8];

      for (let shellIdx = 0; shellIdx < maxShells; shellIdx++) {
        if (electronsRemaining <= 0) break;
        
        const shellElectrons = Math.min(electronsRemaining, shellCapacities[shellIdx]);
        electronsRemaining -= shellElectrons;
        const radius = shellRadii[shellIdx];

        for (let eIdx = 0; eIdx < shellElectrons; eIdx++) {
          // Stagger the electrons evenly around the ring
          const localAngle = (eIdx * (Math.PI * 2)) / shellElectrons + (electronAngle * (1 / (shellIdx + 1)));
          const ex = centerX + Math.cos(localAngle) * radius;
          const ey = centerY + Math.sin(localAngle) * radius;

          // Glow shadow
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#38bdf8";

          // Electron particle (light cyan)
          ctx.beginPath();
          ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.fill();

          // Core bright white dot
          ctx.beginPath();
          ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          ctx.shadowBlur = 0; // reset
        }
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
  }, [state, electronAngle]);

  const checkStability = (protons: number, neutrons: number) => {
    if (protons === 0) return true;
    const ratio = neutrons / protons;
    if (protons === 1) {
      return neutrons <= 2;
    }
    return ratio >= 0.8 && ratio <= 1.4;
  };

  const updateParticleCount = (key: keyof ChemSimState, delta: number) => {
    const val = Math.max(0, Math.min(12, state[key] + delta)); // restrict to 12 for clean Bohr modeling visualization
    if (val === state[key]) return; // no change
    
    const nextState = { ...state, [key]: val };
    onChange(nextState);

    // Play increment or decrement audio cue
    if (delta > 0) {
      playAtomIncrementSound();
    } else {
      playAtomDecrementSound();
    }

    // Check if the stability of the isotope shifted
    const wasStable = checkStability(state.protons, state.neutrons);
    const isNowStable = checkStability(nextState.protons, nextState.neutrons);

    if (nextState.protons > 0 && wasStable !== isNowStable) {
      if (isNowStable) {
        // Newly stable isotope! Play pleasant harmonic major chord
        setTimeout(() => {
          playStableChordSound();
        }, 150);
      } else {
        // Newly unstable/radioactive! Play pulsing warning hum
        setTimeout(() => {
          playUnstableWarningSound();
        }, 150);
      }
    }
  };

  return (
    <div id="chemistry-sim-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              ឧបករណ៍ស្ថាបនាអាតូមប៊រ (Bohr Atomic Model Builder)
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              បន្ថែមប្រូតុង ណឺត្រុង អេឡិចត្រុង និងសិក្សាអំពីធាតុគីមី អ៊ីយ៉ុង និងលំនឹងអាតូម
            </p>
          </div>
        </div>
        <button
          id="btn-chemistry-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់ដោយគ្រូ AI
        </button>
      </div>

      {/* Main interactive area split into Reactor Viewer and Chemistry Console */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 relative min-h-[350px]">
        
        {/* Bohr canvas element */}
        <div className="md:col-span-8 relative bg-gradient-to-b from-[#0f172a] to-black flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
          
          {/* Atmosphere Glows */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
          
          {/* Periodic element showcase overlay floating in the top left */}
          {activeElement && (
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-2xl z-10">
              <div className="w-14 h-14 bg-white/5 border-2 border-cyan-400 rounded-lg flex flex-col items-center justify-center relative shadow-inner">
                <span className="text-[9px] font-mono text-slate-400 absolute top-0.5 left-1">{atomicNumber}</span>
                <span className="text-xl font-bold font-sans text-cyan-400">{activeElement.symbol}</span>
                <span className="text-[9px] font-mono text-slate-400 absolute bottom-0.5 right-1">{massNumber}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">ឈ្មោះធាតុគីមី (Element)</span>
                <span className="text-sm font-bold text-white">{activeElement.nameKhmer} ({activeElement.nameEng})</span>
                <span className="text-[10px] text-slate-400 font-mono">លេខអាតូម Z={atomicNumber} | ម៉ាស់អាតូម A={massNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Chemistry Status Panel */}
        <div className="md:col-span-4 bg-black/40 backdrop-blur-xl p-6 flex flex-col justify-between gap-6 overflow-y-auto">
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4 font-mono">
              លក្ខណៈគីមីអាតូម (Atom Diagnostics)
            </h4>

            {/* Atomic stats logs */}
            <div className="space-y-3 font-sans">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                <span className="text-xs text-slate-400">បន្ទុកសរុប (Net Charge):</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    netCharge === 0 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : netCharge > 0 
                        ? "bg-amber-500/10 text-amber-400 animate-pulse" 
                        : "bg-blue-500/10 text-blue-400 animate-pulse"
                  }`}>
                    {netCharge === 0 ? "ណឺត (Neutral)" : netCharge > 0 ? `+${netCharge} (Ion+)` : `${netCharge} (Ion-)`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                <span className="text-xs text-slate-400">លំនឹងអ៊ីសូតូប (Isotope Stability):</span>
                <div className="flex items-center gap-1">
                  {isStable ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      មានលំនឹង (Stable)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      វិទ្យុសកម្ម (Unstable)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                <span className="text-xs text-slate-400">ម៉ាស់សរុប (Mass Number):</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{massNumber} u</span>
              </div>
            </div>
          </div>

          {/* Particle Builders Panel */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">បន្ថែម/បន្ថយភាគល្អិត</h5>
            
            {/* Protons Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block shadow-lg shadow-rose-500/50" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">ប្រូតុង (Protons)</span>
                  <span className="text-[9px] text-rose-400/80 font-semibold font-mono">បន្ទុក + | ស្នូល</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="btn-chem-dec-protons"
                  onClick={() => updateParticleCount("protons", -1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-sm text-slate-200">{state.protons}</span>
                <button
                  id="btn-chem-inc-protons"
                  onClick={() => updateParticleCount("protons", 1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Neutrons Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block shadow-lg shadow-slate-500/50" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">ណឺត្រុង (Neutrons)</span>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono">បន្ទុក 0 | ស្នូល</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="btn-chem-dec-neutrons"
                  onClick={() => updateParticleCount("neutrons", -1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-sm text-slate-200">{state.neutrons}</span>
                <button
                  id="btn-chem-inc-neutrons"
                  onClick={() => updateParticleCount("neutrons", 1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Electrons Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block shadow-lg shadow-cyan-400/50" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">អេឡិចត្រុង (Electrons)</span>
                  <span className="text-[9px] text-cyan-400/80 font-semibold font-mono">បន្ទុក - | ស្រទាប់</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="btn-chem-dec-electrons"
                  onClick={() => updateParticleCount("electrons", -1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-sm text-slate-200">{state.electrons}</span>
                <button
                  id="btn-chem-inc-electrons"
                  onClick={() => updateParticleCount("electrons", 1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
