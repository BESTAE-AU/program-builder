// Student Unit Evaluation (Google Form responses, downloaded from Sheets as CSV).
// Names, emails and timestamps are dropped here, in the browser, before anything is
// sent for summarising. Columns are found by their question wording.

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const COLUMNS = {
  course: /course you have just completed/i,
  unit: /which unit of work/i,
  teacher: /name of your teacher/i,
  inTime: /complete the unit and assessment task in time/i,
  feedback: /received regular feedback/i,
  resources: /resources and materials needed/i,
  enjoyed: /specific resources and materials did you enjoy/i,
  engaged: /how engaged/i,
  bySelf: /work by myself/i,
  contribute: /contribute to class/i,
  inhibited: /inhibited/i,
  project: /think about the design project/i,
  recommend: /recommendation for this course/i,
  improve: /want to improve on/i,
  overall: /overall rating/i,
} as const;
type Col = keyof typeof COLUMNS;

export type EvalSummary = {
  responses: number;
  ratings: Record<string, number>; // averages out of 5
  counts: Record<string, Record<string, number>>; // Yes / Sometimes / No
  recommendations: Record<string, number>;
  comments: { enjoyed: string[]; inhibited: string[]; improve: string[] };
};

export function summariseResponses(csv: string, filter: { course: string; unit: string; teacher?: string }): EvalSummary {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error("That file is empty.");
  const idx = {} as Record<Col, number>;
  for (const k of Object.keys(COLUMNS) as Col[]) idx[k] = header.findIndex((h) => COLUMNS[k].test(h));
  if (idx.overall < 0 || idx.engaged < 0) throw new Error("This doesn't look like the Student Unit Evaluation responses. Download the responses sheet as CSV.");

  const get = (r: string[], k: Col) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
  const unitNo = filter.unit.replace(/\D/g, "");
  const courseWord = filter.course.split(/\s/)[0].toLowerCase();
  const mine = rows.filter((r) =>
    (!get(r, "course") || get(r, "course").toLowerCase().includes(courseWord)) &&
    (!get(r, "unit") || get(r, "unit").replace(/\D/g, "") === unitNo) &&
    (!filter.teacher || !get(r, "teacher") || get(r, "teacher").toLowerCase().includes(filter.teacher.toLowerCase())),
  );

  const avg = (k: Col) => {
    const ns = mine.map((r) => Number(get(r, k))).filter((n) => n > 0);
    return ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : 0;
  };
  const count = (k: Col) => mine.reduce<Record<string, number>>((m, r) => { const v = get(r, k); if (v) m[v] = (m[v] ?? 0) + 1; return m; }, {});
  const recommendations: Record<string, number> = {};
  for (const r of mine) for (const v of get(r, "recommend").split(/,\s*(?=[A-Z])/)) if (v.trim()) recommendations[v.trim()] = (recommendations[v.trim()] ?? 0) + 1;
  const texts = (k: Col) => mine.map((r) => get(r, k)).filter((t) => t.length > 2).slice(0, 200);

  return {
    responses: mine.length,
    ratings: { "Overall rating": avg("overall"), Engagement: avg("engaged"), "Design project / assessment": avg("project"), "Working independently": avg("bySelf"), "Contributing in class": avg("contribute") },
    counts: { "Completed in the time available": count("inTime"), "Received regular feedback": count("feedback"), "Resources were available": count("resources") },
    recommendations,
    comments: { enjoyed: texts("enjoyed"), inhibited: texts("inhibited"), improve: texts("improve") },
  };
}
