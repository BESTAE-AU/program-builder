// Textiles equipment hazards and controls, from Britt's ref-whs skill
// (SCS TAS Safety Handbook Part 3, Approved Textile Equipment table and procedures).
// `fromYear` is the first year group allowed to use it once assessed competent.

export type Equipment = { id: string; name: string; fromYear: number; controls: string[]; notice?: string };

export const TEXTILES_GENERAL =
  "Permission before using any equipment; correct PPE; long hair confined; loose clothing secured; solid, firm shoes. Students are assessed competent on each item before use.";

export const EQUIPMENT: Equipment[] = [
  {
    id: "sewing-machine", name: "Sewing machine", fromYear: 7,
    controls: ["Goggles worn while using the machine.", "One operator at a time; other students keep clear of the work area.", "Machine off before any adjustment.", "Needle in the uppermost position before removing fabric.", "Do not push or pull fabric while stitching."],
    notice: "Tie your hair back and wear closed-in shoes. Goggles on at the sewing machine.",
  },
  {
    id: "overlocker", name: "Overlocker", fromYear: 8,
    controls: ["Goggles worn while using the machine.", "One operator; others keep clear.", "Machine off before adjustments.", "Take care with pins near the blade; remove pins before they reach the knife.", "Clean lint after use."],
    notice: "Goggles on at the overlocker. Remove pins before they reach the blade.",
  },
  {
    id: "iron", name: "Iron", fromYear: 7,
    controls: ["Work flat on the ironing table.", "Iron off before filling with water.", "Rest the iron on its heel; never leave it unattended while on.", "Set the temperature for the fabric; hands clear of the sole plate.", "Off and cooled before storing."],
  },
  {
    id: "steamer", name: "Garment steamer", fromYear: 9,
    controls: ["Unplugged and cooled before filling.", "Flat surface; wand directed away from the body.", "Never left unattended when on; wand on its stand.", "Cooled and emptied before storing."],
  },
  {
    id: "scissors", name: "Scissors and general tools", fromYear: 7,
    controls: ["Cut and carry with blades pointing away and down.", "Do not catch falling scissors; step back.", "Unpickers and snips directed away from the body.", "No pins or needles in mouths.", "Report and tag damaged tools."],
  },
  {
    id: "rotary-cutter", name: "Rotary ruler cutter", fromYear: 7,
    controls: ["Cutting mat and plastic ruler only.", "Cut standing, away from the body, non-cutting hand out of the line.", "Safety guard closed when not in use."],
  },
  {
    id: "hot-glue", name: "Hot glue gun", fromYear: 7,
    controls: ["Clear, ventilated space away from flammables.", "Do not touch melted glue or hot metal parts.", "In its stand on a heat-resistant surface when not in use."],
  },
  {
    id: "hot-air", name: "Hair dryer or hot air gun", fromYear: 7,
    controls: ["Avoid hot parts; rest on a heat-resistant surface.", "Nozzle directed away from people and flammable material."],
  },
  {
    id: "hotplate", name: "Electric hotplate or frypan (dyeing)", fromYear: 9,
    controls: ["Level surface; handles turned in; do not let liquids boil over.", "Beware latent heat; switch off when finished.", "SDS reviewed and risk assessment done before using dyes or chemicals; aprons on."],
  },
  {
    id: "unlisted", name: "Unlisted equipment (heat press, embroidery machine, dye pots…)", fromYear: 7,
    controls: ["Not on the approved textiles equipment table: complete a risk assessment before introducing it."],
  },
];

export const equipment = (id: string) => EQUIPMENT.find((e) => e.id === id);
