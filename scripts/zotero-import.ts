/**
 * @module Rebuild the THInK Team Zotero group library from the curated
 * `_data/publications.yml` and `_data/invited-talks.yml`.
 *
 * This is a ONE-TIME migration. It maps each YAML field onto the correct
 * *structured* Zotero field, so that `zotero-sync.ts` can reproduce the
 * original citation format exactly.
 *
 * It self-verifies: every item it builds is pushed back through the real
 * `toPublication()` / `toTalk()` from zotero-sync.ts and diffed against the
 * YAML it came from. Anything that will not round-trip is reported, so you
 * see the damage BEFORE anything is written to Zotero.
 *
 * @example Preview and verify. Touches nothing. Always run this first.
 * ```sh
 * deno run -A scripts/zotero-import.ts --dry-run
 * ```
 *
 * @example Write to Zotero. The group library must be EMPTY first.
 * ```sh
 * ZOTERO_GROUP_ID=6616455 ZOTERO_API_KEY=xxxx deno run -A scripts/zotero-import.ts
 * ```
 */
import * as yaml from "@std/yaml";
import { toPublication, toTalk, type ZoteroItem } from "./zotero-sync.ts";

let ZOTERO_API = "https://api.zotero.org";
let BATCH_SIZE = 50; // Zotero's documented maximum per write request

type Entry = Record<string, unknown>;
type ZData = Record<string, unknown>;

/**
 * Citation tails Zotero cannot express structurally. Written verbatim to the
 * item's Extra as `Details: ...`, which zotero-sync.ts then uses as-is.
 *   - "November/December": Zotero's date parser keeps only the first month.
 *   - "Late Breaking Results": a proceedings section; there is no such field.
 */
let DETAILS_OVERRIDE = new Set([
  "Silicon Interconnect Fabric: A Versatile Heterogeneous Integration Platform for AI Systems",
  "Statistical Weight Refresh System for CTT-Based Synaptic Arrays",
]);

let MONTH_RE =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi;

/** "S. S. Iyer" -> { firstName: "S. S.", lastName: "Iyer" } */
export function splitName(raw: string): Record<string, string> {
  let toks = raw.trim().split(/\s+/);
  let i = 0;
  while (i < toks.length && toks[i].endsWith(".")) i++;
  // No leading initials, or nothing left over for a surname: hand Zotero the
  // string verbatim in single-field mode rather than guess.
  if (i === 0 || i === toks.length) return { name: raw.trim() };
  return {
    firstName: toks.slice(0, i).join(" "),
    lastName: toks.slice(i).join(" "),
  };
}

/** "A. One, B. Two, and C. Three" -> ["A. One", "B. Two", "C. Three"] */
export function splitAuthorList(s: unknown): Array<string> {
  if (typeof s !== "string" || !s.trim()) return [];
  return s
    .trim()
    .replace(/,\s+and\s+/g, ", ")
    .replace(/\s+and\s+/g, ", ")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function creators(s: unknown, creatorType: string): Array<ZData> {
  return splitAuthorList(s).map((n) => ({ creatorType, ...splitName(n) }));
}

/** "Vol. 16, No. 2, pp. 593-606, May" -> { volume, issue, pages } */
export function parseDetails(details: unknown): ZData {
  let out: ZData = {};
  if (typeof details !== "string") return out;
  let vol = details.match(/Vol\.\s*([^,]+)/i);
  if (vol) out.volume = vol[1].trim();
  let issue = details.match(/No\.\s*([^,]+)/i);
  if (issue) out.issue = issue[1].trim();
  // First page range only: one entry duplicates it ("pp. 1528-1541, pp. 1528-1541").
  let pages = details.match(/pp?\.\s*([^\s,]+)/i);
  if (pages) out.pages = pages[1].trim();
  return out;
}

/** sort_date may be a YAML date or a 'YYYY-MM-DD' string. */
function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").slice(0, 10);
}

function extraOf(e: Entry, speaker?: unknown): string {
  let lines: Array<string> = [];
  if (DETAILS_OVERRIDE.has(String(e.title)) && typeof e.details === "string") {
    lines.push(`Details: ${e.details}`);
  }
  if (typeof speaker === "string" && speaker.trim()) {
    lines.push(`Speaker: ${speaker.trim()}`);
  }
  if (typeof e.note === "string" && e.note.trim()) {
    lines.push(`Award: ${e.note.trim()}`);
  }
  if (typeof e.link === "string" && e.link.trim()) {
    lines.push(`Link: ${e.link.trim()}`);
  }
  if (typeof e.pdf === "string" && e.pdf.trim()) {
    lines.push(`PDF: ${e.pdf.trim()}`);
  }
  if (typeof e.code === "string" && e.code.trim()) {
    lines.push(`Code: ${e.code.trim()}`);
  }
  return lines.join("\n");
}

export function publicationToZotero(e: Entry): ZData {
  let date = isoDate(e.sort_date);
  let base: ZData = {
    title: e.title,
    creators: creators(e.authors, "author"),
    extra: extraOf(e),
    tags: [],
  };
  if (typeof e.doi === "string" && e.doi) base.DOI = e.doi;

  switch (e.category) {
    case "patent": {
      let venue = String(e.venue ?? "");
      return {
        ...base,
        itemType: "patent",
        creators: creators(e.authors, "inventor"),
        // "United States Patent" -> country "United States"
        country: venue.replace(/\s*Patent\s*$/i, "").trim(),
        patentNumber: e.number ?? "",
        issueDate: date,
      };
    }
    case "book_chapter":
      return {
        ...base,
        itemType: "bookSection",
        bookTitle: e.venue ?? "",
        publisher: e.publisher ?? "",
        creators: [
          ...creators(e.authors, "author"),
          ...creators(e.editor, "editor"),
        ],
        date,
      };
    case "journal":
      return {
        ...base,
        itemType: "journalArticle",
        publicationTitle: e.venue ?? "",
        ...parseDetails(e.details),
        date,
      };
    case "conference":
      return {
        ...base,
        itemType: "conferencePaper",
        proceedingsTitle: e.venue ?? "",
        ...parseDetails(e.details),
        date,
      };
    default:
      throw new Error(`unknown category: ${e.category}`);
  }
}

export function talkToZotero(e: Entry): ZData {
  // `speaker` carries suffixes Zotero cannot model ("(Panelist)", "(Keynote
  // Speaker)"), so it is preserved verbatim in Extra and read back from there.
  let presenter = String(e.speaker ?? "").replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
  return {
    itemType: "presentation",
    title: e.title,
    meetingName: e.venue ?? "",
    place: e.location ?? "",
    date: isoDate(e.sort_date),
    creators: creators(presenter, "presenter"),
    extra: extraOf(e, e.speaker),
    tags: [],
  };
}

/** Wrap generated data so it looks like an API response to the sync code. */
function asZoteroItem(d: ZData): ZoteroItem {
  let parsed = String(d.date ?? d.issueDate ?? "");
  return { key: "PREVIEW", data: d as never, meta: { parsedDate: parsed } };
}

function norm(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

/** Round-trip each entry through the real sync transform and report drift. */
function verify(
  originals: Array<Entry>,
  built: Array<ZData>,
  transform: (i: ZoteroItem) => Record<string, unknown> | null,
  label: string,
): number {
  let broken = 0;
  console.log(`\n=== ${label}: round-trip check (${originals.length}) ===`);
  for (let i = 0; i < originals.length; i++) {
    let back = transform(asZoteroItem(built[i]));
    if (!back) {
      console.log(`  DROPPED  ${originals[i].title}`);
      broken++;
      continue;
    }
    let diffs: Array<string> = [];
    for (
      let f of new Set([...Object.keys(originals[i]), ...Object.keys(back)])
    ) {
      if (f === "category") continue;
      let a = norm(originals[i][f]);
      let b = norm(back[f]);
      if (a !== b) {
        diffs.push(
          `      ${f}:\n        yaml: ${a || "(empty)"}\n        back: ${
            b || "(empty)"
          }`,
        );
      }
    }
    if (diffs.length) {
      broken++;
      console.log(`  ~ ${originals[i].title}`);
      console.log(diffs.join("\n"));
    }
  }
  console.log(
    `  ${originals.length - broken}/${originals.length} round-trip exactly`,
  );
  return broken;
}

async function postBatch(
  groupId: string,
  apiKey: string,
  items: Array<ZData>,
): Promise<void> {
  let resp = await fetch(`${ZOTERO_API}/groups/${groupId}/items`, {
    method: "POST",
    headers: {
      "Zotero-API-Version": "3",
      "Zotero-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items),
  });
  if (!resp.ok) {
    throw new Error(`Zotero API ${resp.status}: ${await resp.text()}`);
  }
  let body = await resp.json();
  let ok = Object.keys(body.successful ?? {}).length;
  let failed = Object.entries(body.failed ?? {});
  console.log(`  wrote ${ok}/${items.length}`);
  for (let [idx, err] of failed) {
    console.error(`  FAILED [${idx}]: ${JSON.stringify(err)}`);
  }
  if (failed.length) throw new Error(`${failed.length} item(s) rejected`);
}

if (import.meta.main) {
  let dryRun = Deno.args.includes("--dry-run");

  let pubs = yaml.parse(
    await Deno.readTextFile(
      new URL("../_data/publications.yml", import.meta.url),
    ),
  ) as Array<Entry>;
  let talks = yaml.parse(
    await Deno.readTextFile(
      new URL("../_data/invited-talks.yml", import.meta.url),
    ),
  ) as Array<Entry>;

  let builtPubs = pubs.map(publicationToZotero);
  let builtTalks = talks.map(talkToZotero);

  let broken = verify(pubs, builtPubs, toPublication, "Publications") +
    verify(talks, builtTalks, toTalk, "Invited talks");

  console.log(
    `\n${pubs.length} publications + ${talks.length} talks = ` +
      `${
        builtPubs.length + builtTalks.length
      } Zotero items; ${broken} need attention`,
  );

  if (dryRun) {
    let out = "/tmp/zotero-items.json";
    await Deno.writeTextFile(
      out,
      JSON.stringify([...builtPubs, ...builtTalks], null, 2),
    );
    console.log(`--dry-run: wrote ${out}, nothing sent to Zotero`);
    Deno.exit(0);
  }

  let groupId = Deno.env.get("ZOTERO_GROUP_ID");
  let apiKey = Deno.env.get("ZOTERO_API_KEY");
  if (!groupId || !apiKey) {
    console.error(
      "ZOTERO_GROUP_ID and ZOTERO_API_KEY (write-enabled) required",
    );
    Deno.exit(1);
  }

  let all = [...builtPubs, ...builtTalks];
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    let batch = all.slice(i, i + BATCH_SIZE);
    console.log(`POST items ${i + 1}-${i + batch.length}...`);
    await postBatch(groupId, apiKey, batch);
  }
  console.log(`done: ${all.length} items written to group ${groupId}`);
}
