// Textiles Technology Years 7–10 Syllabus (2019), taught until 2027. Wording is NESA's
// (content points without their "for example" lists). Each point lists the Textiles
// Framework categories it matches, so a piece's content area suggests its 2019 content.

export const OUTCOMES_2019 = [
  { code: "TEX5-1", text: "explains the properties and performance of a range of textile items" },
  { code: "TEX5-2", text: "justifies the selection of textile materials for specific end uses" },
  { code: "TEX5-3", text: "explains the creative process of design used in the work of textile designers" },
  { code: "TEX5-4", text: "generates and develops textile design ideas" },
  { code: "TEX5-5", text: "investigates and applies methods of colouration and decoration for a range of textile items" },
  { code: "TEX5-6", text: "analyses the influence of historical, cultural and contemporary perspectives on textile design, construction and use" },
  { code: "TEX5-7", text: "evaluates the impact of textiles production and use on the individual consumer and society" },
  { code: "TEX5-8", text: "selects and uses appropriate technology to creatively document, communicate and present design and project work" },
  { code: "TEX5-9", text: "critically selects and creatively manipulates a range of textile materials to produce quality textile items" },
  { code: "TEX5-10", text: "selects appropriate techniques and uses equipment safely in the production of quality textile projects" },
  { code: "TEX5-11", text: "demonstrates competence in the production of textile projects to completion" },
  { code: "TEX5-12", text: "evaluates textile items to determine quality in their design and construction" },
];

export const outcomeText2019 = (code: string) => OUTCOMES_2019.find((o) => o.code === code)?.text ?? "";

type Point2019 = { code: string; area: string; heading: string; text: string; outcome: string; categories: string[] };

const P = (code: string, area: string, heading: string, outcome: string, categories: string[], text: string): Point2019 =>
  ({ code, area, heading, text, outcome, categories });

const PW = "Project work", DES = "Design", PP = "Properties and Performance of Textiles", TS = "Textiles and Society";

export const POINTS_2019: Point2019[] = [
  P("PW-D1", PW, "Designing", "TEX5-8", ["Design Inspiration", "Design Communication"], "Identify and creatively document sources of inspiration for a textile project"),
  P("PW-D2", PW, "Designing", "TEX5-8", ["Design Development", "Design Communication", "Creativity & Innovation"], "Generate and develop design ideas using drawing and rendering techniques"),
  P("PW-D3", PW, "Designing", "TEX5-8", ["Design Communication", "Design Development"], "Use a variety of techniques to communicate and present the development of design ideas"),
  P("PW-D4", PW, "Designing", "TEX5-12", ["Design Analysis & Considerations", "Evaluation"], "Identify aesthetic and functional performance criteria of textile items"),
  P("PW-D5", PW, "Designing", "TEX5-9", ["Experimentation", "Testing, End Use & Selection"], "Experiment with textile materials to determine which are most appropriate for a textile item"),
  P("PW-D6", PW, "Designing", "TEX5-9", ["Selection & Justification", "Testing, End Use & Selection"], "Justify the selection of materials for a textile item"),
  P("PW-P1", PW, "Producing", "TEX5-11", ["Production, Safety & Quality", "Manufacturing Specifications"], "Plan and organise the stages involved in the design and production of a textile item to ensure quality completion"),
  P("PW-P2", PW, "Producing", "TEX5-11", ["Manufacturing Specifications", "Production, Safety & Quality"], "Interpret, modify and use commercial patterns and/or produce simple patterns for a textile item, including notions, fabric requirements, instruction sheet, pattern markings and layout"),
  P("PW-P3", PW, "Producing", "TEX5-11", ["Manufacturing Specifications"], "Calculate quantity and cost of requirements for a textile item, considering spatial concepts"),
  P("PW-P4", PW, "Producing", "TEX5-8", ["Manufacturing Specifications", "Design Communication"], "Plan and document a procedure (sequence) for the construction of a textile item"),
  P("PW-P5", PW, "Producing", "TEX5-10", ["Equipment & Technologies", "Production, Safety & Quality", "Construction"], "Select and safely use textile equipment to construct a quality textile item"),
  P("PW-P6", PW, "Producing", "TEX5-10", ["Construction", "Decoration", "Colouration", "Experimentation"], "Experiment with, select and apply techniques to ensure quality textile items"),
  P("PW-P7", PW, "Producing", "TEX5-7", ["Manufacturing Specifications", "Properties & Performance"], "Identify the labelling requirements of textile items"),
  P("PW-P8", PW, "Producing", "TEX5-8", ["Manufacturing Specifications", "Design Communication"], "Design and produce a product label and swing tag for textile items produced in project work"),
  P("PW-E1", PW, "Evaluating", "TEX5-12", ["Evaluation"], "Establish criteria for evaluation of a textile item"),
  P("PW-E2", PW, "Evaluating", "TEX5-12", ["Evaluation"], "Evaluate the designing and producing of a textile item using a variety of techniques including self-evaluation and peer evaluation"),
  P("PW-E3", PW, "Evaluating", "TEX5-12", ["Evaluation", "Production, Safety & Quality"], "Use feedback from evaluation to modify project work and ensure a quality result"),

  P("DE-1", DES, "The practice of textile designers", "TEX5-3", ["Designers", "Design Analysis & Considerations"], "Identify the features evident in the design and construction of textile items across the focus areas, Apparel, Furnishings, Costume, Textile Arts and Non-apparel"),
  P("DE-2", DES, "The practice of textile designers", "TEX5-3", ["Creativity & Innovation", "Designers"], "Identify examples of creative and innovative design"),
  P("DE-3", DES, "The practice of textile designers", "TEX5-3", ["Designers"], "Explore the creative design approaches used by a variety of textile designers"),
  P("DE-4", DES, "The practice of textile designers", "TEX5-3", ["Aboriginal & Torres Strait Islander Perspectives", "Sustainability & Ethics"], "Understand ethical responsibilities surrounding intellectual property, including Indigenous cultural and intellectual property"),
  P("DE-5", DES, "The practice of textile designers", "TEX5-3", ["Designers"], "Identify a range of textile designers and their applications across focus areas"),
  P("DE-6", DES, "The practice of textile designers", "TEX5-3", ["Designers", "Design Inspiration"], "Research and communicate information about the creative processes used to design textile items"),
  P("DE-7", DES, "The practice of textile designers", "TEX5-4", ["Design Inspiration", "Culture & Society"], "Investigate historical, cultural and contemporary sources of inspiration used by textiles designers"),
  P("DE-8", DES, "The practice of textile designers", "TEX5-4", ["Elements of Design", "Principles of Design"], "Investigate the elements of design"),
  P("DE-9", DES, "The practice of textile designers", "TEX5-3", ["Elements of Design", "Principles of Design", "Designers"], "Describe how the elements of design have been used by textile designers"),
  P("DE-10", DES, "The practice of textile designers", "TEX5-3", ["Design Analysis & Considerations"], "Explain factors affecting the design of one item of a designer's work"),
  P("DE-11", DES, "The practice of textile designers", "TEX5-5", ["Decoration", "Colouration"], "Examine methods of colouration and decoration used by textile designers"),
  P("DE-12", DES, "The practice of textile designers", "TEX5-5", ["Decoration", "Colouration"], "Investigate at least one technique of colouration and decoration"),
  P("DE-13", DES, "The practice of textile designers", "TEX5-5", ["Decoration", "Colouration", "Experimentation"], "Experiment with colour and decorating methods for a specific end product"),

  P("PP-1", PP, "Performance of textile items", "TEX5-1", ["Design Analysis & Considerations", "Testing, End Use & Selection"], "Identify the performance criteria of textile items, as determined by the end use"),
  P("PP-2", PP, "Performance of textile items", "TEX5-1", ["Design Analysis & Considerations", "Construction"], "Identify design features and manufacturing techniques of textile items"),
  P("PP-3", PP, "Performance of textile items", "TEX5-1", ["Construction", "Production, Safety & Quality"], "Investigate deconstructed components of textile items"),
  P("PP-4", PP, "Fabric", "TEX5-1", ["Fabrics"], "Identify, collect and name common fabrics used in textile items"),
  P("PP-5", PP, "Fabric", "TEX5-1", ["Fabrics", "Fabric Creation & Finishes"], "Identify fabric structures"),
  P("PP-6", PP, "Yarn", "TEX5-1", ["Yarns"], "Identify yarns used in textile items"),
  P("PP-7", PP, "Yarn", "TEX5-1", ["Yarns"], "Outline structures and properties of yarns used in textile items"),
  P("PP-8", PP, "Fibre", "TEX5-2", ["Fibres", "Testing, End Use & Selection"], "Investigate natural, manufactured and fibre blend fabrics to determine the fibre(s) used in textile items"),
  P("PP-9", PP, "Properties of fabrics and fibres", "TEX5-2", ["Properties & Performance", "Fibres", "Yarns", "Fabrics"], "Describe how the functional properties of fabric, yarn and fibre contribute to the performance of textile items"),

  P("TS-1", TS, "Historical perspectives of textiles", "TEX5-6", ["Culture & Society", "Textile Industry"], "Explore the historical, technological and social circumstances that have had an impact on the development of textiles"),
  P("TS-2", TS, "Historical perspectives of textiles", "TEX5-6", ["Culture & Society"], "Describe characteristics of design features from different time periods throughout history"),
  P("TS-3", TS, "Historical perspectives of textiles", "TEX5-6", ["Culture & Society"], "Identify historic design features in contemporary design"),
  P("TS-4", TS, "Cultural perspectives of textiles", "TEX5-6", ["Culture & Society"], "Explore textiles as a medium of self-expression"),
  P("TS-5", TS, "Cultural perspectives of textiles", "TEX5-6", ["Aboriginal & Torres Strait Islander Perspectives", "Culture & Society"], "Describe how people from a range of cultures including Aboriginal and/or Torres Strait Islander Peoples use textiles as an expressive and functional medium"),
  P("TS-6", TS, "Cultural perspectives of textiles", "TEX5-6", ["Culture & Society"], "Investigate the design features of textile items from a range of cultural groups"),
  P("TS-7", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Textile Industry"], "Name and describe activities in the Australian textiles industry"),
  P("TS-8", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Textile Industry"], "Explore career opportunities and pathways in the textiles industry"),
  P("TS-9", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Textile Industry", "Sustainability & Ethics"], "Investigate the nature of work in the Australian textiles industry"),
  P("TS-10", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Textile Industry", "Sustainability & Ethics"], "Examine a variety of factors that affect consumer demand, selection and use of textiles"),
  P("TS-11", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Textile Industry"], "Evaluate the marketing strategies of textile-based companies"),
  P("TS-12", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Equipment & Technologies", "Innovation & Emerging Technologies"], "Explore the impact of technology on design and production of textiles"),
  P("TS-13", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Sustainability & Ethics"], "Investigate the potential impact textiles production has on the environment"),
  P("TS-14", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Innovation & Emerging Technologies"], "Describe innovations in textiles"),
  P("TS-15", TS, "Contemporary perspectives of textiles", "TEX5-7", ["Innovation & Emerging Technologies"], "Describe the benefits of innovation for consumers and/or society"),
];

export const point2019 = (code: string) => POINTS_2019.find((p) => p.code === code);

// Suggest 2019 content and 1–3 outcomes for a Textiles Framework "Category – Content area".
export function suggestMapping2019(area: string): { points: string[]; outcomes: string[] } {
  const category = area.split(" – ")[0];
  const points = POINTS_2019.filter((p) => p.categories.includes(category));
  const tally = new Map<string, number>();
  for (const p of points) tally.set(p.outcome, (tally.get(p.outcome) ?? 0) + 1);
  return {
    points: points.slice(0, 4).map((p) => p.code),
    outcomes: [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([o]) => o),
  };
}
