// Builds the three exports for the sample unit into ./out, for checking.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sampleUnit } from "../lib/sample-unit";
import { buildProgram } from "../lib/docx/program";
import { buildPlanning } from "../lib/docx/planning";
import { compassDocx, compassHtmlPage, compassPlan } from "../lib/docx/compass";
import { coverage, lessonCount, sequenceWarnings } from "../lib/rules";

const save = async (name: string, blob: Blob) => writeFileSync(`out/${name}`, Buffer.from(await blob.arrayBuffer()));

async function main() {
  mkdirSync("out", { recursive: true });
  const u = sampleUnit();
  const tpl = readFileSync("public/templates/program-template.docx");
  await save("program.docx", await buildProgram(u, tpl.buffer.slice(tpl.byteOffset, tpl.byteOffset + tpl.byteLength)));
  await save("planning.docx", await buildPlanning(u));
  // An annotated register with the first two lessons recorded.
  const r = structuredClone(u);
  r.slots["1-1"].register = { date: "2028-02-02", taught: "taught", notes: "Kollab case study took longer; brand choice moved to homework." };
  r.slots["1-2"].register = { date: "2028-02-04", taught: "partly", notes: "Machine set-up demo moved to next lesson." };
  r.slots["3-3"].resources = [{ name: "Construction workbooklet p.12 – Open and closed seams", url: "https://example.org/booklet" }];
  r.slots["3-3"].priorities = ["Sustainability"];
  r.register.teacherComments = "Strong engagement with the brand research.";
  await save("register.docx", await buildProgram(r, tpl.buffer.slice(tpl.byteOffset, tpl.byteOffset + tpl.byteLength), true));
  const plans = [1, 2, 3, 4, 5].map((l) => compassPlan(u, 3, l)).filter((p) => p !== null);
  await save("compass-cycle3.docx", await compassDocx(plans, "Cycle 3"));
  writeFileSync("out/compass-cycle3.html", compassHtmlPage(plans, "Cycle 3"));
  console.log("warnings:", sequenceWarnings(u));
  console.log("coverage:", coverage(u));
  console.log("count:", lessonCount(u));
}
main();
