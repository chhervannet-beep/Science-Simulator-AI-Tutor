import React, { useState, useEffect } from "react";
import { SubjectType, QuizQuestion } from "../types";
import { Sparkles, Send, Brain, CheckCircle2, XCircle, RefreshCw, Loader2, Award, BookOpen, History, Trash2, Clock, MessageSquare, ChevronRight } from "lucide-react";
import MathRenderer from "./MathRenderer";

interface HistoryItem {
  id: string;
  timestamp: string;
  title: string;
  subject: SubjectType;
  content: string;
  subtitle: string;
  userQuestion?: string;
}

const getSubjectKhmerName = (sub: SubjectType): string => {
  const mapping: Record<SubjectType, string> = {
    math: "អនុគមន៍ត្រីកោណមាត្រ",
    physics: "ចលនាគប់គ្រាប់ផ្លោង",
    chemistry: "ការសាងសង់អាតូម",
    biology: "ប្រព័ន្ធអេកូឡូស៊ីសត្វព្រៃ",
    complex: "ចំនួនកុំផ្លិច និងការអនុវត្ត",
    limits: "លីមីតនៃអនុគមន៍",
    continuity: "ភាពជាប់នៃអនុគមន៍",
    derivative: "ដេរីវេនៃអនុគមន៍",
    integral: "អាំងតេក្រាលមិនកំណត់",
    definite_integral: "អាំងតេក្រាលកំណត់",
    differential_eq: "សមីការឌីផេរ៉ង់ស្យែល",
    differential_eq2: "សមីការឌីផេរ៉ង់ស្យែលលំដាប់២",
    probability: "ប្រូបាប និងស្ថិតិ",
    function_variation: "អថេរភាព និងក្រាហ្វនៃអនុគមន៍"
  };
  return mapping[sub] || sub;
};

const formatParamsSubtitle = (sub: SubjectType, data: any): string => {
  if (!data) return "";
  const parts: string[] = [];
  if (data.mode) {
    const modeMap: Record<string, string> = {
      circle: "រង្វង់",
      ellipse: "អេលីប",
      parabola: "ប៉ារ៉ាបូល",
      hyperbola: "អ៊ីពែបូល",
      math: "គណិតវិទ្យា",
      realworld: "ជីវិតពិត",
      indeterminate: "ទម្រង់មិនកំណត់",
      asymptote: "អសីមតូត",
      derivative: "ដេរីវេ",
      integral: "អាំងតេក្រាល",
      application: "កម្មវិធីអនុវត្ត",
      foundation: "គ្រឹះស្ថាន",
      realworld_cont: "ជីវិតពិត",
      theorems: "ទ្រឹស្តីបទ",
      stability: "ស្ថិរភាព",
      discontinuity: "ភាពមិនជាប់",
      rate: "អត្រាប្រែប្រួល",
      optimization: "អតិបរមា/អប្បបរមា",
      motion: "ចលនា",
      economics: "សេដ្ឋកិច្ច",
      engineering: "វិស្វកម្ម",
      area: "ក្រឡាផ្ទៃ",
      volume: "មាឌ",
      why_learn: "ហេតុអ្វីសិក្សា",
      forms: "ទម្រង់សមីការ",
      population: "កំណើនប្រជាជន",
      cooling: "ច្បាប់លំនឹងកម្តៅ",
      circuits: "សៀគ្វីអគ្គិសនី",
      concept: "គំនិតគ្រឹះ",
      spring_mass: "លំយោលរ៉ឺស័រ",
      rlc_circuit: "សៀគ្វី RLC",
      wave: "រលកសញ្ញា",
      decision: "ការសម្រេចចិត្ត",
      risk: "ហានិភ័យ",
      randomness: "ភាពចៃដន្យ",
      ai_science: "វិទ្យាសាស្ត្រ AI",
      applications: "កម្មវិធីផ្សេងៗ",
      logarithmic: "លោការីត",
      exponential: "អិចស្ប៉ូណង់ស្យែល",
      rational: "សនិទាន"
    };
    parts.push(`របៀប៖ ${modeMap[data.mode] || data.mode}`);
  }
  if (sub === "physics") {
    if (data.velocity !== undefined) parts.push(`v₀: ${data.velocity}m/s`);
    if (data.angle !== undefined) parts.push(`θ: ${data.angle}°`);
  } else if (sub === "math") {
    if (data.amplitude !== undefined) parts.push(`Amp: ${data.amplitude}`);
    if (data.frequency !== undefined) parts.push(`Freq: ${data.frequency}Hz`);
  } else if (sub === "chemistry") {
    if (data.protons !== undefined) parts.push(`P: ${data.protons}`);
    if (data.neutrons !== undefined) parts.push(`N: ${data.neutrons}`);
    if (data.electrons !== undefined) parts.push(`E: ${data.electrons}`);
  } else if (sub === "biology") {
    if (data.rabbits !== undefined) parts.push(`ទន្សាយ: ${Math.round(data.rabbits)}`);
    if (data.wolves !== undefined) parts.push(`ចចក: ${Math.round(data.wolves)}`);
  } else {
    if (data.xVal !== undefined) parts.push(`x: ${data.xVal.toFixed(1)}`);
    if (data.param2 !== undefined) parts.push(`p2: ${data.param2.toFixed(1)}`);
  }
  return parts.join(" | ");
};

const getLocalFallbackExplanation = (sub: SubjectType, data: any): string => {
  const amp = data?.amplitude !== undefined ? data.amplitude : 1;
  const freq = data?.frequency !== undefined ? data.frequency : 1.2;
  const phase = data?.phase !== undefined ? data.phase : 0;
  const angle = data?.angle !== undefined ? data.angle : 45;
  const velocity = data?.velocity !== undefined ? data.velocity : 15;
  const protons = data?.protons !== undefined ? data.protons : 1;
  const neutrons = data?.neutrons !== undefined ? data.neutrons : 0;
  const electrons = data?.electrons !== undefined ? data.electrons : 1;
  const rabbits = data?.rabbits !== undefined ? Math.round(data.rabbits) : 50;
  const wolves = data?.wolves !== undefined ? Math.round(data.wolves) : 10;
  const mode = data?.mode || "";
  const paramA = data?.paramA !== undefined ? data.paramA : 1.5;
  const paramB = data?.paramB !== undefined ? data.paramB : 0.0;
  const paramC = data?.paramC !== undefined ? data.paramC : 1.0;
  const is3dStr = data?.is3d ? "បើក (Enabled)" : "បិទ (Disabled)";
  const xVal = data?.xVal !== undefined ? data.xVal : 2;
  const param2 = data?.param2 !== undefined ? data.param2 : 50;

  const fallback: Record<string, string> = {
    math: `### ការពន្យល់អំពីអនុគមន៍ត្រីកោណមាត្រ (Trigonometry Explanation)

* **រលកស៊ីនុស (Sine Wave)**៖ រលកស៊ីនុសកើតឡើងពីការវាស់កម្ពស់ចំណុចនៅលើរង្វង់ខ្នាត (Unit Circle) នៅពេលវាវិល។
* **Amplitude (អំព្លីទុត)**៖ ${amp} — កំណត់កម្ពស់ខ្ពស់បំផុត និងទាបបំផុតនៃរលក។ កាលណាអំព្លីទុតកាន់តែធំ រលកកាន់តែខ្ពស់។
* **Frequency (ហ្វ្រេកង់)**៖ ${freq} Hz — ចំនួនដងដែលរលកលោតឡើងចុះក្នុងមួយវិនាទី។ កាលណា frequency កាន់តែខ្ពស់ រលកកាន់តែញឹក។
* **Phase Shift (លំអៀងផាស)**៖ ${phase} rad — កំណត់ការរំកិលរលកទៅឆ្វេង ឬស្តាំ។

**ជីវិតប្រចាំថ្ងៃ៖** រលកទាំងនេះប្រើប្រាស់សម្រាប់គណនារលកសំឡេង រលកពន្លឺ និងចរន្តអគ្គិសនីឆ្លាស់ (AC Electricity)។`,

    physics: `### ការពន្យល់អំពីចលនាគប់គ្រាប់ផ្លោង (Projectile Motion)

* **មុំគប់ (Launch Angle)**៖ ${angle}° — មុំដែលគប់ចេញធៀបនឹងដី។ មុំ 45° ផ្តល់ចម្ងាយឆ្ងាយបំផុត (ក្នុងករណីគ្មានភាពទប់ខ្យល់)។
* **ល្បឿនដើម (Initial Velocity)**៖ ${velocity} m/s — ល្បឿនចាប់ផ្តើមបាញ់ចេញ។ ល្បឿនកាន់តែលឿន នាំឱ្យគ្រាប់ផ្លោងហោះបានកាន់តែឆ្ងាយ និងខ្ពស់។

**ជីវិតជាក់ស្តែង៖** ចលនានេះត្រូវបានអនុវត្តនៅក្នុងការលេងកីឡា (ទាត់បាល់ បោះបាល់) វិស្វកម្មយោធា និងការបាញ់បង្ហោះរ៉ុក្កែត។`,

    chemistry: `### ការពន្យល់អំពីការសាងសង់អាតូម (Atom Builder Explanation)

* **ប្រូតុង (Protons)**៖ ${protons} — កំណត់ប្រភេទធាតុគីមី និងបន្ទុកស្នូលវិជ្ជមាន។
* **ណឺត្រុង (Neutrons)**៖ ${neutrons} — ជួយរក្សាស្ថិរភាពស្នូលគីមី។
* **អេឡិចត្រុង (Electrons)**៖ ${electrons} — វិលជុំវិញស្នូល និងកំណត់បន្ទុកអគ្គិសនីសរុប។

**ជីវិតប្រចាំថ្ងៃ៖** ការយល់ដឹងពីរចនាសម្ព័ន្ធអាតូមគឺជាគ្រឹះសម្រាប់វិស័យគីមីវិទ្យា ឱសថ និងថាមពលនុយក្លេអ៊ែរ។`,

    biology: `### ការពន្យល់អំពីប្រព័ន្ធអេកូឡូស៊ី សត្វព្រៃ (Predator-Prey Ecosystem)

* **ទន្សាយ (Rabbits - Prey)**៖ ${rabbits} ក្បាល — ជាសត្វស៊ីស្មៅ និងជាចំណីរបស់សត្វចចក។ ចំនួនកើនឡើងលឿនបើគ្មានសត្វចចកស៊ី។
* **ចចក (Wolves - Predator)**៖ ${wolves} ក្បាល — ជាសត្វស៊ីសាច់ដែលបរបាញ់ទន្សាយ។ បើគ្មានទន្សាយស៊ីទេ ចំនួនចចកនឹងថយចុះរហូតដល់ផុតពូជ។
* **វាលស្មៅ (Grass/Environment)**៖ ផ្តល់អាហារដល់ទន្សាយដើម្បីលូតលាស់។

**ជីវិតជាក់ស្តែង៖** ការយល់ដឹងអំពីតុល្យភាពនេះជួយក្នុងការអភិរក្សសត្វព្រៃ និងគ្រប់គ្រងបរិស្ថាន。`,

    complex: `### ការពន្យល់អំពីចំនួនកុំផ្លិច និងការអនុវត្ត (Complex Numbers and Applications)

* **របៀបបង្ហាញ (Representation)**៖ ចំនួនកុំផ្លិចត្រូវបានសរសេរជាទម្រង់ z = a + bi ដែល a ជាផ្នែកពិត (Real Part) និង b ជាផ្នែកនិម្មិត (Imaginary Part) ជាមួយលក្ខណៈពិសេស i² = -1។
* **របៀបពិសោធន៍បច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "${mode || "argand"}"។
* **កម្មវិធីក្នុងជីវិតជាក់ស្តែង (Real-world Applications)៖**
  1. **វិស្វកម្មអគ្គិសនី (Electrical Engineering)**៖ ប្រើសម្រាប់គណនាផាស និង អ៊ីមផេដង់ Z = R + jX នៃចរន្តឆ្លាស់។
  2. **មេកានិចកង់ទិច (Quantum Mechanics)**៖ រលក Schrodinger Ψ(x,t) ប្រើចំនួនកុំផ្លិចដើម្បីកំណត់ស្ថានភាពភាគល្អិត។
  3. **ឌីជីថល (Signal Processing)**៖ ការបម្លែង Fourier និង Epicycles ប្រើចំនួនកុំផ្លិចដើម្បីវិភាគហ្វ្រេកង់រលកសំឡេង ឬរូបភាព។
  4. **ក្រាហ្វិកកុំព្យូទ័រ (Computer Graphics)**៖ ការបង្វិលកូអរដោនេក្នុងលំហ 2D/3D ដោយការគុណនឹងចំនួនកុំផ្លិច e^(iθ) និងការប្រើប្រាស់ Quaternions។
  5. **ប្រភាគធរណីមាត្រ (Fractals)**៖ បង្កើតរូបភាពស្អាតៗដូចជា សំណុំ Mandelbrot និង Julia តាមរយៈរូបមន្តស្វ័យគណនា z_{n+1} = z_n² + c។`,

    limits: `### ការពន្យល់អំពី លីមីត និងគ្រឹះគណនា (Limits & Calculus Explanation)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "${mode || "integral"}"។
* **គំនិតចម្បងនៃលីមីត (Core Concept of Limit)៖**
  - **លីមីត (Limits)** ជួយយើងសិក្សាពីតម្លៃនៃអនុគមន៍ f(x) នៅពេល x ទៅជិតតម្លៃ a ណាមួយ ទោះបីជានៅត្រង់ a អនុគមន៍គ្មានន័យ (ដូចជាទម្រង់ 0/0) ក៏ដោយ។
  - វាក្លាយជាគ្រឹះដ៏សំខាន់សម្រាប់ **ដេរីវេ (Derivative - lim h→0 Δy/Δh)** និង **អាំងតេក្រាល (Integral - lim N→∞ Σf(xi)Δx)**។

* **ការអនុវត្តជាក់ស្តែងក្នុងរូបភាព (From worksheets):**
  1. **មូលដ្ឋានគ្រឹះនៃ Calculus**: លីមីតជាគ្រឹះសម្រាប់ដេរីវេ និងអាំងតេក្រាល។
  2. **ទម្រង់មិនកំណត់**: ដោះស្រាយតម្លៃ 0/0 ដោយប្រើការសម្រួលកន្សោម (x - a)។
  3. **វិភាគឥរិយាបថ**: សិក្សាអសីមតូតដូចជា y = 1/x។
  4. **ជីវិតពិត**: គណនាល្បឿនខណៈ (Instantaneous speed) នៃយានយន្ត ឬរ៉ុក្កែត (Rocket)។`,

    continuity: `### ការពន្យល់អំពី ភាពជាប់នៃអនុគមន៍ (Continuity & Discontinuity Explanation)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "${mode || "foundation"}"។
* **គំនិតចម្បងនៃភាពជាប់ (Core Concept of Continuity)៖**
  - f(x) ជាប់ត្រង់ c លុះត្រាតែមាន f(c) កំណត់, មានលីមីត lim_{x→c} f(x) និង lim_{x→c} f(x) = f(c)។

* **ការអនុវត្តតាមគំនិតក្នុងរូបភាព (From Khmer learning posters):**
  1. **គ្រឹះនៃ Calculus**: ភាពជាប់ជាលក្ខខណ្ឌចាំបាច់សម្រាប់គណនាដេរីវេ (Derivative) និងអាំងតេក្រាល។
  2. **ម៉ូដែលពិភពពិត**: សីតុណ្ហភាព កម្ពស់ និងពេលវេលា ប្រែប្រួលជាប់រលូនជានិច្ច មិនលោតផ្លោះឡើយ។
  3. **ទ្រឹស្តីបទសំខាន់ៗ**: ទ្រឹស្តីបទតម្លៃមធ្យម (IVT) ធានាការមានឫសពិតក្នុងចន្លោះបិទ និងទ្រឹស្តីបទតម្លៃលំដាប់ខ្ពស់បំផុត (EVT)។
  4. **ស្ថិរភាពប្រព័ន្ធ**: ក្នុងវិស្វកម្មការពារការប្រែប្រួលខ្លាំងពេកជាយថាហេតុ។
  5. **ភាពមិនជាប់**: សិក្សាពីការលោត (Jump), ប្រហោង (Hole), និងអសីមតូតឈរ (Infinite)។`,

    derivative: `### ការពន្យល់អំពី ដេរីវេនៃអនុគមន៍ (Derivatives & Practical Applications)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "${mode || "rate"}" (តម្លៃកូអរដោនេ x = ${Number(xVal).toFixed(1)})។
* **គំនិតចម្បងនៃដេរីវេ (Core Concept of Derivative)៖**
  - f'(x) គឺជាមេគុណប្រាប់ទិសនៃខ្សែបន្ទាត់ប៉ះ (Tangent line) ទៅនឹងក្រាបនៃ f(x) ត្រង់ចំណុចនោះ។

* **កម្មវិធីក្នុងរូបភាព និងជីវិតជាក់ស្តែង (From the Khmer Learning Poster):**
  1. **គណនាអត្រាប្រែប្រួលភ្លាមៗ (Instantaneous Rate of Change)**៖ គណនាល្បឿនខណៈ v(t) = s'(t) ពីទីតាំង, សន្ទុះ a(t) = v'(t) ពីល្បឿន។ (ដូចជាការវិភាគល្បឿនឡាន ឬបាល់ធ្លាក់)។
  2. **ស្វែងរកតម្លៃអតិបរមា និងអប្បបរមា (Optimization)**៖ កំណត់បរិមាណសមស្របដើម្បីទទួលបានផលចំណេញខ្ពស់បំផុត (Maximum Profit where P'(x) = 0) ឬថ្លៃដើមទាបបំផុត (Minimum Cost where C'(x) = 0)។
  3. **ចលនានិងរូបវិទ្យា (Motion & Physics)**៖ វិភាគគន្លងផ្កាយរណប គន្លងហោះហើររបស់រ៉ុក្កែត ឬការទាត់បាល់ទាត់ ដោយប្រើច្បាប់ចលនារបស់ញូតុន (Newton's laws of motion)។
  4. **ម៉ូដែលសេដ្ឋកិច្ច (Economic Models)**៖ គណនាថ្លៃដើមបន្ថែម (Marginal Cost) និងប្រាក់ចំណូលបន្ថែម (Marginal Revenue) ដើម្បីវិភាគលំនឹងនៃការផ្គត់ផ្គង់ និងតម្រូវការ។
  5. **វិស្វកម្ម និងបច្ចេកវិទ្យា (Engineering & Technology)**៖ រចនាស្ពានខ្សែយោង (Suspension Bridge) ដែលប្រើដេរីវេដើម្បីកំណត់កម្លាំងទាញតង់ស្យុង (Tension force) នៃខ្សែយោង និងវិភាគប្រព័ន្ធគ្រប់គ្រងស្វ័យប្រវត្តិនៃគ្រឿងយន្ត។`,

    probability: `### ការពន្យល់អំពី ប្រូបាបនៃអនុគមន៍ (Probability of Functions & Distributions)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "${mode || "decision"}"។
* **ប៉ារ៉ាមែត្រ (Parameters)**៖ 
  - **តម្លៃទី១ (xVal)**៖ ${xVal} (តំណាងឱ្យកម្រិតសម្រេចចិត្ត ឬមធ្យមភាគ μ ឬអត្រាសកម្មភាព)
  - **តម្លៃទី២ (param2)**៖ ${param2} (តំណាងឱ្យគម្លាតគំរូ σ ឬកម្រិតប្រូបាប)

* **គំនិតចម្បង និងកម្មវិធីក្នុងជីវិតជាក់ស្តែង (From the Khmer Learning Poster):**
  1. **ការធ្វើសេចក្តីសម្រេចចិត្ត (Informed Decision-Making)**៖ ប្រូបាបជួយគណនា និងថ្លឹងថ្លែងរវាងហានិភ័យ (Risk) និងផលលាភ (Reward) ដើម្បីធ្វើសេចក្តីសម្រេចចិត្តដ៏ត្រឹមត្រូវបំផុត។
  2. **ការគ្រប់គ្រងហានិភ័យ (Risk Management & Assessment)**៖ ប្រើប្រាស់ក្នុងការធានារ៉ាប់រង និងការវាយតម្លៃភាពរឹងមាំ ឬសុវត្ថិភាពនៃប្រព័ន្ធនានា ដើម្បីកាត់បន្ថយការខូចខាតពីភាពមិនប្រាកដប្រជា។
  3. **ភាពមិនប្រាកដប្រជា (Randomness & Uncertainty)**៖ ការសិក្សាពីកម្រិតប្រែប្រួលតាមរយៈ របាយប៊ែលខឺវ (Gaussian/Normal Distribution) ដែលមានជាមធ្យមភាគ (Mean μ) និងគម្លាតគំរូ (Standard Deviation σ)។
  4. **មូលដ្ឋានគ្រឹះនៃវិទ្យាសាស្ត្រទិន្នន័យ និង AI (AI & Data Science Foundation)**៖ បណ្តាញណឺរ៉ូនសិប្បនិម្មិត (Neural Networks) ប្រើប្រាស់ប្រូបាបក្នុងការធ្វើការព្យាករណ៍ និងរៀនសូត្រពីសំណុំទិន្នន័យធំៗ។
  5. **ការអនុវត្តទូទៅ (Diverse Applications)**៖ ត្រូវបានប្រើប្រាស់យ៉ាងទូលំទូលាយចាប់ពីការព្យាករណ៍អាកាសធាតុ វិស័យអាកាសចរណ៍ រហូតដល់ហិរញ្ញវត្ថុ និងវិស្វកម្មទំនើប។`,

    function_variation: `### ការពន្យល់អំពីអថេរភាព និងក្រាបនៃអនុគមន៍ (Function Variation & Graphing)

* **ប្រភេទអនុគមន៍ (Function Type)**៖ របៀប "${mode || "logarithmic"}" ( logarithmic, exponential, or rational )។
* **ប៉ារ៉ាម៉ែត្របច្ចុប្បន្ន (Current Parameters)**៖
  - **ប៉ារ៉ាម៉ែត្រ a (paramA)**៖ ${paramA}
  - **ប៉ារ៉ាម៉ែត្រ b (paramB)**៖ ${paramB}
  - **ប៉ារ៉ាម៉ែត្រ c (paramC)**៖ ${paramC}
  - **របៀបបង្ហាញលំហ 3D (3D Mode)**៖ ${is3dStr}

* **គំនិតចម្បង និងទ្រឹស្តីបទសំខាន់ៗ (Core Mathematical Concepts)៖**
  1. **អនុគមន៍លោការីត (Logarithmic Function - y = a * ln(x - b) + c)**៖ ដែនកំណត់គឺ x > b។ មានអសីមតូតឈរ (Vertical Asymptote) ត្រង់ x = b។ ប្រសិនបើ a > 0 អនុគមន៍កើនដាច់ខាត។
  2. **អនុគមន៍អិចស្ប៉ូណង់ស្យែល (Exponential Function - y = a * e^(x - b) + c)**៖ មានដែនកំណត់លើ R។ មានអសីមតូតដេក (Horizontal Asymptote) ត្រង់ y = c។ វាលូតលាស់យ៉ាងលឿនបំផុត (Exponential Growth)។
  3. **អនុគមន៍សនិទាន (Rational Function - y = a / (x - b) + c)**៖ មានអសីមតូតឈរត្រង់ x = b និងអសីមតូតដេកត្រង់ y = c។ ក្រាបរបស់វាមានរាងជាអ៊ីពែបូល (Hyperbola)។
  4. **ដែនកំណត់ និងដេរីវេ (Limits & Derivatives)**៖ ជួយឱ្យយើងកំណត់ទិសដៅអថេរភាព (ទិសដៅឡើងចុះនៃក្រាប f'(x)) និងចំណុចបរមា (Extrema)។
  5. **ក្រាប 3D និងការផ្លាស់ប្តូររូបរាង**៖ ក្រាប 3D បង្ហាញពីការប្រែប្រួលផ្ទៃ (Surface Sheet) z = f(x, y) ធៀបនឹងប៉ារ៉ាម៉ែត្រ a, b, c ដែលជួយសម្រួលដល់ការយល់ដឹងពីលំហវិមាត្រខ្ពស់។`,

    vectors_in_space: `### ការពន្យល់អំពីវិចទ័រក្នុងលំហ (Vectors in Space)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "${mode || "engineering"}"។
* **តម្លៃកូអរដោនេវិចទ័រ (Vector Coordinates A)**៖ A = (${Number(data?.xVal || 4).toFixed(1)}, ${Number(data?.yVal || 3).toFixed(1)}, ${Number(data?.zVal || 5).toFixed(1)})។
* **របៀបលំហ 3D (3D View)**៖ ${is3dStr}

* **គំនិតចម្បង និងការអនុវត្តជាក់ស្តែង (Core Mathematical & Practical Applications)៖**
  1. **វិស្វកម្ម & សំណង់ (Engineering & Construction)**៖ វិចទ័រជួយគណនាកម្លាំងផ្ទុក (Load/Forces) លើរចនាសម្ព័ន្ធសំណង់ផ្សេងៗដូចជា ស្ពាន ឬអាគារខ្ពស់ៗក្នុងលំហ 3D ដើម្បីធានាបាននូវលំនឹង និងសុវត្ថិភាពខ្ពស់។
  2. **រូបវិទ្យា & ចលនា (Physics & Motion)**៖ ប្រើសម្រាប់ពណ៌នាអំពីទីតាំង 🚀 ល្បឿន និងសន្ទុះ របស់យន្តហោះ ផ្កាយរណប ឬយានអវកាសដែលធ្វើដំណើរក្នុងលំហអាកាស។
  3. **ក្រាហ្វិកកុំព្យូទ័រ & ហ្គេម (Computer Graphics & Games)**៖ វិចទ័រជាមូលដ្ឋានក្នុងការបង្កើតរូបភាព 3D ការកំណត់ទិសដៅពន្លឺ (Light Vectors) ធៀបនឹងផ្ទៃ (Normal Vectors) ដើម្បីឱ្យមានស្រមោលពិតៗ។
  4. **រ៉ូបូត & ស្វ័យប្រវត្តិកម្ម (Robots & Automation)**៖ ប្រើប្រាស់វិចទ័រដើម្បីបញ្ជា និងកំណត់ចលនារបស់ដៃរ៉ូបូត (Robotic Arms) ឱ្យផ្លាស់ទីទៅកាន់ទីតាំងច្បាស់លាស់ក្នុងលំហ។
  5. **គណិតវិទ្យាជាន់ខ្ពស់ (Advanced Math & Calculus)**៖ ជាមូលដ្ឋានគ្រឹះក្នុងការសិក្សា Calculus ក្នុងលំហ 3D ដូចជាការគណនាផលគុណស្កាលែ (Dot Product) និងផលគុណវិចទ័រ (Cross Product) ដើម្បីវិភាគគន្លងតារាវិថី។`,

    conics: `### ការពន្យល់អំពី ផ្នែកកោនិក (Conic Sections)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ ផ្នែកកោនិកប្រភេទ "${mode || "circle"}" (រង្វង់, អេលីប, ប៉ារ៉ាបូល, ឬ អ៊ីពែបូល)។
* **ប៉ារ៉ាមែត្រ (Parameters)**៖
  - **Scale a (paramA)**៖ ${paramA} (កាំ R, អ័ក្សធំ, ឬចម្ងាយកំណុំ)
  - **Scale b (paramB)**៖ ${paramB} (អ័ក្សតូច ឬប៉ារ៉ាមែត្រអ៊ីពែបូល)
  - **ផ្ចិត/កំពូល (h, k)**៖ (${Number(data?.h || 0).toFixed(1)}, ${Number(data?.k || 0).toFixed(1)})

* **របៀបនៃការបង្កើតផ្នែកកោនិកក្នុងលំហ 3D (Cone Intersection)៖**
  - **រង្វង់ (Circle)**៖ កើតឡើងនៅពេលប្លង់កាត់ (Slicing plane) ស្របនឹងបាតកោន (មុំកាត់ 0°ធៀបនឹងអ័ក្សដេក)។
  - **អេលីប (Ellipse)**៖ កើតឡើងនៅពេលប្លង់កាត់ទ្រេតបន្តិច ប៉ុន្តែកាត់កោនតែមួយចំហៀង (មុំកាត់តូចជាងមុំកោន)។
  - **ប៉ារ៉ាបូល (Parabola)**៖ កើតឡើងនៅពេលប្លង់កាត់ទ្រេតស្របនឹងបន្ទាត់បង្កើតកោន (មុំកាត់ស្មើនឹងមុំកោន)។
  - **អ៊ីពែបូល (Hyperbola)**៖ កើតឡើងនៅពេលប្លង់កាត់មានលក្ខណៈឈរចោតខ្លាំង កាត់កោនទាំងពីរផ្នែក (លើ និងក្រោម) បង្កើតបានបន្ទាត់កោងពីរទល់មុខគ្នា។

* **ការអនុវត្តក្នុងជីវិតជាក់ស្តែង (From Infographics):**
  1. **រង្វង់ (Circle)**៖ យន្តការកង់ឡាន (Wheels) និងគន្លងរង្វង់ផែនដី (Circular Orbits) ដែលមានកាំ R ថេរនៅគ្រប់ចំណុច។
  2. **អេលីប (Ellipse)**៖ គន្លងវិលរបស់ភពជុំវិញព្រះអាទិត្យ (Planetary Orbits) និងការឆ្លុះរលកសម្លេងនៅក្នុងស្ថាបត្យកម្មបន្ទប់ខ្សឹប (Whispering Gallery)។
  3. **ប៉ារ៉ាបូល (Parabola)**៖ ចានផ្កាយរណប (Satellite dish) ប្រមូលរលកសញ្ញា, ចង្កៀងបំភ្លឺមុខឡាន (Car Headlight) និងគន្លងគប់វត្ថុ (Projectile motion)។
  4. **អ៊ីពែបូល (Hyperbola)**៖ គន្លងយានអវកាសឆ្វៀលយកល្បឿន (Gravitational Assist Flyby), រលកសម្លេងរបស់យន្តហោះលឿនជាងសម្លេង (Supersonic Shockwaves), និងប្រព័ន្ធរ៉ាដានាវាចរណ៍ LORAN។`
  };

  return fallback[sub] || `ស្វាគមន៍មកកាន់ការពិសោធន៍វិទ្យាសាស្ត្រ! សូមសាកល្បងផ្លាស់ប្តូរប៉ារ៉ាមែត្រដើម្បីសិក្សាបន្ថែម។`;
};

const getLocalFallbackQuiz = (sub: SubjectType, data: any): QuizQuestion => {
  const amp = data?.amplitude !== undefined ? data.amplitude : 1;
  const protons = data?.protons !== undefined ? data.protons : 1;
  const electrons = data?.electrons !== undefined ? data.electrons : 1;

  const fallback: Record<string, QuizQuestion> = {
    math: {
      question: `ប្រសិនបើ Amplitude (អំព្លីទុត) ស្មើ ${amp} តើកម្ពស់ខ្ពស់បំផុតនៃរលកស៊ីនុស (Maximum Wave Height) គឺស្មើនឹងប៉ុន្មាន?`,
      options: [
        `ស្មើនឹង ${amp}`,
        `ស្មើនឹង ${amp * 2}`,
        `ស្មើនឹង 0`,
        `ស្មើនឹង -${amp}`
      ],
      correctIndex: 0,
      explanation: `តាមនិយមន័យ អំព្លីទុត (Amplitude) គឺជាចម្ងាយពីខ្សែអ័ក្សកណ្តាលទៅចំណុចកំពូលនៃរលក។ ក្រាហ្វលោតឡើងលើខ្ពស់បំផុតគឺស្មើនឹង Amplitude គឺ ${amp}។`
    },
    physics: {
      question: `នៅក្នុងចលនាគប់គ្រាប់ផ្លោង (Projectile Motion) ប្រសិនបើយើងបន្ថែម "ភាពទប់ខ្យល់ (Air Resistance)" តើនឹងមានអ្វីកើតឡើងចំពោះរយៈចម្ងាយបាញ់ឆ្ងាយបំផុត (Maximum Range)?`,
      options: [
        "រយៈចម្ងាយបាញ់នឹងកើនឡើង (Range increases)",
        "រយៈចម្ងាយបាញ់នឹងថយចុះ (Range decreases)",
        "រយៈចម្ងាយបាញ់នៅដដែល (Range remains same)",
        "គ្រាប់ផ្លោងនឹងហោះឡើងលើរហូតគ្មានថ្ងៃធ្លាក់ (Flies infinitely)"
      ],
      correctIndex: 1,
      explanation: "ភាពទប់ខ្យល់ (Air Resistance) បង្កើតកម្លាំងកកិតផ្ទុយនឹងទិសដៅចលនា ដែលធ្វើឱ្យថាមពលស៊ីនេទិចរបស់វាបាត់បង់ និងកាត់បន្ថយល្បឿន នាំឱ្យគ្រាប់ផ្លោងធ្លាក់បានចម្ងាយជិតជាងមុន។"
    },
    chemistry: {
      question: `ប្រសិនបើអាតូមមានប្រូតុង ${protons} និងអេឡិចត្រុង ${electrons} តើបន្ទុកសរុប (Net Charge) របស់វាស្មើនឹងប៉ុន្មាន?`,
      options: [
        `បន្ទុកវិជ្ជមាន +${protons}`,
        "បន្ទុកអវិជ្ជមាន -1",
        "បន្ទុកស្មើ 0 (ណឺត Neutral)",
        "បន្ទុកវិជ្ជមាន +2"
      ],
      correctIndex: (protons === electrons) ? 2 : (protons > electrons ? 0 : 1),
      explanation: `បន្ទុកសរុប (Net Charge) គណនាដោយយករូបមន្ត៖ [ចំនួនប្រូតុង (+) - ចំនួនអេឡិចត្រុង (-)]។ ក្នុងករណីនេះ ${protons} - ${electrons} = ${protons - electrons}។`
    },
    biology: {
      question: `ប្រសិនបើចំនួនសត្វចចក (Wolves) កើនឡើងខ្លាំងពេកនៅក្នុងប្រព័ន្ធអេកូឡូស៊ី តើមានផលប៉ះពាល់អ្វីដំបូងបង្អស់ដល់ចំនួនសត្វទន្សាយ (Rabbits)?`,
      options: [
        "សត្វទន្សាយនឹងកើនឡើងលឿនជាងមុន",
        "សត្វទន្សាយនឹងថយចុះយ៉ាងលឿន (Rabbits drop rapidly due to over-predation)",
        "សត្វទន្សាយទាំងអស់នឹងប្តូរទៅស៊ីសត្វចចកវិញ",
        "គ្មានការផ្លាស់ប្តូរអ្វីទាំងអស់"
      ],
      correctIndex: 1,
      explanation: "កាលណាសត្វប្រមាញ់ (Wolves) កើនឡើងខ្លាំង ពួកវានឹងស៊ីទន្សាយ (Prey) ច្រើនហួសកម្រិត ធ្វើឱ្យចំនួនទន្សាយធ្លាក់ចុះយ៉ាងលឿន ដែលអាចបង្កឱ្យចចកខ្សត់អាហារ និងថយចុះចំនួនតាមក្រោយ។"
    },
    complex: {
      question: "នៅក្នុងសមីការចំនួនកុំផ្លិច និមិត្តសញ្ញា i មានលក្ខណៈពិសេសអ្វីខ្លះ?",
      options: [
        "i = 0",
        "i = 1",
        "i² = -1",
        "i = -1"
      ],
      correctIndex: 2,
      explanation: "ឯកតានិម្មិត i ត្រូវបានកំណត់ដោយលក្ខណៈពិសេសចម្បងគឺ i² = -1 ដែលអនុញ្ញាតឱ្យយើងដោះស្រាយសមីការដូចជា x² + 1 = 0 ដែលគ្មានឫសក្នុងសំណុំចំនួនពិត។"
    },
    limits: {
      question: "នៅក្នុងការគណនាអាំងតេក្រាលដោយប្រើផលបូក Riemann (Riemann Sum), តើយើងត្រូវធ្វើដូចម្តេចដើម្បីឱ្យផ្ទៃក្រឡាចតុកោណកែងកាន់តែខិតជិតផ្ទៃក្រឡាពិតក្រោមខ្សែកោង?",
      options: [
        "បន្ថយចំនួនចតុកោណកែង N ឱ្យតូចបំផុត",
        "បង្កើនចំនួនចតុកោណកែង N ឱ្យខិតទៅរកអនន្ត (Increase N to infinity so width Δx approaches 0)",
        "bptf", // custom placeholder
        "លុបចតុកោណកែងទាំងអស់ចេញ"
      ],
      correctIndex: 1,
      explanation: "នៅពេលដែលយើងបង្កើនចំនួនចតុកោណកែង N ឱ្យកាន់តែច្រើន (ខិតទៅរកអនន្ត) នោះទទឹងចតុកោណកែងនីមួយៗ Δx នឹងកាន់តែតូចខិតទៅរក 0 ដែលធ្វើឱ្យផលបូកផ្ទៃចតុកោណកែងទាំងអស់រួមបញ្ចូលគ្នា ខិតទៅរកផ្ទៃក្រឡាពិតក្រោមខ្សែកោង (អាំងតេក្រាលពិត)។"
    },
    continuity: {
      question: "តើលក្ខខណ្ឌចម្បងទាំង ៣ ណាខ្លះដែលអនុគមន៍ f(x) ត្រូវតែបំពេញដើម្បីឱ្យវាជាប់ត្រង់ចំណុច x = c?",
      options: [
        "មាន f(c) កំណត់, មានលីមីត lim_{x→c} f(x), និង lim_{x→c} f(x) = f(c)",
        "f(c) ត្រូវតែស្មើ 0 ជានិច្ច",
        "លីមីតត្រូវតែខិតទៅរកអនន្តជានិច្ច",
        "អនុគមន៍គ្មានតម្លៃត្រង់ចំណុច c"
      ],
      correctIndex: 0,
      explanation: "ដើម្បីឱ្យអនុគមន៍ជាប់ត្រង់ចំណុច c លក្ខខណ្ឌទាំង ៣ ត្រូវតែបំពេញ៖ មាន f(c) កំណត់ច្បាស់លាស់, មានលីមីត lim_{x→c} f(x) កំណត់ច្បាស់លាស់, និងតម្លៃលីមីតត្រូវតែស្មើនឹងតម្លៃអនុគមន៍ត្រង់ចំណុចនោះ (lim_{x→c} f(x) = f(c))។"
    },
    probability: {
      question: "នៅក្នុងរបាយធម្មតា (Normal Distribution / Gaussian Bell Curve), តើចំណុចកំពូលកណ្តាលនៃខ្សែកោងតំណាងឱ្យតម្លៃអ្វី?",
      options: [
        "មធ្យមភាគ (Mean μ)",
        "គម្លាតគំរូ (Standard Deviation σ)",
        "ប្រូបាបសរុបនៃលំហសំណាក",
        "ភាពខុសគ្នារវាងទិន្នន័យ"
      ],
      correctIndex: 0,
      explanation: "នៅក្នុងរបាយធម្មតាដែលមានរាងដូចជួង (Gaussian Bell Curve) ស៊ីមេទ្រីគ្នាដ៏ល្អឥតខ្ចោះ ចំណុចកំពូលខ្ពស់បំផុត និងកណ្តាលតំណាងឱ្យតម្លៃ មធ្យមភាគ (Mean μ) ម៉ូដ (Mode) និងមេដ្យាន (Median) ដែលត្រូវគ្នានឹងកម្រិតដែលទិន្នន័យកើតឡើងច្រើនបំផុត។"
    },
    function_variation: {
      question: "នៅក្នុងអនុគមន៍លោការីត y = a * ln(x - b) + c តើខ្សែបន្ទាត់ណាជាអសីមតូតឈរ (Vertical Asymptote) នៃក្រាប?",
      options: [
        "បន្ទាត់ y = c",
        "បន្ទាត់ x = b",
        "បន្ទាត់ x = 0",
        "បន្ទាត់ y = b"
      ],
      correctIndex: 1,
      explanation: "ដោយសារដែនកំណត់នៃលោការីតនេពែ ln(u) គឺ u > 0 នោះកន្សោម (x - b) ត្រូវតែធំជាង 0 ពោលគឺ x > b។ នៅពេល x ខិតទៅរក b ពីខាងស្តាំ តម្លៃ f(x) ខិតទៅរកអនន្ត ហេតុនេះបន្ទាត់ឈរ x = b គឺជាអសីមតូតឈរ។"
    },
    vectors_in_space: {
      question: "ប្រសិនបើវិចទ័រ A មានកូអរដោនេ (x, y, z), តើម៉ូឌុល (ប្រវែង) នៃវិចទ័រ A ត្រូវបានគណនាតាមរូបមន្តណា?",
      options: [
        "||A|| = x + y + z",
        "||A|| = √(x² + y² + z²)",
        "||A|| = x * y * z",
        "||A|| = x² + y² + z²"
      ],
      correctIndex: 1,
      explanation: "ប្រវែង ឬម៉ូឌុល (Module) នៃវិចទ័រក្នុងលំហត្រូវបានគណនាតាមរូបមន្ត៖ ||A|| = √(x² + y² + z²)។ សម្រាប់កូអរដោនេបច្ចុប្បន្ន នេះជាការអនុវត្តទ្រឹស្តីបទពីតាករក្នុងលំហ 3D។"
    },
    conics: {
      question: "ប្រសិនបើ eccentricity (e) នៃផ្នែកកោនិកមួយមានតម្លៃ e = 1 តើវាជាប្រភេទផ្នែកកោនិកមួយណា?",
      options: [
        "រង្វង់ (Circle)",
        "អេលីប (Ellipse)",
        "ប៉ារ៉ាបូល (Parabola)",
        "អ៊ីពែបូល (Hyperbola)"
      ],
      correctIndex: 2,
      explanation: "Eccentricity (e) កំណត់រាងកោនិក៖ រង្វង់ (e = 0), អេលីប (0 < e < 1), ប៉ារ៉ាបូល (e = 1), និងអ៊ីពែបូល (e > 1)។ ដូចនេះ e = 1 គឺសម្រាប់ប៉ារ៉ាបូលយ៉ាងពិតប្រាកដ។"
    }
  };

  return fallback[sub] || {
    question: "តើចំណេះដឹងវិទ្យាសាស្ត្រជួយឱ្យយើងយល់ដឹងពីអ្វីខ្លះនៅក្នុងសកលលោក?",
    options: ["ច្បាប់រូបវិទ្យា", "ប្រតិកម្មគីមី", "ជីវិតសត្វលោក", "គ្រប់ចម្លើយខាងលើ"],
    correctIndex: 3,
    explanation: "វិទ្យាសាស្ត្រសិក្សាគ្រប់វិស័យទាំងអស់រួមមាន រូបវិទ្យា គីមីវិទ្យា គណិតវិទ្យា និងជីវវិទ្យា ដើម្បីយល់ពីច្បាប់ធម្មជាតិ"
  };
};

interface AiAssistantProps {
  subject: SubjectType;
  simulationData: any;
  triggerExplainCount: number; // to auto-trigger explanation when "AI explanation" is clicked in parent
}

export default function AiAssistant({ subject, simulationData, triggerExplainCount }: AiAssistantProps) {
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplain, setLoadingExplain] = useState<boolean>(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  
  // Quiz states
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // History states
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filterHistoryBySubject, setFilterHistoryBySubject] = useState<boolean>(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("science_sim_chat_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // Helper to parse **bold**, $inline math$, and $$block math$$
  const renderTextWithMath = (text: string) => {
    if (!text) return "";

    const trimmed = text.trim();
    // If it's a stand-alone block math, render as block
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      const formula = trimmed.slice(2, -2);
      return <MathRenderer key={text} formula={formula} block={true} />;
    }

    // Capture standard Markdown elements: block math, inline math, bold
    const tokenRegex = /(\$\$.*?\$\$|\$.*?\$|\*\*.*?\*\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const formula = part.slice(2, -2);
        return <MathRenderer key={idx} formula={formula} block={true} />;
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        const formula = part.slice(1, -1);
        return <MathRenderer key={idx} formula={formula} block={false} />;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={idx} className="text-teal-400 font-bold">{boldText}</strong>;
      }
      return part;
    });
  };

  // Translate basic markdown strings to readable styled HTML
  const formatMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split by lines
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-bold text-teal-300 mt-4 mb-2 border-b border-slate-800 pb-1 font-sans">{trimmed.replace("###", "").trim()}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} className="text-base font-bold text-teal-400 mt-4 mb-2 font-sans">{trimmed.replace("##", "").trim()}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2 font-sans">{trimmed.replace("#", "").trim()}</h2>;
      }

      // Bullet points
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const cleanLine = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
            {renderTextWithMath(cleanLine)}
          </li>
        );
      }

      // Regular paragraph
      if (trimmed.length === 0) return <div key={idx} className="h-2" />;
      
      return <div key={idx} className="text-xs text-slate-300 leading-relaxed mb-2">{renderTextWithMath(trimmed)}</div>;
    });
  };

  // Fetch explanation from Express backend
  const fetchExplanation = async (questionText = "") => {
    setLoadingExplain(true);
    setExplanation("");
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          simulationData,
          userQuestion: questionText || null,
        }),
      });
      if (!response.ok) {
        throw new Error("Server responded with non-200 status code");
      }
      const data = await response.json();
      const resultText = data.explanation || "មិនអាចទាញយកការពន្យល់បានទេ។";
      setExplanation(resultText);

      // Save to history!
      if (data.explanation) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
        const dateStr = now.toLocaleDateString("km-KH", { month: "numeric", day: "numeric" });
        
        const titleText = questionText 
          ? `សំណួរ៖ "${questionText}"`
          : `ការពន្យល់៖ ${getSubjectKhmerName(subject)}`;

        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          timestamp: `${dateStr}, ${timeStr}`,
          title: titleText,
          subject,
          content: resultText,
          subtitle: formatParamsSubtitle(subject, simulationData),
          userQuestion: questionText || undefined
        };

        setHistory((prev) => {
          const updated = [newItem, ...prev].slice(0, 50); // limit to last 50 items
          try {
            localStorage.setItem("science_sim_chat_history", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to persist chat history:", e);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Fetch explanation error, fallback to local client-side:", error);
      
      let resultText = getLocalFallbackExplanation(subject, simulationData);
      if (questionText) {
        resultText += `\n\n* **ចំណាំ (Note)៖** ម៉ាស៊ីនមេ AI កំពុងស្ថិតក្រោមការថែទាំ ឬមិនទាន់មានការតភ្ជាប់អ៉ីនធឺណិតដើម្បីឆ្លើយសំណួរជាក់លាក់៖ "${questionText}" របស់អ្នកឡើយ។ នេះជាព័ត៌មានលំនាំដើមសម្រាប់ជំនួយរបស់អ្នក។`;
      }
      setExplanation(resultText);

      // Save fallback explanation to history!
      const now = new Date();
      const timeStr = now.toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
      const dateStr = now.toLocaleDateString("km-KH", { month: "numeric", day: "numeric" });
      
      const titleText = questionText 
        ? `សំណួរ៖ "${questionText}" (លំនាំដើម)`
        : `ការពន្យល់៖ ${getSubjectKhmerName(subject)} (លំនាំដើម)`;

      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        timestamp: `${dateStr}, ${timeStr}`,
        title: titleText,
        subject,
        content: resultText,
        subtitle: formatParamsSubtitle(subject, simulationData),
        userQuestion: questionText || undefined
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, 50); // limit to last 50 items
        try {
          localStorage.setItem("science_sim_chat_history", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to persist chat history:", e);
        }
        return updated;
      });
    } finally {
      setLoadingExplain(false);
    }
  };

  // Generate dynamic quiz based on simulation states
  const fetchQuiz = async () => {
    setLoadingQuiz(true);
    setQuiz(null);
    setSelectedAnswer(null);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          simulationData,
        }),
      });
      if (!response.ok) {
        throw new Error("Server responded with non-200 status code");
      }
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error("Fetch quiz error, fallback to local client-side:", error);
      const fallbackQuiz = getLocalFallbackQuiz(subject, simulationData);
      setQuiz(fallbackQuiz);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Handle quiz answer selection
  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedAnswer !== null || !quiz) return;
    setSelectedAnswer(optionIdx);
    
    const isCorrect = optionIdx === quiz.correctIndex;
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  // Trigger auto-explanation when active simulation demands it
  useEffect(() => {
    if (triggerExplainCount > 0) {
      fetchExplanation();
    }
  }, [triggerExplainCount]);

  // Clean quiz and explanation when subject changes
  useEffect(() => {
    setExplanation("");
    setQuiz(null);
    setSelectedAnswer(null);
  }, [subject]);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    fetchExplanation(userQuestion);
    setUserQuestion("");
  };

  const handleClearHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("science_sim_chat_history", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save history:", err);
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    if (window.confirm("តើអ្នកពិតជាចង់លុបប្រវត្តិសួរឆ្លើយទាំងអស់មែនទេ?")) {
      setHistory([]);
      try {
        localStorage.removeItem("science_sim_chat_history");
      } catch (err) {
        console.error("Failed to clear history:", err);
      }
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setExplanation(item.content);
    setShowHistory(false);
  };

  return (
    <div id="ai-assistant-container" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Advisor Header */}
      <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans tracking-tight">
              គ្រូបង្រៀនវិទ្យាសាស្ត្រ AI (Gemini Agent)
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-widest">
              លទ្ធផលគណនាពេលវេលាពិត (Live Science Coach)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            id="btn-ai-toggle-history"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              showHistory
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
            }`}
            title="ប្រវត្តិសួរឆ្លើយ (Chat History)"
          >
            <History className="w-3.5 h-3.5" />
            <span className="font-sans text-[11px]">ប្រវត្តិសួរឆ្លើយ</span>
          </button>

          {/* Score banner */}
          {quizScore.total > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 font-mono text-[10px] text-slate-300">
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              <span>ពិន្ទុ៖ {quizScore.correct}/{quizScore.total}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content split into Explanation/Quiz tabs vs History View */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 font-sans">ប្រវត្តិការសួរឆ្លើយ (History Logs)</h3>
            </div>
            {history.length > 0 && (
              <button
                id="btn-ai-clear-all-history"
                onClick={handleClearAllHistory}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-sans cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                លុបទាំងអស់
              </button>
            )}
          </div>

          {/* Filter options */}
          {history.length > 0 && (
            <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 text-[11px] font-sans">តម្រងបង្ហាញ៖</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterHistoryBySubject(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans transition-all cursor-pointer ${
                    filterHistoryBySubject
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  មុខវិជ្ជាបច្ចុប្បន្ន ({getSubjectKhmerName(subject)})
                </button>
                <button
                  onClick={() => setFilterHistoryBySubject(false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans transition-all cursor-pointer ${
                    !filterHistoryBySubject
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  គ្រប់មុខវិជ្ជាទាំងអស់
                </button>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="space-y-2.5">
            {(() => {
              const filtered = filterHistoryBySubject
                ? history.filter((item) => item.subject === subject)
                : history;

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                    <Clock className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs text-slate-400 font-sans">មិនទាន់មានប្រវត្តិសួរនាំនៅឡើយទេ</p>
                    <p className="text-[10px] text-slate-600 font-sans mt-1 max-w-xs">
                      {filterHistoryBySubject 
                        ? `មិនទាន់មានប្រវត្តិសម្រាប់ "${getSubjectKhmerName(subject)}" ទេ។ សាកល្បងសួរគ្រូ AI ឥឡូវនេះ!`
                        : "រាល់ការពន្យល់ និងសំណួរដែលអ្នកបានសួរនឹងបង្ហាញនៅទីនេះ។"}
                    </p>
                  </div>
                );
              }

              return filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-xl p-3.5 transition-all cursor-pointer flex justify-between items-start gap-3 shadow-lg hover:shadow-cyan-500/5 duration-200"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20 font-sans font-medium">
                        {getSubjectKhmerName(item.subject)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 font-sans leading-snug group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight bg-black/20 px-2 py-0.5 rounded inline-block">
                        {item.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans pt-1">
                      {item.content.replace(/[#*`$-]/g, "")}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-full min-h-[50px]">
                    <button
                      onClick={(e) => handleClearHistoryItem(item.id, e)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="លុបប្រវត្តិនេះ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Core explanation area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>ការពន្យល់អំពីការពិសោធន៍ (Concept Analysis)</span>
              </div>
              {explanation && (
                <button
                  id="btn-ai-refresh-explanation"
                  onClick={() => fetchExplanation()}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              )}
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 min-h-[160px] flex flex-col justify-between relative shadow-inner">
              {loadingExplain ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-xl z-20">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 font-mono">កំពុងវិភាគទិន្នន័យពិសោធន៍...</span>
                </div>
              ) : null}

              {explanation ? (
                <div className="prose prose-invert max-w-none text-slate-300 scrollbar-thin">
                  {formatMarkdown(explanation)}
                </div>
              ) : !loadingExplain ? (
                <div className="flex flex-col items-center justify-center text-center py-6 px-4">
                  <Brain className="w-12 h-12 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400">
                    សូមចុចប៊ូតុង <span className="text-cyan-400 font-bold">"ពន្យល់ដោយគ្រូ AI"</span> នៅផ្នែកខាងលើនៃកម្មវិធីពិសោធន៍ ដើម្បីឱ្យគ្រូ AI វិភាគទ្រឹស្តីវិទ្យាសាស្ត្រ និងរូបមន្តគីមី/រូបវិទ្យា។
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Dynamic Quiz Card Generator */}
          <div className="border-t border-white/5 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>ធ្វើតេស្តចំណេះដឹងរបស់អ្នក (Science Quiz)</span>
              </div>
              <button
                id="btn-ai-start-quiz"
                onClick={fetchQuiz}
                disabled={loadingQuiz}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {loadingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                សួរតេស្តថ្មី (Get Question)
              </button>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-xl p-4 min-h-[140px] relative">
              {loadingQuiz && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-xl z-10">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 font-mono">កំពុងបង្កើតសំណួរថ្មីពីទិន្នន័យ...</span>
                </div>
              )}

              {quiz ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-100 leading-relaxed font-sans">{quiz.question}</h4>
                  
                  {/* 4 multiple choice options */}
                  <div className="grid grid-cols-1 gap-2">
                    {quiz.options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = quiz.correctIndex === idx;
                      const showFeedback = selectedAnswer !== null;

                      let btnClass = "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10";
                      
                      if (showFeedback) {
                        if (isCorrect) {
                          btnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5";
                        } else if (isSelected) {
                          btnClass = "bg-rose-500/10 border-rose-500 text-rose-400 font-bold shadow-lg shadow-rose-500/5";
                        } else {
                          btnClass = "bg-black/20 border-white/5 text-slate-600 cursor-not-allowed";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          id={`btn-quiz-option-${idx}`}
                          disabled={showFeedback}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnClass}`}
                        >
                          <span>{option}</span>
                          {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />}
                          {showFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show quiz explanation below after answering */}
                  {selectedAnswer !== null && (
                    <div className="bg-black/40 border border-white/10 p-3 rounded-lg mt-3 text-[11px] text-slate-300 leading-relaxed animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {selectedAnswer === quiz.correctIndex ? (
                          <span className="text-emerald-400">🎉 ចម្លើយត្រឹមត្រូវ!</span>
                        ) : (
                          <span className="text-rose-400">❌ មិនទាន់ត្រឹមត្រូវទេ!</span>
                        )}
                      </div>
                      <p className="text-slate-400 font-sans">{quiz.explanation}</p>
                    </div>
                  )}
                </div>
              ) : !loadingQuiz ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <Brain className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 max-w-xs">
                    ចុចប៊ូតុង <span className="text-cyan-400 font-bold">"សួរតេស្តថ្មី"</span> ដើម្បីសាកល្បងសំណួរពហុជ្រើសរើស ទៅលើប្រធានបទពិសោធន៍បច្ចុប្បន្ន។
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Freeform Student Chat Bar at very bottom */}
      <form onSubmit={handleAskQuestion} className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
        <input
          id="input-ai-user-question"
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="សួរគ្រូ AI បន្ថែម... (ឧ. ហេតុអ្វីមុំ ៤៥° បាញ់បានឆ្ងាយ?)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
        />
        <button
          id="btn-ai-submit-question"
          type="submit"
          className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center flex-shrink-0"
          title="Send question to AI"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
