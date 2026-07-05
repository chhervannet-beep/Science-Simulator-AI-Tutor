export type SubjectType = "math" | "physics" | "chemistry" | "biology" | "complex" | "limits" | "continuity" | "derivative" | "integral" | "definite_integral" | "differential_eq" | "differential_eq2" | "probability" | "function_variation";

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

export interface DerivativeAppSimState {
  mode: "optimization" | "motion" | "economics" | "geometry";
  xVal: number;
  param2: number;
}

export interface IntegralSimState {
  mode: "foundation" | "physics" | "engineering" | "economics";
  xVal: number;
  param2: number;
}

export interface DefiniteIntegralSimState {
  mode: "area" | "volume" | "physics" | "engineering" | "economics";
  xVal: number;
  param2: number;
}

export interface DifferentialEqSimState {
  mode: "why_learn" | "forms" | "population" | "cooling" | "circuits" | "motion";
  xVal: number;
  param2: number;
}

export interface DifferentialEq2SimState {
  mode: "concept" | "spring_mass" | "rlc_circuit" | "wave";
  xVal: number; // For example, damping coefficient
  param2: number;
}

export interface ProbabilitySimState {
  mode: "decision" | "risk" | "randomness" | "ai_science" | "applications";
  xVal: number; // e.g., mean or threshold or samples
  param2: number; // e.g., standard deviation or probability
  is3d: boolean; // toggle 2D vs 3D rendering
}

export interface FunctionVariationSimState {
  mode: "logarithmic" | "exponential" | "rational";
  paramA: number; // Base, growth rate, or scaling coefficient
  paramB: number; // Vertical shift, horizontal shift, or horizontal asymptote coeff
  paramC: number; // Shift/offset or auxiliary parameters
  is3d: boolean;
}

export interface VectorsInSpaceSimState {
  mode: "engineering" | "motion" | "graphics" | "robotics" | "calculus" | "algebraic";
  xVal: number; // X coordinate of Vector A
  yVal: number; // Y coordinate of Vector A
  zVal: number; // Z coordinate of Vector A
  param2: number; // Load multiplier, speed, or other controls
  is3d: boolean;
}

export interface ConicsSimState {
  mode: "circle" | "ellipse" | "parabola" | "hyperbola";
  paramA: number; // primary scale (e.g. radius R, semi-major a, or focal parameter p)
  paramB: number; // secondary scale (e.g. semi-minor b, or hyperbola parameter b)
  h: number;      // horizontal offset of center/vertex
  k: number;      // vertical offset of center/vertex
  is3d: boolean;  // toggle 3D intersection vs 2D graph view
  appMode: "math" | "realworld"; // view style: standard math vs real world interactive application
  selectedApp: string; // which real-world application is active
}





