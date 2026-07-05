import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY environment variable is missing.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI client:", error);
}

// 1. API: Explain current simulation parameters in Khmer
app.post("/api/explain", async (req: any, res: any) => {
  const { subject, simulationData, userQuestion } = req.body;

  if (!subject || !simulationData) {
    return res.status(400).json({ error: "Missing required fields: subject and simulationData." });
  }

  const prompt = `
You are an inspiring, friendly science teacher in Cambodia who explains scientific and mathematical concepts in a clear, easy-to-understand, and engaging way.
Please explain the scientific principles behind this simulation to high school students in Cambodia.

Subject: ${subject}
Simulation Parameters: ${JSON.stringify(simulationData, null, 2)}
${userQuestion ? `Specific student question to answer: "${userQuestion}"` : "Please explain how the variables interact, the mathematical formulas involved, and where we see this in everyday life."}

CRITICAL INSTRUCTIONS:
- Write the explanation primarily in Cambodian (Khmer), but keep key scientific terms and English formulas in brackets so students learn the international standards (e.g. "ល្បឿន (Velocity)", "កម្លាំងទំនាញដី (Gravity)").
- Use markdown for headers, bullet points, and highlight formulas.
- Make it extremely encouraging, using warm, supportive Khmer teaching style (e.g., using "ប្អូនៗ", "សិស្សានុសិស្ស").
- Limit the explanation to a couple of concise, clear paragraphs and bullet points so it is readable on a mobile/tablet screen.
`;

  try {
    if (!ai) {
      throw new Error("Gemini API client is not initialized due to missing API key.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Gemini Explain Error:", error);
    // Fallback static explanation in Khmer if API key is not present or query fails
    const fallbackExplanations: Record<string, string> = {
      math: `### ការពន្យល់អំពីអនុគមន៍ត្រីកោណមាត្រ (Trigonometry Explanation)

* **រលកស៊ីនុស (Sine Wave)**៖ រលកស៊ីនុសកើតឡើងពីការវាស់កម្ពស់ចំណុចនៅលើរង្វង់ខ្នាត (Unit Circle) នៅពេលវាវិល។
* **Amplitude (អំព្លីទុត)**៖ \${simulationData.amplitude || 1} — កំណត់កម្ពស់ខ្ពស់បំផុត និងទាបបំផុតនៃរលក។ កាលណាអំព្លីទុតកាន់តែធំ រលកកាន់តែខ្ពស់។
* **Frequency (ហ្វ្រេកង់)**៖ \${simulationData.frequency || 1} Hz — ចំនួនដងដែលរលកលោតឡើងចុះក្នុងមួយវិនាទី។ កាលណា frequency កាន់តែខ្ពស់ រលកកាន់តែញឹក។
* **Phase Shift (លំអៀងផាស)**៖ \${simulationData.phase || 0} rad — កំណត់ការរំកិលរលកទៅឆ្វេង ឬស្តាំ។

**ជីវិតប្រចាំថ្ងៃ៖** រលកទាំងនេះប្រើប្រាស់សម្រាប់គណនារលកសំឡេង រលកពន្លឺ និងចរន្តអគ្គិសនីឆ្លាស់ (AC Electricity)។`,

      physics: `### ការពន្យល់អំពីចលនាគប់គ្រាប់ផ្លោង (Projectile Motion)

* **មុំគប់ (Launch Angle)**៖ \${simulationData.angle || 45}° — មុំដែលគប់ចេញធៀបនឹងដី។ មុំ 45° ផ្តល់ចម្ងាយឆ្ងាយបំផុត (ក្នុងករណីគ្មានភាពទប់ខ្យល់)។
* **ល្បឿនដើម (Initial Velocity)**៖ \${simulationData.velocity || 15} m/s — ល្បឿនចាប់ផ្តើមបាញ់ចេញ។ ល្បឿនកាន់តែលឿន នាំឱ្យគ្រាប់ផ្លោងហោះបានកាន់តែឆ្ងាយ និងខ្ពស់។

**ជីវិតជាក់ស្តែង៖** ចលនានេះត្រូវបានអនុវត្តនៅក្នុងការលេងកីឡា (ទាត់បាល់ បោះបាល់) វិស្វកម្មយោធា និងការបាញ់បង្ហោះរ៉ុក្កែត។`,

      chemistry: `### ការពន្យល់អំពីការសាងសង់អាតូម (Atom Builder Explanation)

* **ប្រូតុង (Protons)**៖ \${simulationData.protons || 1} — កំណត់ប្រភេទធាតុគីមី និងបន្ទុកស្នូលវិជ្ជមាន។
* **ណឺត្រុង (Neutrons)**៖ \${simulationData.neutrons || 0} — ជួយរក្សាស្ថិរភាពស្នូលគីមី។
* **អេឡិចត្រុង (Electrons)**៖ \${simulationData.electrons || 1} — វិលជុំវិញស្នូល និងកំណត់បន្ទុកអគ្គិសនីសរុប។

**ជីវិតប្រចាំថ្ងៃ៖** ការយល់ដឹងពីរចនាសម្ព័ន្ធអាតូមគឺជាគ្រឹះសម្រាប់វិស័យគីមីវិទ្យា ឱសថ និងថាមពលនុយក្លេអ៊ែរ។`,

      biology: `### ការពន្យល់អំពីប្រព័ន្ធអេកូឡូស៊ី សត្វព្រៃ (Predator-Prey Ecosystem)

* **ទន្សាយ (Rabbits - Prey)**៖ \${simulationData.rabbits || 50} ក្បាល — ជាសត្វស៊ីស្មៅ និងជាចំណីរបស់សត្វចចក។ ចំនួនកើនឡើងលឿនបើគ្មានសត្វចចកស៊ី។
* **ចចក (Wolves - Predator)**៖ \${simulationData.wolves || 10} ក្បាល — ជាសត្វស៊ីសាច់ដែលបរបាញ់ទន្សាយ។ បើគ្មានទន្សាយស៊ីទេ ចំនួនចចកនឹងថយចុះរហូតដល់ផុតពូជ។
* **វាលស្មៅ (Grass/Environment)**៖ ផ្តល់អាហារដល់ទន្សាយដើម្បីលូតលាស់។

**ជីវិតជាក់ស្តែង៖** ការយល់ដឹងអំពីតុល្យភាពនេះជួយក្នុងការអភិរក្សសត្វព្រៃ និងគ្រប់គ្រងបរិស្ថាន។`,

      complex: `### ការពន្យល់អំពីចំនួនកុំផ្លិច និងការអនុវត្ត (Complex Numbers and Applications)

* **របៀបបង្ហាញ (Representation)**៖ ចំនួនកុំផ្លិចត្រូវបានសរសេរជាទម្រង់ z = a + bi ដែល a ជាផ្នែកពិត (Real Part) និង b ជាផ្នែកនិម្មិត (Imaginary Part) ជាមួយលក្ខណៈពិសេស i² = -1។
* **របៀបពិសោធន៍បច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "\${simulationData.mode || "argand"}"។
* **កម្មវិធីក្នុងជីវិតជាក់ស្តែង (Real-world Applications)៖**
  1. **វិស្វកម្មអគ្គិសនី (Electrical Engineering)**៖ ប្រើសម្រាប់គណនាផាស និង អ៊ីមផេដង់ Z = R + jX នៃចរន្តឆ្លាស់។
  2. **មេកានិចកង់ទិច (Quantum Mechanics)**៖ រលក Schrodinger Ψ(x,t) ប្រើចំនួនកុំផ្លិចដើម្បីកំណត់ស្ថានភាពភាគល្អិត។
  3. **ឌីជីថល (Signal Processing)**៖ ការបម្លែង Fourier និង Epicycles ប្រើចំនួនកុំផ្លិចដើម្បីវិភាគហ្វ្រេកង់រលកសំឡេង ឬរូបភាព។
  4. **ក្រាហ្វិកកុំព្យូទ័រ (Computer Graphics)**៖ ការបង្វិលកូអរដោនេក្នុងលំហ 2D/3D ដោយការគុណនឹងចំនួនកុំផ្លិច e^(iθ) និងការប្រើប្រាស់ Quaternions។
  5. **ប្រភាគធរណីមាត្រ (Fractals)**៖ បង្កើតរូបភាពស្អាតៗដូចជា សំណុំ Mandelbrot និង Julia តាមរយៈរូបមន្តស្វ័យគណនា z_{n+1} = z_n² + c។`,

      limits: `### ការពន្យល់អំពី លីមីត និងគ្រឹះគណនា (Limits & Calculus Explanation)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "\select simulationData.mode || "integral"}"។
* **គំនិតចម្បងនៃលីមីត (Core Concept of Limit)៖**
  - **លីមីត (Limits)** ជួយយើងសិក្សាពីតម្លៃនៃអនុគមន៍ f(x) នៅពេល x ទៅជិតតម្លៃ a ណាមួយ ទោះបីជានៅត្រង់ a អនុគមន៍គ្មានន័យ (ដូចជាទម្រង់ 0/0) ក៏ដោយ។
  - វាក្លាយជាគ្រឹះដ៏សំខាន់សម្រាប់ **ដេរីវេ (Derivative - lim h→0 Δy/Δh)** និង **អាំងតេក្រាល (Integral - lim N→∞ Σf(xi)Δx)**。

* **ការអនុវត្តជាក់ស្តែងក្នុងរូបភាព (From worksheets):**
  1. **មូលដ្ឋានគ្រឹះនៃ Calculus**: លីមីតជាគ្រឹះសម្រាប់ដេរីវេ និងអាំងតេក្រាល។
  2. **ទម្រង់មិនកំណត់**: ដោះស្រាយតម្លៃ 0/0 ដោយប្រើការសម្រួលកន្សោម (x - a)។
  3. **វិភាគឥរិយាបថ**: សិក្សាអសីមតូតដូចជា y = 1/x។
  4. **ជីវិតពិត**: គណនាល្បវេខណៈ (Instantaneous speed) នៃយានយន្ត ឬរ៉ុក្កែត (Rocket)。`,

      continuity: `### ការពន្យល់អំពី ភាពជាប់នៃអនុគមន៍ (Continuity & Discontinuity Explanation)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "\${simulationData.mode || "foundation"}"。
* **គំនិតចម្បងនៃភាពជាប់ (Core Concept of Continuity)៖**
  - អនុគមន៍ f(x) ជាប់ត្រង់ចំណុច c លុះត្រាតែមានលក្ខខណ្ឌ ៣៖ 
    1. មានតម្លៃ f(c) ពិតប្រាកដ
    2. មានលីមីត lim_{x→c} f(x)
    3. លីមីតស្មើនឹងតម្លៃអនុគមន៍៖ lim_{x→c} f(x) = f(c)

* **ការវិភាគតាមគំនិតក្នុងរូបភាព (From Khmer learning posters):**
  1. **គ្រឹះនៃ Calculus**: ភាពជាប់គឺចាំបាច់សម្រាប់ដេរីវេ (Derivative) និងធានាថាអនុគមន៍អាចគណនាអាំងតេក្រាលបាន (Integrability)。
  2. **ម៉ូដែលពិភពពិត**: សីតុណ្ហភាព កម្ពស់ និងពេលវេលា ប្រែប្រួលជាប់រលូនជានិច្ច មិនលោតផ្លោះឡើយ។
  3. **ទ្រឹស្តីបទសំខាន់ៗ**: 
     - *ទ្រឹស្តីបទតម្លៃមធ្យម (IVT)* ធានាការមានឫសពិតក្នុងចន្លោះបិទ។
     - *ទ្រឹស្តីបទតម្លៃខ្ពស់បំផុត-ទាបបំផុត (EVT)* ធានាការមានតម្លៃអតិបរមា និងអប្បបរមាពិតប្រាកដ។
  4. **ស្ថិរភាពប្រព័ន្ធ**: ក្នុងវិស្វកម្មរ៉ូបូត ភាពជាប់ជួយការពារកុំឱ្យមានការប្រែប្រួលខ្លាំងពេកជាយថាហេតុដែលនាំឱ្យបាក់បែកឧបករណ៍។
  5. **ភាពមិនជាប់**: សិក្សាពីការលោត (Jump), ប្រហោង (Hole), និងអសីមតូតឈរ (Infinite)។`,

      derivative: `### ការពន្យល់អំពី ដេរីវេនៃអនុគមន៍ (Derivatives & Practical Applications)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Mode)**៖ របៀប "\${simulationData.mode || "rate"}" (តម្លៃកូអរដោនេ x = \${simulationData.xVal || 2})។
* **គំនិតចម្បងនៃដេរីវេ (Core Concept of Derivative)៖**
  - ដេរីវេ f'(x) ត្រង់ចំណុច x គឺជា **អត្រាបម្រែបម្រួលភ្លាមៗ (Instantaneous rate of change)** នៃ y ធៀបនឹង x ដែលជាមេគុណប្រាប់ទិសនៃខ្សែបន្ទាត់ប៉ះ (Tangent line) ទៅនឹងក្រាហ្វនៃ f(x) ត្រង់ចំណុចនោះ។

* **កម្មវិធីក្នុងរូបភាព និងជីវិតជាក់ស្តែង (From the Khmer Learning Poster):**
  1. **គណនាអត្រាប្រែប្រួលភ្លាមៗ (Instantaneous Rate of Change)**៖ គណនាល្បឿនខណៈ v(t) = s'(t) ពីទីតាំង, សន្ទុះ a(t) = v'(t) ពីល្បឿន។ (ដូចជាការវិភាគល្បឿនឡាន ឬបាល់ធ្លាក់)។
  2. **ស្វែងរកតម្លៃអតិបរមា និងអប្បបរមា (Optimization)**៖ កំណត់បរិមាណសមស្របដើម្បីទទួលបានផលចំណេញខ្ពស់បំផុត (Maximum Profit where P'(x) = 0) ឬថ្លៃដើមទាបបំផុត (Minimum Cost where C'(x) = 0)។
  3. **ចលនានិងរូបវិទ្យា (Motion & Physics)**៖ វិភាគគន្លងផ្កាយរណប គន្លងហោះហើររបស់រ៉ុក្កែត ឬការទាត់បាល់ទាត់ ដោយប្រើច្បាប់ចលនារបស់ញូតុន (Newton's laws of motion)។
  4. **ម៉ូដែលសេដ្ឋកិច្ច (Economic Models)**៖ គណនាថ្លៃដើមបន្ថែម (Marginal Cost) និងប្រាក់ចំណូលបន្ថែម (Marginal Revenue) ដើម្បីវិភាគលំនឹងនៃការផ្គត់ផ្គង់ និងតម្រូវការ។
  5. **វិស្វកម្ម និងបច្ចេកវិទ្យា (Engineering & Technology)**៖ រចនាស្ពានខ្សែយោង (Suspension Bridge) ដែលប្រើដេរីវេដើម្បីកំណត់កម្លាំងទាញតង់ស្យុង (Tension force) នៃខ្សែយោង និងវិភាគប្រព័ន្ធគ្រប់គ្រងស្វ័យប្រវត្តិនៃគ្រឿងយន្ត។`,

      probability: `### ការពន្យល់អំពី ប្រូបាបនៃអនុគមន៍ (Probability of Functions & Distributions)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "\${simulationData.mode || "decision"}"។
* **ប៉ារ៉ាម៉ែត្រ (Parameters)**៖ 
  - **តម្លៃទី១ (xVal)**៖ \${simulationData.xVal || 50} (តំណាងឱ្យកម្រិតសម្រេចចិត្ត ឬមធ្យមភាគ μ ឬអត្រាសកម្មភាព)
  - **តម្លៃទី២ (param2)**៖ \${simulationData.param2 || 50} (តំណាងឱ្យគម្លាតគំរូ σ ឬកម្រិតប្រូបាប)

* **គំនិតចម្បង និងកម្មវិធីក្នុងជីវិតជាក់ស្តែង (From the Khmer Learning Poster):**
  1. **ការធ្វើសេចក្តីសម្រេចចិត្ត (Informed Decision-Making)**៖ ប្រូបាបជួយគណនា និងថ្លឹងថ្លែងរវាងហានិភ័យ (Risk) និងផលលាភ (Reward) ដើម្បីធ្វើសេចក្តីសម្រេចចិត្តដ៏ត្រឹមត្រូវបំផុត។
  2. **ការគ្រប់គ្រងហានិភ័យ (Risk Management & Assessment)**៖ ប្រើប្រាស់ក្នុងការធានារ៉ាប់រង និងការវាយតម្លៃភាពរឹងមាំ ឬសុវត្ថិភាពនៃប្រព័ន្ធនានា ដើម្បីកាត់បន្ថយការខូចខាតពីភាពមិនប្រាកដប្រជា។
  3. **ភាពមិនប្រាកដប្រជា (Randomness & Uncertainty)**៖ ការសិក្សាពីកម្រិតប្រែប្រួលតាមរយៈ របាយប៊ែលខឺវ (Gaussian/Normal Distribution) ដែលមានជាមធ្យមភាគ (Mean μ) និងគម្លាតគំរូ (Standard Deviation σ)។
  4. **មូលដ្ឋានគ្រឹះនៃវិទ្យាសាស្ត្រទិន្នន័យ និង AI (AI & Data Science Foundation)**៖ បណ្តាញណឺរ៉ូនសិប្បនិម្មិត (Neural Networks) ប្រើប្រាស់ប្រូបាបក្នុងការធ្វើការព្យាករណ៍ និងរៀនសូត្រពីសំណុំទិន្នន័យធំៗ។
  5. **ការអនុវត្តទូទៅ (Diverse Applications)**៖ ត្រូវបានប្រើប្រាស់យ៉ាងទូលំទូលាយចាប់ពីការព្យាករណ៍អាកាសធាតុ វិស័យអាកាសចរណ៍ រហូតដល់ហិរញ្ញវត្ថុ និងវិស្វកម្មទំនើប។`,

      function_variation: `### ការពន្យល់អំពីអថេរភាព និងក្រាបនៃអនុគមន៍ (Function Variation & Graphing)

* **ប្រភេទអនុគមន៍ (Function Type)**៖ របៀប "\${simulationData.mode || "logarithmic"}" ( logarithmic, exponential, or rational )។
* **ប៉ារ៉ាម៉ែត្របច្ចុប្បន្ន (Current Parameters)**៖
  - **ប៉ារ៉ាម៉ែត្រ a (paramA)**៖ \${simulationData.paramA || 1.5}
  - **ប៉ារ៉ាម៉ែត្រ b (paramB)**៖ \${simulationData.paramB || 0.0}
  - **ប៉ារ៉ាម៉ែត្រ c (paramC)**៖ \${simulationData.paramC || 1.0}
  - **របៀបបង្ហាញលំហ 3D (3D Mode)**៖ \${simulationData.is3d ? "បើក (Enabled)" : "បិទ (Disabled)"}

* **គំនិតចម្បង និងទ្រឹស្តីបទសំខាន់ៗ (Core Mathematical Concepts)៖**
  1. **អនុគមន៍លោការីត (Logarithmic Function - y = a * ln(x - b) + c)**៖ ដែនកំណត់គឺ x > b។ មានអសីមតូតឈរ (Vertical Asymptote) ត្រង់ x = b។ ប្រសិនបើ a > 0 អនុគមន៍កើនដាច់ខាត។
  2. **អនុគមន៍អិចស្ប៉ូណង់ស្យែល (Exponential Function - y = a * e^(x - b) + c)**៖ មានដែនកំណត់លើ R។ មានអសីមតូតដេក (Horizontal Asymptote) ត្រង់ y = c។ វាលូតលាស់យ៉ាងលឿនបំផុត (Exponential Growth)។
  3. **អនុគមន៍សនិទាន (Rational Function - y = a / (x - b) + c)**៖ មានអសីមតូតឈរត្រង់ x = b និងអសីមតូតដេកត្រង់ y = c។ ក្រាបរបស់វាមានរាងជាអ៊ីពែបូល (Hyperbola)។
  4. **ដែនកំណត់ និងដេរីវេ (Limits & Derivatives)**៖ ជួយឱ្យយើងកំណត់ទិសដៅអថេរភាព (ទិសដៅឡើងចុះនៃក្រាប f'(x)) និងចំណុចបរមា (Extrema)。
  5. **ក្រាប 3D និងការផ្លាស់ប្តូររូបរាង**៖ ក្រាប 3D បង្ហាញពីការប្រែប្រួលផ្ទៃ (Surface Sheet) z = f(x, y) ធៀបនឹងប៉ារ៉ាម៉ែត្រ a, b, c ដែលជួយសម្រួលដល់ការយល់ដឹងពីលំហវិមាត្រខ្ពស់។`,

      vectors_in_space: `### ការពន្យល់អំពីវិចទ័រក្នុងលំហ (Vectors in Space)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ របៀប "\${simulationData.mode || "engineering"}"។
* **តម្លៃកូអរដោនេវិចទ័រ (Vector Coordinates A)**៖ A = (\${simulationData.xVal || 4}, \${simulationData.yVal || 3}, \${simulationData.zVal || 5})។
* **របៀបលំហ 3D (3D View)**៖ \${simulationData.is3d ? "បើក (Enabled)" : "បិទ (Disabled)"}

* **គំនិតចម្បង និងការអនុវត្តជាក់ស្តែង (Core Mathematical & Practical Applications)៖**
  1. **វិស្វកម្ម & សំណង់ (Engineering & Construction)**៖ វិចទ័រជួយគណនាកម្លាំងផ្ទុក (Load/Forces) លើរចនាសម្ព័ន្ធសំណង់ផ្សេងៗដូចជា ស្ពាន ឬអាគារខ្ពស់ៗក្នុងលំហ 3D ដើម្បីធានាបាននូវលំនឹង និងសុវត្ថិភាពខ្ពស់។
  2. **រូបវិទ្យា & ចលនា (Physics & Motion)**៖ ប្រើសម្រាប់ពណ៌នាអំពីទីតាំង 🚀 ល្បឿន និងសន្ទុះ របស់យន្តហោះ ផ្កាយរណប ឬយានអវកាសដែលធ្វើដំណើរក្នុងលំហអាកាស។
  3. **ក្រាហ្វិកកុំព្យូទ័រ & ហ្គេម (Computer Graphics & Games)**៖ វិចទ័រជាមូលដ្ឋានក្នុងការបង្កើតរូបភាព 3D ការកំណត់ទិសដៅពន្លឺ (Light Vectors) ធៀបនឹងផ្ទៃ (Normal Vectors) ដើម្បីឱ្យមានស្រមោលពិតៗ។
  4. **រ៉ូបូត & ស្វ័យប្រវត្តិកម្ម (Robots & Automation)**៖ ប្រើប្រាស់វិចទ័រដើម្បីបញ្ជា និងកំណត់ចលនារបស់ដៃរ៉ូបូត (Robotic Arms) ឱ្យផ្លាស់ទីទៅកាន់ទីតាំងច្បាស់លាស់ក្នុងលំហ។
  5. **គណិតវិទ្យាជាន់ខ្ពស់ (Advanced Math & Calculus)**៖ ជាមូលដ្ឋានគ្រឹះក្នុងការសិក្សា Calculus ក្នុងលំហ 3D ដូចជាការគណនាផលគុណស្កាលែ (Dot Product) និងផលគុណវិចទ័រ (Cross Product) ដើម្បីវិភាគគន្លងតារាវិថី។`,

      conics: `### ការពន្យល់អំពី ផ្នែកកោនិក (Conic Sections)

* **របៀបសិក្សាបច្ចុប្បន្ន (Current Active Mode)**៖ ផ្នែកកោនិកប្រភេទ "\${simulationData.mode || "circle"}" (រង្វង់, អេលីប, ប៉ារ៉ាបូល, ឬ អ៊ីពែបូល)។
* **ប៉ារ៉ាម៉ែត្រ (Parameters)**៖
  - **Scale a (paramA)**៖ \${simulationData.paramA || 4.0} (កាំ R, អ័ក្សធំ, ឬចម្ងាយកំណុំ)
  - **Scale b (paramB)**៖ \${simulationData.paramB || 3.0} (អ័ក្សតូច ឬប៉ារ៉ាម៉ែត្រអ៊ីពែបូល)
  - **ផ្ចិត/កំពូល (h, k)**៖ (\${simulationData.h || 0.0}, \${simulationData.k || 0.0})

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

    res.json({
      explanation: fallbackExplanations[subject] || `ស្វាគមន៍មកកាន់ការពិសោធន៍វិទ្យាសាស្ត្រ! សូមសាកល្បងផ្លាស់ប្តូរប៉ារ៉ាម៉ែត្រដើម្បីសិក្សាបន្ថែម។`,
      warning: "Operating in educational demo mode due to API key configuration."
    });
  }
});

// 2. API: Generate an interactive multiple-choice quiz
app.post("/api/quiz", async (req: any, res: any) => {
  const { subject, simulationData } = req.body;

  if (!subject || !simulationData) {
    return res.status(400).json({ error: "Missing required fields: subject and simulationData." });
  }

  const prompt = `
Based on the current settings of the science simulation, generate 1 highly educational multiple-choice quiz question in Khmer with English terms in brackets for students.

Subject: ${subject}
Current State Parameters: ${JSON.stringify(simulationData, null, 2)}

You MUST respond with a single, strictly formatted JSON object matching the schema below.
DO NOT wrap the JSON in markdown code blocks. DO NOT add any extra text or comments.

JSON Schema:
{
  "question": "The question in Khmer (with English terms in brackets)",
  "options": [
    "Option A (Khmer / English)",
    "Option B (Khmer / English)",
    "Option C (Khmer / English)",
    "Option D (Khmer / English)"
  ],
  "correctIndex": <0, 1, 2, or 3 representing the correct option>,
  "explanation": "Detailed explanation of why this answer is correct in Khmer, referencing the active simulation parameters."
}
`;

  try {
    if (!ai) {
      throw new Error("Gemini API client is not initialized.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctIndex", "explanation"]
        }
      }
    });

    const quizData = JSON.parse(response.text.trim());
    res.json(quizData);
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    // Fallback static quiz based on active subject
    const fallbackQuizzes: Record<string, any> = {
      math: {
        question: `ប្រសិនបើ Amplitude (អំព្លីទុត) ស្មើ \${simulationData.amplitude || 1} តើកម្ពស់ខ្ពស់បំផុតនៃរលកស៊ីនុស (Maximum Wave Height) គឺស្មើនឹងប៉ុន្មាន?`,
        options: [
          `ស្មើនឹង \${simulationData.amplitude || 1}`,
          `ស្មើនឹង \${(simulationData.amplitude || 1) * 2}`,
          `ស្មើនឹង 0`,
          `ស្មើនឹង -\${simulationData.amplitude || 1}`
        ],
        correctIndex: 0,
        explanation: `តាមនិយមន័យ អំព្លីទុត (Amplitude) គឺជាចម្ងាយពីខ្សែអ័ក្សកណ្តាលទៅចំណុចកំពូលនៃរលក។ ដូច្នេះកម្ពស់ខ្ពស់បំផុតគឺស្មើនឹង Amplitude ពោលគឺ \${simulationData.amplitude || 1}។`
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
        question: `ប្រសិនបើអាតូមមានប្រូតុង \${simulationData.protons || 1} និងអេឡិចត្រុង \${simulationData.electrons || 1} តើបន្ទុកសរុប (Net Charge) របស់វាស្មើនឹងប៉ុន្មាន?`,
        options: [
          `បន្ទុកវិជ្ជមាន +\${simulationData.protons || 1}`,
          "បន្ទុកអវិជ្ជមាន -1",
          "បន្ទុកស្មើ 0 (ណឺត Neutral)",
          "បន្ទុកវិជ្ជមាន +2"
        ],
        correctIndex: (simulationData.protons === simulationData.electrons) ? 2 : (simulationData.protons > simulationData.electrons ? 0 : 1),
        explanation: `បន្ទុកសរុប (Net Charge) គណនាដោយយករូបមន្ត៖ [ចំនួនប្រូតុង (+) - ចំនួនអេឡិចត្រុង (-)]។ ក្នុងករណីនេះ \${simulationData.protons} - \${simulationData.electrons} = \${simulationData.protons - simulationData.electrons}។`
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
        explanation: "កាលណាសត្វប្រមាញ់ (Wolves) កើនឡើងខ្លាំង ពួកវានឹងស៊ីទន្សាយ (Prey) ច្រើនលើសលប់ ធ្វើឱ្យចំនួនទន្សាយធ្លាក់ចុះយ៉ាងលឿន ដែលអាចបង្កឱ្យចចកខ្សត់អាហារ និងថយចុះចំនួនតាមក្រោយ។"
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
          "ប្តូរពណ៌ចតុកោណកែងឱ្យភ្លឺជាងមុន",
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

    res.json(fallbackQuizzes[subject] || {
      question: "តើចំណេះដឹងវិទ្យាសាស្ត្រជួយឱ្យយើងយល់ដឹងពីអ្វីខ្លះនៅក្នុងសកលលោក?",
      options: ["ច្បាប់រូបវិទ្យា", "ប្រតិកម្មគីមី", "ជីវិតសត្វលោក", "គ្រប់ចម្លើយខាងលើ"],
      correctIndex: 3,
      explanation: "វិទ្យាសាស្ត្រសិក្សាគ្រប់វិស័យទាំងអស់រួមមាន រូបវិទ្យា គីមីវិទ្យា គណិតវិទ្យា និងជីវវិទ្យា ដើម្បីយល់ពីច្បាប់ធម្មជាតិ។"
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files in production mode from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Science Simulator & AI Tutor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
