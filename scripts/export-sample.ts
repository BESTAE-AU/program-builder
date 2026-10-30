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
  const plans = [1, 2, 3, 4, 5].map((l) => compassPlan(u, 3, l)).filter((p) => p !== null);
  await save("compass-cycle3.docx", await compassDocx(plans, "Cycle 3"));
  writeFileSync("out/compass-cycle3.html", compassHtmlPage(plans, "Cycle 3"));
  console.log("warnings:", sequenceWarnings(u));
  console.log("coverage:", coverage(u));
  console.log("count:", lessonCount(u));
}
main();
