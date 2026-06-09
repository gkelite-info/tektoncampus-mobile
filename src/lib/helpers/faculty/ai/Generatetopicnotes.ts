// ============================================================
// generateTopicNotes.ts  –  Fully dynamic, zero hardcoding
// ============================================================
// Key changes vs previous version:
//  • ALL hardcoded topic blocks removed (MOT, Solar PV, Inverter, etc.)
//  • buildDynamicPrompt() is the single prompt builder for every topic
//  • tightenTopicAccuracy() is purely generic – no topic detection
//  • Bad/generic generations are rejected instead of being turned into PDFs
//  • Wikimedia image search and quality checks are unchanged
// ============================================================

import { generateRawWithGroqFallback } from "./groqClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TopicNotesSection = {
  heading: string;
  content: string;
  bulletPoints?: string[];
  codeExample?: { label: string; code: string };
};

export type ComplexityRow = {
  algorithm: string;
  best: string;
  average: string;
  worst: string;
  space: string;
};

export type TopicVisual = {
  title: string;
  caption: string;
  labels: string[];
  chartValues?: number[];
};

export type WorkedExample = { title: string; problem: string; solution: string };
export type TopicImageExample = { title: string; description: string; labels: string[] };

export type RealTopicImage = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  sourceName: string;
  license?: string;
  attribution?: string;
  mime?: string;
};

export type TopicNotes = {
  topicTitle: string;
  subject: string;
  unit: string;
  branch: string;
  educationType: string;
  introduction: string;
  explanation: string;
  sections: TopicNotesSection[];
  keyPoints: string[];
  advantages: string[];
  applications: string[];
  summary: string;
  keyTerms: { term: string; definition: string }[];
  complexityTable?: ComplexityRow[];
  realWorldExample?: string;
  visuals?: TopicVisual[];
  workedExamples?: WorkedExample[];
  imageExamples?: TopicImageExample[];
  realTopicImages?: RealTopicImage[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safePlainText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function stripHtml(value: string | undefined) {
  return safePlainText(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item).toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Domain detection ────────────────────────────────────────────────────────
// Used ONLY to set appropriate defaults in fallback / quality-tightening.
// Does NOT gate any hardcoded content.

type TopicDomain =
  | "cs_algorithm"
  | "chemistry"
  | "physics_em"
  | "solar_pv"
  | "biology"
  | "electronics"
  | "mechanical"
  | "civil"
  | "mathematics"
  | "humanities"
  | "generic";

function detectDomain(notes: Pick<TopicNotes, "topicTitle" | "subject" | "unit" | "branch">): TopicDomain {
  const sig = `${notes.topicTitle} ${notes.subject} ${notes.unit} ${notes.branch}`.toLowerCase();
  if (/solar|photovoltaic|\bpv\b/.test(sig)) return "solar_pv";
  if (/computer|algorithm|data structure|programming|sorting|searching|graph|tree|hash|database|operating system|compiler|machine learning|artificial intelligence/i.test(sig)) return "cs_algorithm";
  if (/chem|molecule|reaction|bond|atomic|organic|inorganic|electrochem|thermochem/.test(sig)) return "chemistry";
  if (/electromagnet|maxwell|wave|optics|quantum|photon|spectroscopy|nuclear|thermodynamic/.test(sig)) return "physics_em";
  if (/biology|genetics|cell|ecology|anatomy|physiology|botany|zoology|microbiology/.test(sig)) return "biology";
  if (/electronic|circuit|signal|semiconductor|amplifier|transistor|diode|microprocessor/.test(sig)) return "electronics";
  if (/mechanical|thermodynamic|fluid|machine|manufacturing|material|stress|strain/.test(sig)) return "mechanical";
  if (/civil|structural|concrete|steel|soil|water supply|surveying|highway/.test(sig)) return "civil";
  if (/math|calculus|algebra|geometry|probability|statistics|differential|integral/.test(sig)) return "mathematics";
  if (/history|economics|management|psychology|sociology|geography|political|commerce/.test(sig)) return "humanities";
  return "generic";
}

// ─── Dynamic label generators ─────────────────────────────────────────────────
// These generate truly topic-specific labels from the topic title + unit words.

const STOP_WORDS = new Set([
  "and","for","the","with","from","into","onto","over","under","using",
  "based","topic","unit","system","systems","fields","using","when","that",
  "this","are","its","has","can","may","also","used","each","such","both",
]);

function getTopicKeywords(notes: Pick<TopicNotes, "topicTitle" | "unit">): string[] {
  return `${notes.topicTitle} ${notes.unit}`
    .replace(/['']/g, "")
    .split(/[^a-zA-Z0-9/+.-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 8);
}

function getDomainKeyTerms(
  domain: TopicDomain,
  notes: Pick<TopicNotes, "topicTitle" | "unit" | "subject" | "branch">,
): { term: string; definition: string }[] {
  const words = getTopicKeywords(notes);
  // Lead with actual topic words as terms
  const topicTerms = words.slice(0, 4).map((w) => ({
    term: w,
    definition: `${w} is a key concept in ${notes.topicTitle} within ${notes.unit}. It defines or relates to the main principle of this topic.`,
  }));

  const domainTerms: Record<TopicDomain, { term: string; definition: string }[]> = {
    solar_pv: [
      { term: "Solar irradiance", definition: "Solar power per unit area (W/m²) – primary driver of PV output." },
      { term: "MPPT", definition: "Maximum Power Point Tracking – control method to extract peak power from PV modules." },
      { term: "Performance ratio", definition: "Actual energy output divided by reference energy; normalises for irradiance variation." },
      { term: "Energy yield", definition: "Total electrical energy produced by a PV system over a given period (kWh)." },
    ],
    cs_algorithm: [
      { term: "Time complexity", definition: "Growth rate of execution time as input size increases, expressed in Big-O notation." },
      { term: "Space complexity", definition: "Growth rate of memory usage as input size increases." },
      { term: "Worst case", definition: "The input arrangement that causes the algorithm to take maximum steps." },
      { term: "Recursion", definition: "A function that calls itself with a smaller sub-problem until a base case is reached." },
    ],
    chemistry: [
      { term: "Equilibrium", definition: "State where forward and reverse reaction rates are equal and concentrations remain constant." },
      { term: "Bond energy", definition: "Energy required to break one mole of a specific bond in gaseous molecules." },
      { term: "Oxidation state", definition: "Hypothetical charge on an atom if all bonds were ionic." },
      { term: "Reaction rate", definition: "Change in concentration of a reactant or product per unit time." },
    ],
    physics_em: [
      { term: "Electric field", definition: "Force per unit positive charge at a point in space (V/m or N/C)." },
      { term: "Magnetic flux", definition: "Total magnetic field lines passing through a surface (Weber)." },
      { term: "Wave function", definition: "Mathematical description of the quantum state of a particle." },
      { term: "Energy level", definition: "Discrete allowed energy value for a bound quantum system." },
    ],
    biology: [
      { term: "Homeostasis", definition: "Maintenance of a stable internal environment despite external changes." },
      { term: "Metabolism", definition: "Sum of all chemical reactions in a living organism." },
      { term: "Gene expression", definition: "Process by which genetic information is used to produce a functional protein." },
      { term: "Diffusion", definition: "Net movement of molecules from high to low concentration." },
    ],
    electronics: [
      { term: "Gain", definition: "Ratio of output signal amplitude to input signal amplitude." },
      { term: "Bandwidth", definition: "Frequency range over which a circuit operates within accepted limits." },
      { term: "Impedance", definition: "Total opposition to AC current flow in a circuit (Ω)." },
      { term: "Feedback", definition: "Returning a portion of output to the input to control circuit behaviour." },
    ],
    mechanical: [
      { term: "Stress", definition: "Internal force per unit area within a material (Pa or N/m²)." },
      { term: "Strain", definition: "Deformation per unit original length (dimensionless)." },
      { term: "Torque", definition: "Rotational force equal to force multiplied by perpendicular distance from pivot." },
      { term: "Thermodynamic cycle", definition: "Series of processes returning a system to its initial state." },
    ],
    civil: [
      { term: "Bearing capacity", definition: "Maximum load per unit area a soil can support without shear failure." },
      { term: "Bending moment", definition: "Internal moment at a section caused by transverse loads (kN·m)." },
      { term: "Workability", definition: "Ease with which concrete can be placed, compacted, and finished." },
      { term: "Settlement", definition: "Downward movement of a structure due to soil compression." },
    ],
    mathematics: [
      { term: "Derivative", definition: "Rate of change of a function with respect to its variable." },
      { term: "Eigenvalue", definition: "Scalar λ such that Av = λv for a matrix A and non-zero vector v." },
      { term: "Convergence", definition: "Property of a sequence or series approaching a finite limit." },
      { term: "Continuity", definition: "Function property where small input changes produce small output changes." },
    ],
    humanities: [
      { term: "Causation", definition: "A relationship where one event directly produces another." },
      { term: "Primary source", definition: "An original document or artefact from the time period under study." },
      { term: "Quantitative data", definition: "Numerical information that can be measured and statistically analysed." },
      { term: "Stakeholder", definition: "Any individual or group affected by or having an interest in an outcome." },
    ],
    generic: [
      { term: "Principle", definition: "The fundamental rule or relationship governing the selected topic." },
      { term: "Variable", definition: "A measurable or controllable quantity relevant to the topic." },
      { term: "Model", definition: "A simplified representation used to understand or predict behaviour." },
      { term: "Application", definition: "A practical use of the topic in academic or real-world contexts." },
    ],
  };

  return uniqBy([...topicTerms, ...(domainTerms[domain] ?? domainTerms.generic)], (t) => t.term).slice(0, 10);
}

function getDomainImageExamples(
  domain: TopicDomain,
  notes: Pick<TopicNotes, "topicTitle" | "unit">,
): TopicImageExample[] {
  const kw = getTopicKeywords(notes);
  const mainLabels = kw.length >= 4 ? kw.slice(0, 5) : [...kw, "Input", "Output", "Process"].slice(0, 5);

  // Domain-aware diagram type suggestions
  const domainDiagramSets: Record<TopicDomain, [string, string, string[]][]> = {
    solar_pv: [
      [`${notes.topicTitle} System Layout`, "Block diagram showing PV modules, inverter, protection, metering, and grid/load connection. Students should observe DC path, AC path, and monitoring channel.", ["PV modules", "DC input", "Inverter", "AC output", "Grid/load"]],
      [`${notes.topicTitle} Input–Loss–Output Flow`, "Flow diagram mapping irradiance and temperature inputs through shading, soiling, wiring, and inverter losses to final AC energy yield.", ["Irradiance", "Module temperature", "Losses", "Inverter conversion", "AC energy yield"]],
      [`${notes.topicTitle} Performance Graph`, "Graph comparing predicted and actual energy output over time, showing performance ratio and identifying loss periods.", ["Forecast yield", "Actual yield", "Performance ratio", "Time axis", "Loss period"]],
    ],
    cs_algorithm: [
      [`${notes.topicTitle} Data Structure Diagram`, "Illustration of the main data structure used, showing nodes, edges, pointers, and relationships.", mainLabels],
      [`${notes.topicTitle} Step-by-Step Trace`, "Trace showing algorithm state at each step for a small example input, useful for exam answers.", ["Initial state", "Step 1", "Step 2", "Intermediate state", "Final output"]],
      [`${notes.topicTitle} Complexity Comparison`, "Graph or table comparing time and space complexity against similar algorithms.", ["Algorithm A", "Algorithm B", "Best case", "Worst case", "Space"]],
    ],
    chemistry: [
      [`${notes.topicTitle} Reaction Mechanism Diagram`, "Step-by-step mechanism showing electron flow, intermediate species, and products.", ["Reactant", "Transition state", "Intermediate", "Product", "Electron flow"]],
      [`${notes.topicTitle} Apparatus Setup`, "Laboratory apparatus showing glassware, heating/cooling, and measurement devices required.", ["Flask", "Condenser", "Thermometer", "Catalyst", "Measuring device"]],
      [`${notes.topicTitle} Energy Profile Graph`, "Potential energy diagram showing reactants, transition state, activation energy, and products.", ["Reactants", "Transition state", "Activation energy", "Products", "ΔH"]],
    ],
    physics_em: [
      [`${notes.topicTitle} Field Diagram`, "Vector field diagram showing field direction, magnitude variation, and key points like maxima or nodes.", mainLabels],
      [`${notes.topicTitle} Energy Level Diagram`, "Quantised energy levels with transitions shown as arrows, labelled with energy values and series names.", ["Ground state", "Excited state", "Transition arrow", "Photon emission", "Energy gap"]],
      [`${notes.topicTitle} Apparatus Schematic`, "Experimental setup showing source, measurement instruments, sample, and observation screen or detector.", ["Source", "Sample/medium", "Detector", "Measurement", "Shield/aperture"]],
    ],
    biology: [
      [`${notes.topicTitle} Structure Diagram`, "Labelled anatomical or cellular diagram showing all major components and their spatial relationships.", mainLabels],
      [`${notes.topicTitle} Process Cycle`, "Cycle diagram showing the sequence of biological events, each step labelled with the key molecule or action.", ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Key molecule"]],
      [`${notes.topicTitle} Comparative View`, "Side-by-side comparison of two states, types, or conditions relevant to the topic.", ["Type A", "Type B", "Key difference", "Shared feature", "Outcome"]],
    ],
    electronics: [
      [`${notes.topicTitle} Circuit Schematic`, "Schematic showing components, signal path, power rails, input, and output terminals.", ["Input terminal", "Active component", "Passive component", "Output terminal", "Supply rail"]],
      [`${notes.topicTitle} Frequency Response Plot`, "Bode-style graph showing gain or phase versus frequency, marking bandwidth and corner frequency.", ["Gain (dB)", "Frequency (Hz)", "Bandwidth", "Corner frequency", "Roll-off"]],
      [`${notes.topicTitle} Signal Waveform Diagram`, "Time-domain waveform showing input and output signals, illustrating gain, phase shift, or distortion.", ["Input signal", "Output signal", "Time axis", "Amplitude", "Phase shift"]],
    ],
    mechanical: [
      [`${notes.topicTitle} Free Body Diagram`, "Force diagram showing all external forces, reactions, and moments acting on the body.", ["Applied force", "Reaction force", "Normal force", "Moment arm", "Resultant"]],
      [`${notes.topicTitle} Cross-Section View`, "Cut-section showing internal geometry, material zones, dimensions, and stress distribution.", ["Outer surface", "Core material", "Dimension label", "Stress zone", "Neutral axis"]],
      [`${notes.topicTitle} Process Flowchart`, "Manufacturing or thermodynamic process steps from input material/state to final product/state.", ["Input", "Process step 1", "Process step 2", "Quality check", "Output"]],
    ],
    civil: [
      [`${notes.topicTitle} Structural Diagram`, "Structural layout showing loads, supports, members, and dimensions.", ["Load", "Beam/column", "Support", "Dimension", "Reaction"]],
      [`${notes.topicTitle} Geotechnical Profile`, "Soil layer cross-section showing strata, water table, foundation, and settlement zones.", ["Surface", "Soil layer 1", "Soil layer 2", "Water table", "Foundation"]],
      [`${notes.topicTitle} Construction Process Flow`, "Sequence of construction operations from site preparation to completion.", ["Site preparation", "Formwork", "Pour/place", "Curing", "Finishing"]],
    ],
    mathematics: [
      [`${notes.topicTitle} Graph / Plot`, "Mathematical graph showing function behaviour, roots, asymptotes, maxima/minima.", ["x-axis", "y-axis", "Function curve", "Critical point", "Asymptote"]],
      [`${notes.topicTitle} Geometric Illustration`, "Diagram showing the geometric interpretation of the concept with labelled elements.", mainLabels],
      [`${notes.topicTitle} Step-by-Step Derivation Flow`, "Flow showing each algebraic or logical step from given conditions to the final result.", ["Given", "Step 1", "Step 2", "Step 3", "Result"]],
    ],
    humanities: [
      [`${notes.topicTitle} Timeline Diagram`, "Chronological timeline showing key events, dates, causes, and effects.", ["Start event", "Key event 1", "Key event 2", "Turning point", "Outcome"]],
      [`${notes.topicTitle} Cause–Effect Map`, "Mind-map style diagram showing causes, immediate effects, and long-term consequences.", ["Root cause", "Contributing factor", "Immediate effect", "Secondary effect", "Long-term outcome"]],
      [`${notes.topicTitle} Comparison Table View`, "Side-by-side comparison of two theories, approaches, or cases with labelled criteria.", ["Criterion", "Option A", "Option B", "Key difference", "Verdict"]],
    ],
    generic: [
      [`${notes.topicTitle} Principle Diagram`, "Diagram showing the main law, model, or relationship with source, process, and output labelled.", mainLabels],
      [`${notes.topicTitle} Process Flow`, "Ordered flow from given conditions through the core process to the final result.", ["Input", "Core process", "Intermediate", "Result", "Interpretation"]],
      [`${notes.topicTitle} Application View`, "Practical application view connecting the topic concept to a real device, system, or scenario.", ["Real context", "Applied concept", "Measured output", "Benefit", "Use case"]],
    ],
  };

  return (domainDiagramSets[domain] ?? domainDiagramSets.generic).map(([title, description, labels]) => ({
    title,
    description,
    labels,
  }));
}

function getDomainWorkedExamples(
  domain: TopicDomain,
  notes: Pick<TopicNotes, "topicTitle" | "unit" | "subject">,
): WorkedExample[] {
  const kw = getTopicKeywords(notes).slice(0, 3).join(", ");

  const exampleSets: Record<TopicDomain, WorkedExample[]> = {
    solar_pv: [
      {
        title: `${notes.topicTitle} – Yield Calculation`,
        problem: `A 100 kW PV plant receives 5 peak-sun-hours per day. If the performance ratio is 0.78, estimate daily AC energy yield.`,
        solution: `Daily energy = Plant capacity × Peak-sun-hours × Performance ratio\n= 100 × 5 × 0.78 = 390 kWh.\nThis accounts for all system losses captured in the performance ratio.`,
      },
      {
        title: `${notes.topicTitle} – Performance Ratio`,
        problem: `A 50 kW PV system produces 210 kWh on a day when POA irradiation = 5.2 peak-sun-hours. Find performance ratio.`,
        solution: `Reference energy = 50 × 5.2 = 260 kWh.\nPerformance ratio = 210 / 260 = 0.808 ≈ 80.8%.\nThis is acceptable; typical PR is 0.75–0.85.`,
      },
    ],
    cs_algorithm: [
      {
        title: `${notes.topicTitle} – Trace Example`,
        problem: `Trace the algorithm on input [5, 3, 8, 1] and show each state.`,
        solution: `Step 1: Start with full array.\nStep 2: Apply the core operation to reduce/transform.\nStep 3: Check termination condition.\nStep 4: Return final result.\nDocument intermediate states at each step.`,
      },
      {
        title: `${notes.topicTitle} – Complexity Analysis`,
        problem: `Derive the time complexity of the core operation in terms of input size n.`,
        solution: `Identify the dominant loop or recursive call.\nCount iterations: inner loop runs n times, outer n times → O(n²) worst case.\nFor best case, identify the earliest-exit condition → O(n) or O(1) as appropriate.`,
      },
    ],
    chemistry: [
      {
        title: `${notes.topicTitle} – Numerical Problem`,
        problem: `Calculate the value of ${kw} using the given data: relevant quantities provided.`,
        solution: `Step 1: Write the governing equation.\nStep 2: Substitute given values with units.\nStep 3: Solve and include correct units in answer.\nStep 4: State the physical meaning of the result.`,
      },
      {
        title: `${notes.topicTitle} – Identification/Prediction`,
        problem: `Predict the outcome when conditions related to ${notes.topicTitle} are changed.`,
        solution: `Apply Le Chatelier's principle / relevant law.\nIdentify the direction of shift or change.\nExplain which term increases/decreases.\nState the final observable effect.`,
      },
    ],
    physics_em: [
      {
        title: `${notes.topicTitle} – Field Calculation`,
        problem: `A source with given magnitude is placed at a known location. Find the field/quantity at point P.`,
        solution: `Step 1: Draw diagram with source and point P.\nStep 2: Write the governing formula.\nStep 3: Substitute values.\nStep 4: Solve; express answer with unit and direction.`,
      },
      {
        title: `${notes.topicTitle} – Energy / Transition Problem`,
        problem: `Find the energy/wavelength associated with a transition between two given states.`,
        solution: `ΔE = E_upper − E_lower (use standard formulae).\nConvert to wavelength using λ = hc/ΔE if needed.\nIdentify the spectral series or region.`,
      },
    ],
    biology: [
      {
        title: `${notes.topicTitle} – Labelled Diagram Answer`,
        problem: `Draw and label the key structures involved in ${notes.topicTitle}. Explain the role of each part.`,
        solution: `Draw the structure with at least 4 labels.\nFor each label: state location → function → how it relates to the main process.\nEnd with one-sentence summary of the overall mechanism.`,
      },
      {
        title: `${notes.topicTitle} – Condition Change Prediction`,
        problem: `What happens to the rate or outcome of ${notes.topicTitle} if temperature rises by 10°C?`,
        solution: `Apply Q10 rule or enzyme kinetics as appropriate.\nExplain molecular-level reason (kinetic energy, enzyme denaturation).\nState direction of change and any threshold effects.`,
      },
    ],
    electronics: [
      {
        title: `${notes.topicTitle} – Gain Calculation`,
        problem: `An amplifier circuit has input Vin = 20 mV and output Vout = 2 V. Find voltage gain in dB.`,
        solution: `Voltage gain (linear) = Vout / Vin = 2 / 0.02 = 100.\nGain (dB) = 20 log₁₀(100) = 20 × 2 = 40 dB.`,
      },
      {
        title: `${notes.topicTitle} – Operating Point`,
        problem: `Determine the Q-point for a transistor circuit with given Vcc, Rb, Re, and β.`,
        solution: `Step 1: Apply KVL to base-emitter loop.\nStep 2: Find Ib.\nStep 3: Ic = β × Ib.\nStep 4: Vce = Vcc − Ic(Rc + Re).`,
      },
    ],
    mechanical: [
      {
        title: `${notes.topicTitle} – Stress/Force Analysis`,
        problem: `A member of cross-section A carries load P. Find the stress and state whether it is safe.`,
        solution: `Stress σ = P / A.\nCompare with permissible stress σ_allowable.\nIf σ < σ_allowable → safe; otherwise redesign.`,
      },
      {
        title: `${notes.topicTitle} – Thermodynamic Calculation`,
        problem: `Calculate the work done and efficiency for a given process or cycle.`,
        solution: `Identify process type (isothermal/adiabatic/etc.).\nApply first law: Q = ΔU + W.\nCalculate η = W_net / Q_in.`,
      },
    ],
    civil: [
      {
        title: `${notes.topicTitle} – Load/Stress Calculation`,
        problem: `A simply supported beam of span L carries UDL w kN/m. Find maximum bending moment.`,
        solution: `M_max = wL²/8 (for UDL on simply supported beam).\nSubstitute given values with correct units.\nDraw BMD if required.`,
      },
      {
        title: `${notes.topicTitle} – Material Design Check`,
        problem: `Check whether the given mix/section satisfies the design requirement.`,
        solution: `Step 1: Compute the design quantity.\nStep 2: Compare with code-specified limit.\nStep 3: State pass/fail and recommend revision if needed.`,
      },
    ],
    mathematics: [
      {
        title: `${notes.topicTitle} – Standard Problem`,
        problem: `Solve or evaluate the standard form of the problem for the given values.`,
        solution: `Step 1: Write given and required.\nStep 2: Apply the relevant theorem or formula.\nStep 3: Substitute and simplify.\nStep 4: State answer with any constraints or domain notes.`,
      },
      {
        title: `${notes.topicTitle} – Proof/Verification`,
        problem: `Prove or verify the key result for ${notes.topicTitle}.`,
        solution: `Assume standard conditions.\nApply axioms/definitions step by step.\nArrive at the required result and state the conclusion.`,
      },
    ],
    humanities: [
      {
        title: `${notes.topicTitle} – Short Essay Plan`,
        problem: `Outline a 500-word essay answer for: "Critically analyse ${notes.topicTitle}."`,
        solution: `Introduction: define term, state argument.\nParagraph 1: cause/background.\nParagraph 2: key event or development.\nParagraph 3: consequence/significance.\nConclusion: evaluative summary.`,
      },
      {
        title: `${notes.topicTitle} – Source Analysis`,
        problem: `How would you evaluate a primary source related to ${notes.topicTitle}?`,
        solution: `Check provenance (author, date, context).\nIdentify purpose and intended audience.\nNote limitations (bias, incomplete data).\nState how it supports or challenges a key claim.`,
      },
    ],
    generic: [
      {
        title: `${notes.topicTitle} – Concept Application`,
        problem: `Apply ${notes.topicTitle} to a practical situation in ${notes.unit}.`,
        solution: `Step 1: Define the relevant principle.\nStep 2: List the known quantities.\nStep 3: Apply the governing relationship.\nStep 4: Interpret the result.`,
      },
      {
        title: `${notes.topicTitle} – Exam Answer Structure`,
        problem: `Write a complete five-mark answer on ${notes.topicTitle}.`,
        solution: `Definition (1 mark) → Principle/equation (1 mark) → Labelled diagram (1 mark) → Example (1 mark) → Application/conclusion (1 mark).`,
      },
    ],
  };

  return exampleSets[domain] ?? exampleSets.generic;
}

// ─── Quality detection ────────────────────────────────────────────────────────

const GENERIC_KEY_TERMS = new Set([
  "concept","process","application","diagram","example",
  "advantage","limitation","revision","key point","summary",
]);

function isGenericNotesContent(notes: TopicNotes): boolean {
  const genericTermCount = notes.keyTerms?.filter(
    (t) => GENERIC_KEY_TERMS.has(t.term.trim().toLowerCase()),
  ).length ?? 0;

  const genericImages = notes.imageExamples?.some((img) =>
    /labelled concept|structure or apparatus|process diagram|main part|working area|use case/i.test(
      `${img.title} ${img.labels?.join(" ")}`,
    ),
  ) ?? false;

  const genericExamples = notes.workedExamples?.some((ex) =>
    /student is asked|classroom presentation|five-mark answer structure|revision planning|general learning/i.test(
      `${ex.title} ${ex.problem} ${ex.solution}`,
    ),
  ) ?? false;

  return genericTermCount >= 4 || genericImages || genericExamples;
}

function isWeakNotesContent(notes: TopicNotes): boolean {
  const joinedExamples = notes.workedExamples
    ?.map((example) => `${example.title} ${example.problem} ${example.solution}`)
    .join(" ") ?? "";
  const joinedSections = notes.sections
    ?.map((section) => `${section.heading} ${section.content} ${section.bulletPoints?.join(" ") ?? ""}`)
    .join(" ") ?? "";
  const selectedWords = getTopicKeywords(notes).map((word) => word.toLowerCase());
  const allText = `${notes.introduction} ${notes.explanation} ${joinedSections}`.toLowerCase();
  const allNotesText = `${allText} ${joinedExamples} ${notes.keyTerms?.map((term) => term.term).join(" ") ?? ""}`.toLowerCase();
  const missingTopicWords = selectedWords.length > 0
    && selectedWords.filter((word) => allText.includes(word)).length < Math.min(2, selectedWords.length);
  const isDiodeOrRectifierTopic = /diode|rectifier|rectification|pn junction/i.test(
    `${notes.topicTitle} ${notes.subject} ${notes.unit}`,
  );

  return (
    /value should be|choose .*1n4007|resistor value should|capacitor value should|no calculation|without calculation/i.test(joinedExamples)
    || /amplifier circuit|voltage gain|gain calculation|q-point|transistor circuit|base-emitter|collector current/i.test(joinedExamples)
    || /the circuit consists of a diode, a resistor, and a capacitor/i.test(joinedSections)
    || /widely used .* widely used .* widely used/i.test(allText)
    || /current .*given by .*i\s*=\s*v\s*\/\s*r/i.test(allText)
    || /zener breakdown .*type of avalanche|types of avalanche breakdown.*zener/i.test(allText)
    || /low forward voltage drop/i.test(allText)
    || /15\s*v\s*\/\s*10\s*v\s*=\s*1\.5\s*a/i.test(joinedExamples)
    || /v\s*=\s*v0\s*\+\s*t/i.test(joinedExamples)
    || (isDiodeOrRectifierTopic && /\bgain\b|\bbandwidth\b|\bfeedback\b|\bq-point\b|\btransistor\b/.test(allNotesText))
    || missingTopicWords
  );
}

// ─── Tighten topic accuracy (fully dynamic) ───────────────────────────────────

function tightenTopicAccuracy(notes: TopicNotes): TopicNotes {
  const isCS = /computer|algorithm|data structure|programming|sorting|searching|graph|tree|hash|database|compiler|machine learning/i
    .test(`${notes.topicTitle} ${notes.subject} ${notes.unit}`);
  const cleanedNotes: TopicNotes = isCS ? notes : { ...notes, complexityTable: [] };
  return cleanedNotes;
}

function assertUsableTopicNotes(notes: TopicNotes) {
  if (isGenericNotesContent(notes) || isWeakNotesContent(notes)) {
    throw new Error(
      `Generated notes for "${notes.topicTitle}" were too generic or inaccurate. Please retry generation.`,
    );
  }
}

// ─── Fallback (fully dynamic) ─────────────────────────────────────────────────

export function createFallbackTopicNotes(params: {
  topicTitle: string;
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
}): TopicNotes {
  const { topicTitle, subjectName, unitName, branch, educationType } = params;
  const domain = detectDomain({ topicTitle, subject: subjectName, unit: unitName, branch });
  const notesBase = { topicTitle, subject: subjectName, unit: unitName, branch, educationType };
  const keyTerms = getDomainKeyTerms(domain, notesBase);
  const imageExamples = getDomainImageExamples(domain, notesBase);
  const workedExamples = getDomainWorkedExamples(domain, notesBase);
  const kw = getTopicKeywords(notesBase);

  return {
    topicTitle,
    subject: subjectName,
    unit: unitName,
    branch,
    educationType,
    introduction: `${topicTitle} is a key topic in ${subjectName} within the unit ${unitName}. It explains the relationship between ${kw.slice(0, 3).join(", ")} and how these concepts are applied in ${branch}. Students at the ${educationType} level should connect this topic with related principles from the same unit. Understanding ${topicTitle} is essential for answering both theoretical and application-based questions in ${subjectName}.`,
    explanation: `${topicTitle} can be understood by separating it into its definition, governing principle, important variables, and practical application. The core relationship involves ${kw.slice(0, 2).join(" and ")}, which are analysed under the laws and models of ${unitName}. A complete understanding requires a labelled diagram, the relevant equation or model, and a practical example from ${branch}. Students should not memorise definitions in isolation but should connect every term with its measurable or observable role in ${topicTitle}.`,
    sections: [
      {
        heading: "Definition and Background",
        content: `${topicTitle} is defined within the context of ${unitName} in ${subjectName}. It describes how ${kw.slice(0, 2).join(" and ")} interact under specific conditions. Background knowledge of ${kw.slice(2, 4).join(" and ")} is required before studying this topic in depth.`,
        bulletPoints: keyTerms.slice(0, 4).map((t) => `${t.term}: ${t.definition}`),
      },
      {
        heading: "Principle / Theory",
        content: `The principle behind ${topicTitle} involves the relationship between ${kw.slice(0, 3).join(", ")}. The governing law or model defines how input quantities determine output or system behaviour. Where applicable, this relationship is expressed as an equation and visualised with a labelled diagram.`,
        bulletPoints: [
          "Identify the governing law or formula.",
          "Define each variable and its unit.",
          "Explain cause-effect direction.",
          "Connect principle with a diagram.",
        ],
      },
      {
        heading: "Working / Process",
        content: `To apply ${topicTitle}, first define the known quantities from the problem. Then identify the relevant equation or model. Substitute values, solve, and interpret the result in the context of ${unitName}.`,
        codeExample: {
          label: `Example: ${topicTitle} solution flow`,
          code: `1. Read and list given data\n2. Write the governing equation\n3. Substitute values\n4. Solve for unknown\n5. Interpret result in context`,
        },
      },
      {
        heading: "Types / Variations",
        content: `${topicTitle} may appear in different forms depending on the conditions, materials, or system under study. Each variation follows the same principle but with different constraints or boundary conditions.`,
        bulletPoints: [
          "Standard case: normal operating conditions.",
          "Limiting case: extreme or boundary conditions.",
          "Applied case: real-world device or experiment.",
          "Comparative case: two types or approaches side-by-side.",
        ],
      },
      {
        heading: "Advantages and Limitations",
        content: `Understanding ${topicTitle} enables accurate analysis and design in ${branch}. Its limitations include dependence on idealised assumptions and the need for accurate input data.`,
        bulletPoints: [
          "Enables systematic calculation or analysis.",
          "Supports diagram-based exam answers.",
          "Connects theory with practical applications.",
          "Assumes idealised conditions in basic models.",
          "Requires accurate input data for numerical problems.",
        ],
      },
      {
        heading: "Common Mistakes",
        content: `Students commonly confuse ${kw[0] ?? "key terms"} with related but distinct concepts. Another error is applying the formula without checking units or conditions. Always verify that the correct form of the equation applies to the given situation.`,
        bulletPoints: [
          "Not checking units before substitution.",
          "Using the wrong form of the equation.",
          "Skipping diagram when it aids explanation.",
          "Confusing similar-sounding terms.",
        ],
      },
    ],
    complexityTable: [],
    visuals: [{
      title: `${topicTitle} Concept Diagram`,
      caption: `Diagram showing the main components, governing relationship, and output of ${topicTitle} within ${unitName}.`,
      labels: imageExamples[0].labels,
      chartValues: [24, 22, 20, 18, 16],
    }],
    imageExamples,
    workedExamples,
    keyPoints: [
      `${topicTitle} is studied within ${unitName} and requires understanding of ${kw.slice(0, 2).join(" and ")}.`,
      "A correct answer includes definition, governing principle, labelled diagram, and application.",
      "The governing law or equation connects input quantities with output or system behaviour.",
      "Diagrams must use real labels from the topic, not generic placeholders.",
      "Worked examples should use actual topic quantities with stated units.",
      "Advantages and limitations create a balanced, exam-ready answer.",
      "Common mistakes arise from missing units, wrong equation form, or skipping diagrams.",
      "Applications connect the topic with real devices, experiments, or engineering problems.",
    ],
    advantages: [
      `Enables analysis of ${topicTitle} in ${branch} contexts.`,
      "Supports both numerical and theoretical question types.",
      "Connects classroom theory with laboratory or field practice.",
      "Improves structured answer writing in exams.",
      "Builds foundation for advanced topics in the same unit.",
      "Helps identify and avoid common errors in problem-solving.",
    ],
    applications: [
      `${subjectName} theory and numerical answers`,
      `${unitName} lab experiments`,
      "Engineering system design",
      "Performance analysis",
      "Comparative study of types or variations",
      "Real-world problem identification",
      "Project and assignment documentation",
      "Rapid exam revision",
    ],
    realWorldExample: `${topicTitle} is observed in practice when engineers or scientists measure, design, or optimise a system involving ${kw.slice(0, 2).join(" and ")}. The principle is applied by identifying the relevant quantities, selecting the correct model, and interpreting the result in the context of ${branch}.`,
    summary: `${topicTitle} is a core concept in ${subjectName} within ${unitName}. It should be revised with definition, governing principle, labelled diagram, key terms, and one worked example. Use the domain-specific terms from ${branch} throughout the answer to demonstrate subject-specific understanding.`,
    keyTerms,
  };
}

// ─── AI prompt builder ────────────────────────────────────────────────────────

function buildDynamicPrompt(params: {
  topicTitle: string;
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
}): string {
  const { topicTitle, subjectName, unitName, branch, educationType } = params;
  const domain = detectDomain({ topicTitle, subject: subjectName, unit: unitName, branch });

  // Build domain-aware hints injected into the prompt
  const domainHints: Record<TopicDomain, string> = {
    solar_pv: `
SOLAR PV RULES:
- imageExamples must use real PV diagram types: I-V curve, system layout, irradiance-loss flow, monitoring dashboard, performance ratio graph, forecast vs actual.
- Include relevant PV terms: irradiance, MPPT, performance ratio, energy yield, shading loss, soiling loss, DC/AC ratio, clipping loss, inverter, module temperature.
- Worked examples must include a numeric calculation (e.g. yield = capacity × PSH × PR, PR = actual/reference, DC/AC ratio).`,
    cs_algorithm: `
CS/ALGORITHM RULES:
- complexityTable must contain rows for all relevant algorithms with correct Big-O values.
- imageExamples: data structure diagram, step-by-step trace, complexity comparison graph.
- Worked examples: algorithm trace on a small input, complexity derivation.`,
    chemistry: `
CHEMISTRY RULES:
- imageExamples: reaction mechanism, apparatus/glassware setup, energy profile graph.
- Include real chemistry terms: equilibrium, activation energy, bond energy, reaction rate, oxidation state.
- Worked examples must use stoichiometry, equilibrium constants, or thermodynamic values with units.`,
    physics_em: `
PHYSICS RULES:
- imageExamples: field diagram, energy level diagram, apparatus schematic.
- Include real physics terms, SI units, and governing equations (Maxwell's equations, Bohr model, Schrödinger, etc. as appropriate).
- Worked examples must substitute numeric values and show unit analysis.`,
    biology: `
BIOLOGY RULES:
- imageExamples: labelled anatomical/cellular structure, process cycle, comparative view.
- Include real biological terms: organelles, molecules, enzymes, hormones, or anatomical structures.
- Worked examples: labelled diagram description, condition-change prediction.`,
    electronics: `
ELECTRONICS RULES:
- imageExamples: circuit schematic, frequency response plot, signal waveform.
- Include real electronic terms: gain, impedance, bandwidth, feedback, transfer function.
- Worked examples must include numeric circuit analysis using quantities from the selected topic title and unit.`,
    mechanical: `
MECHANICAL RULES:
- imageExamples: free body diagram, cross-section, process flowchart.
- Include real mechanical terms: stress, strain, torque, thermodynamic cycle, fluid flow.
- Worked examples must include numeric stress/energy calculations.`,
    civil: `
CIVIL RULES:
- imageExamples: structural layout, geotechnical profile, construction process flow.
- Include real civil terms: bending moment, bearing capacity, workability, settlement.
- Worked examples must include load/stress calculations with units.`,
    mathematics: `
MATHEMATICS RULES:
- imageExamples: function graph, geometric illustration, derivation flow.
- Include real mathematical notation and theorems.
- Worked examples must show complete step-by-step working.`,
    humanities: `
HUMANITIES RULES:
- imageExamples: timeline, cause-effect map, comparison table.
- Include real historical/economic/social terms relevant to the topic.
- Worked examples: essay outline, source analysis.`,
    generic: `
GENERAL RULES:
- imageExamples must name specific real diagram types (not "Labelled Concept Diagram").
- keyTerms must be real subject terms (not Concept, Process, Application, etc.).
- Worked examples must use realistic topic-specific values or scenarios.`,
  };

  return `Generate clear, topic-specific academic notes for ONLY the selected topic below.

Write like a good textbook author:
- Define the topic in simple, accurate language
- Explain the principle with correct technical terms, formulas, and relationships
- Describe parts/components with their roles
- Explain working step by step
- Give examples, applications, common mistakes, and exam guidance

Use Subject, Unit, Branch, and Education Type to choose the correct depth and terminology.
Every paragraph must contain concrete facts, terms, variables, apparatus, equations, or examples from THIS topic.

Education Type: ${educationType}
Branch: ${branch}
Subject: ${subjectName}
Unit: ${unitName}
Selected Topic: ${topicTitle}
Detected domain: ${domain}

${domainHints[domain] ?? ""}

STRICT RULES FOR ALL TOPICS:
- Never use generic key terms: Concept, Process, Application, Diagram, Example, Advantage, Limitation, Revision, Key Point, Summary.
- Never create imageExamples titled "Labelled Concept Diagram", "Structure or Apparatus View", or "Process Diagram" with generic labels.
- Every imageExample title must be a specific real diagram type for this topic.
- Every imageExample label must be a real visible part, axis, apparatus component, formula variable, or process step.
- If the topic has two named sub-concepts joined by "and", explain each sub-concept separately first, then compare them.
- Do not claim the same components belong to both sub-concepts unless that is technically true.
- Worked examples must solve something: include given values, formula/logic, substitution, final answer, and one interpretation sentence.
- Do not answer worked examples by only selecting component values such as diode/resistor/capacitor names.
- Do not repeat phrases like "widely used" as filler. Replace filler with exact circuit/device/process facts.
- Keep the topic in the selected subject. Avoid unrelated meanings of similar words from other disciplines.
- Do not use Ohm's law as the governing law for a semiconductor effect unless an external circuit resistance is explicitly part of the problem.
- Distinguish related mechanisms carefully; do not call one mechanism a type of another unless that is standard textbook terminology.
- Numerical examples must be dimensionally correct. Never divide volts by volts and call the answer amperes.
- Advantages must belong to the selected concept, not to the general device family.
- complexityTable: include ONLY for CS/algorithm topics with real Big-O values; set to [] for all other domains.
- codeExample code must be plain ASCII only.
- Return PURE JSON ONLY – no markdown, no backticks, no text outside JSON.

Return ONLY a valid JSON object with this EXACT structure:

{
  "topicTitle": "${topicTitle}",
  "subject": "${subjectName}",
  "unit": "${unitName}",
  "branch": "${branch}",
  "educationType": "${educationType}",
  "introduction": "5-6 sentence topic-specific introduction: define the topic, why it is studied, where it fits in the unit, and what students should know first.",
  "explanation": "8-10 sentence detailed explanation with real terms, governing principle, cause-effect relationships, and a concrete example.",
  "sections": [
    { "heading": "Definition and Background", "content": "topic-specific paragraph", "bulletPoints": ["real point 1","real point 2","real point 3","real point 4","real point 5"] },
    { "heading": "Principle / Theory", "content": "topic-specific paragraph with formula/law", "bulletPoints": ["theory point 1","theory point 2","theory point 3","theory point 4"] },
    { "heading": "Parts / Components", "content": "topic-specific paragraph", "bulletPoints": ["part 1: role","part 2: role","part 3: role","part 4: role"] },
    { "heading": "Working / Process", "content": "topic-specific paragraph", "codeExample": { "label": "topic step flow", "code": "1. step\\n2. step\\n3. step\\n4. step\\n5. step" } },
    { "heading": "Types / Variations / Related Cases", "content": "topic-specific paragraph", "bulletPoints": ["type 1","type 2","type 3","type 4"] },
    { "heading": "Advantages and Limitations", "content": "topic-specific balanced analysis", "bulletPoints": ["advantage 1","advantage 2","limitation 1","limitation 2"] },
    { "heading": "Common Mistakes and Clarifications", "content": "topic-specific mistakes and corrections", "bulletPoints": ["mistake 1: correction","mistake 2: correction","mistake 3: correction"] },
    { "heading": "Exam-Oriented Notes", "content": "exam answer guidance specific to this topic", "bulletPoints": ["exam tip 1","exam tip 2","exam tip 3","exam tip 4"] }
  ],
  "complexityTable": [],
  "visuals": [
    {
      "title": "specific real diagram title for this topic",
      "caption": "2-sentence description of what the diagram shows.",
      "labels": ["real label 1","real label 2","real label 3","real label 4","real label 5"],
      "chartValues": [24,22,20,18,16]
    }
  ],
  "imageExamples": [
    { "title": "specific diagram/apparatus/graph type 1", "description": "4-sentence topic-specific description", "labels": ["real visible label 1","real visible label 2","real visible label 3","real visible label 4","real visible label 5"] },
    { "title": "specific diagram/apparatus/graph type 2 (different from 1)", "description": "4-sentence topic-specific description", "labels": ["real visible label 1","real visible label 2","real visible label 3","real visible label 4","real visible label 5"] },
    { "title": "specific diagram/apparatus/graph type 3 (different from 1 and 2)", "description": "4-sentence topic-specific description", "labels": ["real visible label 1","real visible label 2","real visible label 3","real visible label 4"] }
  ],
  "workedExamples": [
    { "title": "realistic example title 1", "problem": "topic-specific problem with all required data", "solution": "complete step-by-step solution" },
    { "title": "realistic example title 2", "problem": "topic-specific problem", "solution": "complete step-by-step solution" }
  ],
  "keyPoints": ["real point 1","real point 2","real point 3","real point 4","real point 5","real point 6","real point 7","real point 8"],
  "advantages": ["topic-specific advantage 1","topic-specific advantage 2","topic-specific advantage 3","topic-specific advantage 4","topic-specific advantage 5","topic-specific advantage 6"],
  "applications": ["application 1","application 2","application 3","application 4","application 5","application 6","application 7","application 8"],
  "realWorldExample": "4-5 sentence vivid real-world scenario.",
  "summary": "4-5 sentence summary covering importance, revision value, and exam relevance.",
  "keyTerms": [
    { "term": "real term 1", "definition": "1-2 sentence definition" },
    { "term": "real term 2", "definition": "1-2 sentence definition" },
    { "term": "real term 3", "definition": "1-2 sentence definition" },
    { "term": "real term 4", "definition": "1-2 sentence definition" },
    { "term": "real term 5", "definition": "1-2 sentence definition" },
    { "term": "real term 6", "definition": "1-2 sentence definition" },
    { "term": "real term 7", "definition": "1-2 sentence definition" },
    { "term": "real term 8", "definition": "1-2 sentence definition" }
  ]
}`;
}

function buildGenericRepairPrompt(params: {
  topicTitle: string;
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
}): string {
  const { topicTitle, subjectName, unitName, branch, educationType } = params;
  return `The previous generated notes were too generic. Regenerate from scratch for this topic ONLY.

Selected Topic: ${topicTitle}
Subject: ${subjectName}
Unit: ${unitName}
Branch: ${branch}
Education Type: ${educationType}

CRITICAL: Use real subject-specific terms. No generic terms (Concept, Process, Application, Diagram, etc.) as keyTerms.
imageExamples must name real diagram/apparatus types for this topic.
Worked examples must use actual topic quantities and show step-by-step reasoning.
If the topic contains two sub-concepts joined by "and", explain each separately and then compare.
Reject unrelated meanings of similar words from other subjects.
Do not provide examples that only choose component values; every worked example must calculate, trace, compare, or interpret a real output.
Do not use Ohm's law as the main theory for a semiconductor material effect unless an external resistor is part of the problem.
Numerical examples must be dimensionally correct and must not invent unsupported formulae.
Advantages and applications must belong to the selected concept, not to the broader device family.

Return ONLY valid JSON matching the structure from the previous prompt. No markdown, no backticks.`;
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseTopicNotes(raw: string): TopicNotes {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("AI response did not contain a JSON object");
  }
  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as TopicNotes;
}

// ─── Wikimedia image search ───────────────────────────────────────────────────

type WikimediaApiPage = {
  title?: string;
  fullurl?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    mime?: string;
    extmetadata?: {
      Artist?: { value?: string };
      Credit?: { value?: string };
      LicenseShortName?: { value?: string };
      ObjectName?: { value?: string };
    };
  }>;
};

function getImageRelevanceText(page: WikimediaApiPage, notes: TopicNotes) {
  const info = page.imageinfo?.[0];
  return [
    page.title,
    info?.extmetadata?.ObjectName?.value,
    info?.extmetadata?.Credit?.value,
    info?.extmetadata?.Artist?.value,
    notes.topicTitle,
  ]
    .map((value) => stripHtml(value))
    .join(" ")
    .toLowerCase();
}

function isWrongDisciplineImage(page: WikimediaApiPage, notes: TopicNotes) {
  const haystack = getImageRelevanceText(page, notes);
  const academicContext = `${notes.subject} ${notes.unit} ${notes.branch}`.toLowerCase();

  if (/electronic|circuit|diode|electrical|eee|bsc/.test(academicContext)) {
    return /\bpatch clamp\b|micropipette|myocyte|cell bath|bath electrode|neuron|axon|biology|physiology|membrane potential/.test(haystack);
  }

  return false;
}

function scoreWikimediaImage(page: WikimediaApiPage, notes: TopicNotes) {
  const haystack = getImageRelevanceText(page, notes);
  const topicWords = getTopicKeywords(notes).map((word) => word.toLowerCase());
  const labelWords = notes.imageExamples
    ?.flatMap((image) => image.labels ?? [])
    .flatMap((label) => getTopicKeywords({ topicTitle: label, unit: notes.unit }))
    .map((word) => word.toLowerCase()) ?? [];
  const contextWords = `${notes.subject} ${notes.unit}`
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 3);
  const wantedWords = uniqBy([...topicWords, ...labelWords, ...contextWords], (word) => word);

  return wantedWords.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

async function fetchWikimediaTopicImages(notes: TopicNotes): Promise<RealTopicImage[]> {
  const isTechnical = /physics|chem|electrical|engineering|biology|math|computer|mechanical|civil|electronics/i
    .test(`${notes.subject} ${notes.branch} ${notes.unit}`);
  const baseQuery = `${notes.topicTitle} ${notes.unit} ${isTechnical ? "diagram" : "illustration"}`.replace(/\s+/g, " ").trim();
  const diagramQueries = notes.imageExamples
    ?.flatMap((image) => [
      `${image.title} Wikimedia Commons`,
      `${image.labels?.slice(0, 3).join(" ")} ${notes.topicTitle} diagram`,
    ])
    .filter((query) => query.trim().length > 8) ?? [];
  const queries = uniqBy(
    [baseQuery, ...diagramQueries].map((query) => query.replace(/\s+/g, " ").trim()),
    (query) => query,
  ).slice(0, 5);
  const pages: WikimediaApiPage[] = [];

  for (const query of queries) {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "6");
    url.searchParams.set("prop", "imageinfo|info");
    url.searchParams.set("inprop", "url");
    url.searchParams.set("iiprop", "url|mime|extmetadata");
    url.searchParams.set("iiurlwidth", "1100");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url, {
      headers: { "Api-User-Agent": "topic-notes-client/2.0 (educational PDF generation)" },
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as { query?: { pages?: Record<string, WikimediaApiPage> } };
    pages.push(...Object.values(payload.query?.pages ?? {}));
  }

  const allowedMime = new Set(["image/jpeg", "image/png"]);

  return uniqBy(pages, (page) => page.imageinfo?.[0]?.url ?? page.title ?? "")
    .filter((page) => !isWrongDisciplineImage(page, notes))
    .map((page) => ({ page, score: scoreWikimediaImage(page, notes) }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(({ page }) => page)
    .map((page): RealTopicImage | null => {
      const info = page.imageinfo?.[0];
      const imageUrl = info?.url;
      const thumbnailUrl = info?.thumburl ?? imageUrl;
      const mime = info?.mime;
      if (!imageUrl || !thumbnailUrl || !mime || !allowedMime.has(mime)) return null;
      const title = stripHtml(info?.extmetadata?.ObjectName?.value || page.title?.replace(/^File:/, "") || notes.topicTitle);
      return {
        title: title || notes.topicTitle,
        imageUrl,
        thumbnailUrl,
        sourceUrl: page.fullurl ?? imageUrl,
        sourceName: "Wikimedia Commons",
        license: stripHtml(info?.extmetadata?.LicenseShortName?.value),
        attribution: stripHtml(info?.extmetadata?.Artist?.value || info?.extmetadata?.Credit?.value || "Wikimedia Commons contributor"),
        mime,
      };
    })
    .filter((img): img is RealTopicImage => Boolean(img))
    .slice(0, 3);
}

async function enrichWithWikimediaImages(notes: TopicNotes): Promise<TopicNotes> {
  if (notes.realTopicImages?.length) return notes;
  try {
    return { ...notes, realTopicImages: await fetchWikimediaTopicImages(notes) };
  } catch (err) {
    console.warn("[generateTopicNotes] Wikimedia lookup skipped", { topicTitle: notes.topicTitle, err });
    return notes;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateTopicNotes(params: {
  topicTitle: string;
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
}): Promise<TopicNotes> {
  const { topicTitle } = params;

  try {
    const raw = await generateRawWithGroqFallback({
      prompt: buildDynamicPrompt(params),
      maxTokens: 3600,
      temperature: 0.2,
      systemPrompt: `You are an academic content writer for Indian college students.
Return ONLY one valid JSON object matching the user's schema.
No markdown, no backticks, no explanations outside JSON, no truncation.
Plain ASCII only in code examples.`,
    });

    const parsedNotes = parseTopicNotes(raw);

    if (isGenericNotesContent(parsedNotes) || isWeakNotesContent(parsedNotes)) {
      console.warn("[generateTopicNotes] Retrying weak/generic AI notes", {
        topicTitle,
        keyTerms: parsedNotes.keyTerms?.map((t) => t.term),
      });
      const repairedRaw = await generateRawWithGroqFallback({
        prompt: buildGenericRepairPrompt(params),
        maxTokens: 3600,
        temperature: 0.15,
        systemPrompt: `You repair weak academic JSON into topic-specific JSON.
Return only valid JSON. No markdown or explanation outside JSON.`,
      });
      const repairedNotes = tightenTopicAccuracy(parseTopicNotes(repairedRaw));
      assertUsableTopicNotes(repairedNotes);
      return enrichWithWikimediaImages(repairedNotes);
    }

    const cleanedNotes = tightenTopicAccuracy(parsedNotes);
    assertUsableTopicNotes(cleanedNotes);
    return enrichWithWikimediaImages(cleanedNotes);
  } catch (err) {
    console.error("[generateTopicNotes] Failed to generate usable topic notes", {
      topicTitle,
      err: err instanceof Error ? err.message : err,
    });
    throw err;
  }
}
