export type SubjectType = "math" | "physics" | "chemistry" | "biology" | "complex" | "limits" | "continuity" | "derivative";

export interface ExplanationResponse {
  explanation: string;
  warning?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MathSimState {
  amplitude: number;
  frequency: number;
  phase: number;
  waveType: "sine" | "cosine" | "tangent";
  showUnitCircle: boolean;
}

export interface PhysicsSimState {
  angle: number; // degrees
  velocity: number; // m/s
  gravity: number; // m/s^2
  airResistance: boolean;
  mass: number; // kg
}

export interface ChemSimState {
  protons: number;
  neutrons: number;
  electrons: number;
}

export interface BioSimState {
  rabbits: number;
  foxes: number;
  rabbitGrowthRate: number;
  foxPredationRate: number;
  foxMortalityRate: number;
  grassGrowthRate: number;
}

export interface ComplexSimState {
  mode: "argand" | "electrical" | "quantum" | "fourier" | "graphics" | "fractal";
  real: number;
  imag: number;
  r: number;
  l: number;
  c: number;
  freq: number;
  energy: number;
  angle: number;
  fractalZoom: number;
}

export interface LimitsSimState {
  mode: "indeterminate" | "asymptote" | "derivative" | "integral" | "application";
  xVal: number; // input value x approaching limit point
  deltaX: number; // h in derivative calculation
  intervals: number; // N for Riemann Sum integrals
  selectedFunction: "hole" | "asymptote" | "sine" | "quadratic";
}

export interface ContinuitySimState {
  mode: "foundation" | "realworld" | "theorems" | "stability" | "discontinuity";
  xVal: number; // interactive position (like c or input x)
  epsilon: number; // for Epsilon-Delta stability control
  delta: number; // for Epsilon-Delta stability control
  discontinuityType: "jump" | "hole" | "infinite";
}

export interface DerivativeSimState {
  mode: "rate" | "optimization" | "motion" | "economics" | "engineering";
  xVal: number; // slider/control parameter
  param2: number; // auxiliary parameter (e.g. initial velocity, cost coefficient)
  is3d: boolean; // toggle for 2D vs 3D representation
  activeSimulation: string; // sub-selection name if any
}



