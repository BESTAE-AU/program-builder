# Unit Builder

Plan a teaching unit step by step and export it to Word.

1. **Setup**: course, year, unit, what students make, focus areas, outcomes, cycles and lessons per cycle, students (initials and NCCD level), resources, case study.
2. **Bank**: assessment tasks (AT/FT, parts, outcomes, set and due cycles) and the unit's items: task parts, skills and samples, theory topics, software skills. AI breaks an item into lesson-sized pieces using the Textiles Framework and the Activities & Tasks Framework.
3. **Grid**: drag pieces into lessons (or Select, then Place here). Each lesson shows its stream, status, stacked pieces and minutes. Side panels: bank, lesson count, sequence check, assessment timeline, outcome coverage.
4. **Lesson**: order and time the pieces, write student steps (AI or by hand), check suggested outcomes and syllabus points, and edit or AI-tailor the Supplementary / Substantial / Extensive / Extension–Newman / Life Skills adjustments. Download the Compass lesson plan.
5. **Export**: the program and the annotated register (program plus date taught, taught / partly / not taught and notes per lesson, and the school register table) (in the new-syllabus program template), the Brainstorm & Planning doc, Compass plans for a whole cycle, and a backup copy of the unit.

The Tote-ally Textiles Unit 1 is preloaded as an example.

## Frameworks

Copied from Britt's artifacts into `lib/frameworks/`:

- `activities.json`: 51 activity types (family, step, verbs, mode, ways to do it, adjustments by NCCD level) from the Activities & Tasks Framework.
- `tasks.json`: formative and summative task types.
- `textiles.json`: Textiles Framework strands, categories and content areas with their numbered syllabus points, plus the NESA Textiles Technology 7–10 (2025) Stage 5 outcomes and content.

`public/templates/program-template.docx` is the 2028 new-syllabus program (Unit 1) with its content cleared. Exports write into it, so the header, logo and styles match.

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for the AI buttons
npm run dev
```

Open http://localhost:3000. Without a key everything works except the AI buttons, which say so.

Units are saved in the browser for now (Export → Save a copy for a backup file).

`npx tsx scripts/export-sample.ts` writes the three exports for the sample unit to `out/`.
