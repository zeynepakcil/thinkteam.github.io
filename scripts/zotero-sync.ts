/**
 * @module Sync a Zotero group library into the THInK Team website data files.
 *
 * Rebuilds `_data/publications.yml` and `_data/invited-talks.yml` from Zotero.
 * Zotero is the single source of truth: anything not in Zotero is dropped.
 *
 * Zotero item type -> publication category
 *   journalArticle  -> journal
 *   conferencePaper -> conference
 *   bookSection     -> book_chapter
 *   patent          -> patent
 *   presentation    -> (invited talk)
 *
 * The Zotero "Extra" field carries data Zotero has no field for. One per line:
 *   Award: Best Paper Award.
 *   PDF: https://example.com/paper.pdf
 *   Code: https://github.com/THInK-Team/repo
 *   Details: Vol. 63, No. 6, pp. 5:1-5:16, November/December
 *   Link: https://example.com
 *
 * Note: Zotero's own URL field is deliberately NOT used as a fallback for
 * `link` - importers populate it on every item, which renders a bogus "Link"
 * on every citation. A link only appears if you ask for one via Extra.
 *   Speaker: B. Vaisband (Panelist)
 *   Details: Vol. 63, No. 6, pp. 5:1-5:16, November/December
 *
 * Tag an item `website-ignore` to exclude it.
 *
 * @example
 * ```sh
 * ZOTERO_GROUP_ID=1234567 deno run -A scripts/zotero-sync.ts --check
 * ZOTERO_GROUP_ID=1234567 deno run -A scripts/zotero-sync.ts
 * ```
 */
import * as yaml from "@std/yaml";

let ZOTERO_API = "https://api.zotero.org";
let IGNORE_TAG = "website-ignore";
let PAGE_SIZE = 100;

let MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface ZoteroCreator {
  creatorType: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface ZoteroItem {
  key: string;
  data: {
    itemType: string;
    title?: string;
    creators?: Array<ZoteroCreator>;
    tags?: Array<{ tag: string }>;
    extra?: string;
    DOI?: string;
    url?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    publicationTitle?: string;
    proceedingsTitle?: string;
    conferenceName?: string;
    bookTitle?: string;
    publisher?: string;
    patentNumber?: string;
    country?: string;
    issueDate?: string;
    meetingName?: string;
    place?: string;
    date?: string;
  };
  meta: { parsedDate?: string };
}

/**
 * Turn a given name into initials, IEEE style.
 *
 * "Subramanian S." -> "S. S."
 * "Chih-Kang"      -> "C.-K."   (hyphen preserved, per IEEE)
 * "C.-K."          -> "C.-K."   (already initials: idempotent)
 */
export function initials(first: string | undefined): string {
  if (!first) return "";
  return first
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .filter(Boolean)
        .map((part) => `${part[0].toUpperCase()}.`)
        .join("-")
    )
    .join(" ");
}

export function formatCreator(c: ZoteroCreator): string {
  if (c.name) return c.name.trim();
  return [initials(c.firstName), c.lastName?.trim()].filter(Boolean).join(" ");
}

/** IEEE-ish author list: "A. One, B. Two, and C. Three" */
export function formatAuthors(
  creators: Array<ZoteroCreator> | undefined,
  roles: Array<string> = ["author", "inventor", "presenter", "contributor"],
): string {
  let names = (creators ?? [])
    .filter((c) => roles.includes(c.creatorType))
    .map(formatCreator)
    .filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** Parse the Extra field into a lowercased key/value map. */
export function parseExtra(extra: string | undefined): Record<string, string> {
  let out: Record<string, string> = {};
  for (let line of (extra ?? "").split("\n")) {
    let m = line.match(/^\s*([A-Za-z][A-Za-z0-9 _-]*?)\s*:\s*(.+?)\s*$/);
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return out;
}

/** Zotero's parsedDate is "YYYY", "YYYY-MM" or "YYYY-MM-DD". Normalise it. */
export function normaliseDate(
  parsed: string | undefined,
): { year: number; sortDate: string; month: string | null } | null {
  if (!parsed) return null;
  let m = parsed.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return null;
  let year = Number(m[1]);
  let mm = m[2] ?? "01";
  let dd = m[3] ?? "01";
  return {
    year,
    sortDate: `${m[1]}-${mm}-${dd}`,
    month: m[2] ? MONTHS[Number(m[2]) - 1] ?? null : null,
  };
}

/** "Vol. 16, No. 2, pp. 593-606, May" */
export function buildDetails(
  d: ZoteroItem["data"],
  month: string | null,
): string | null {
  let parts: Array<string> = [];
  if (d.volume) parts.push(`Vol. ${d.volume}`);
  if (d.issue) parts.push(`No. ${d.issue}`);
  if (d.pages) {
    parts.push(
      `${/[-\u2010-\u2015\u2212]/.test(d.pages) ? "pp." : "p."} ${d.pages}`,
    );
  }
  if (month) parts.push(month);
  return parts.length > 0 ? parts.join(", ") : null;
}

function doiUrl(doi: string | undefined): string | null {
  if (!doi) return null;
  return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
}

export function toPublication(
  item: ZoteroItem,
): Record<string, unknown> | null {
  let d = item.data;
  let extra = parseExtra(d.extra);
  let when = normaliseDate(item.meta.parsedDate);
  if (!when) {
    console.warn(`! skipping "${d.title}" (${item.key}): no parsable date`);
    return null;
  }
  if (!d.title) return null;

  let common = {
    year: when.year,
    sort_date: when.sortDate,
    title: d.title,
    authors: formatAuthors(d.creators),
  };

  if (d.itemType === "patent") {
    return {
      category: "patent",
      ...common,
      venue: d.country ? `${d.country} Patent` : "Patent",
      status: `Published ${monthDayYear(item.meta.parsedDate!)}`,
      number: d.patentNumber ?? null,
      link: extra.link ?? null,
      note: extra.award ?? null,
    };
  }

  if (d.itemType === "bookSection") {
    return {
      category: "book_chapter",
      ...common,
      venue: d.bookTitle ?? "",
      publisher: d.publisher ?? null,
      editor: formatAuthors(d.creators, ["editor"]) || null,
      link: extra.link ?? null,
      note: extra.award ?? null,
    };
  }

  if (d.itemType === "journalArticle" || d.itemType === "conferencePaper") {
    let venue = d.itemType === "journalArticle"
      ? d.publicationTitle
      : (d.proceedingsTitle || d.conferenceName);
    return {
      category: d.itemType === "journalArticle" ? "journal" : "conference",
      ...common,
      venue: venue ?? "",
      details: extra.details ?? buildDetails(d, when.month),
      doi: doiUrl(d.DOI),
      pdf: extra.pdf ?? null,
      code: extra.code ?? null,
      link: extra.link ?? null,
      note: extra.award ?? null,
    };
  }

  return null;
}

function monthDayYear(parsed: string): string {
  let m = parsed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    let y = parsed.match(/^(\d{4})/);
    return y ? y[1] : parsed;
  }
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

export function toTalk(item: ZoteroItem): Record<string, unknown> | null {
  let d = item.data;
  if (d.itemType !== "presentation") return null;
  let extra = parseExtra(d.extra);
  let when = normaliseDate(item.meta.parsedDate);
  if (!when) {
    console.warn(
      `! skipping talk "${d.title}" (${item.key}): no parsable date`,
    );
    return null;
  }
  return {
    year: when.year,
    sort_date: when.sortDate,
    speaker: extra.speaker ?? formatAuthors(d.creators),
    title: d.title ?? null,
    venue: d.meetingName ?? "",
    location: d.place ?? null,
    date: when.month ? `${when.month} ${when.year}` : String(when.year),
    note: extra.award ?? null,
    link: extra.link ?? null,
  };
}

export async function fetchAllItems(
  groupId: string,
  apiKey?: string,
): Promise<Array<ZoteroItem>> {
  let items: Array<ZoteroItem> = [];
  let start = 0;
  while (true) {
    let url = new URL(`${ZOTERO_API}/groups/${groupId}/items`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("start", String(start));
    let headers: Record<string, string> = { "Zotero-API-Version": "3" };
    if (apiKey) headers["Zotero-API-Key"] = apiKey;

    let resp = await fetch(url, { headers });
    if (!resp.ok) {
      throw new Error(
        `Zotero API ${resp.status} ${resp.statusText}: ${await resp.text()}`,
      );
    }
    let batch = await resp.json() as Array<ZoteroItem>;
    items.push(...batch);
    let total = Number(resp.headers.get("Total-Results") ?? "0");
    start += PAGE_SIZE;
    if (batch.length === 0 || items.length >= total) break;
  }
  return items;
}

export function isIgnored(item: ZoteroItem): boolean {
  return (item.data.tags ?? []).some((t) => t.tag === IGNORE_TAG);
}

function header(what: string): string {
  return `# ${what}\n` +
    `# DO NOT EDIT BY HAND - generated from Zotero by scripts/zotero-sync.ts.\n` +
    `# Edit the Zotero group library instead; changes sync automatically.\n`;
}

/**
 * Write a data file, but refuse to replace real content with nothing.
 *
 * The sync is a mirror: anything absent from Zotero is deleted. That is
 * intended for normal edits, but an empty result almost always means a
 * mistake (wrong group id, API hiccup, or a category not yet migrated) --
 * and silently blanking a populated file loses real work. Skip instead,
 * unless --force says otherwise.
 */
export async function writeGuarded(
  path: URL,
  entries: Array<unknown>,
  label: string,
  force: boolean,
): Promise<void> {
  let existing = "";
  try {
    existing = await Deno.readTextFile(path);
  } catch {
    // no existing file: nothing to protect
  }
  let existingHasContent = existing.trim() !== "" &&
    !/^(\[\]|\{\})$/m.test(existing.replace(/^#.*$/gm, "").trim());

  if (entries.length === 0 && existingHasContent && !force) {
    console.warn(
      `! REFUSING to blank ${label}: Zotero returned 0 items but the ` +
        `existing file has content.\n` +
        `  Nothing was written. If this is really what you want, re-run ` +
        `with --force.`,
    );
    return;
  }

  await Deno.writeTextFile(
    path,
    header(label) + yaml.stringify(entries, { lineWidth: 100 }),
  );
  console.log(`wrote ${label} (${entries.length} entries)`);
}

if (import.meta.main) {
  let check = Deno.args.includes("--check");
  let force = Deno.args.includes("--force");
  let groupId = Deno.env.get("ZOTERO_GROUP_ID");
  if (!groupId) {
    console.error("ZOTERO_GROUP_ID is not set");
    Deno.exit(1);
  }

  let items = await fetchAllItems(groupId, Deno.env.get("ZOTERO_API_KEY"));
  let usable = items.filter((i) =>
    !isIgnored(i) && !["attachment", "note"].includes(i.data.itemType)
  );

  let publications = usable
    .map(toPublication)
    .filter((x): x is Record<string, unknown> => x !== null)
    .sort((a, b) => String(a.sort_date).localeCompare(String(b.sort_date)));

  let talks = usable
    .map(toTalk)
    .filter((x): x is Record<string, unknown> => x !== null)
    .sort((a, b) => String(a.sort_date).localeCompare(String(b.sort_date)));

  let unmatched = usable.filter((i) =>
    toPublication(i) === null && toTalk(i) === null
  );
  for (let i of unmatched) {
    console.warn(`! ignored item type "${i.data.itemType}": ${i.data.title}`);
  }

  console.log(
    `Zotero group ${groupId}: ${items.length} items -> ` +
      `${publications.length} publications, ${talks.length} talks`,
  );

  if (check) {
    console.log("--check: not writing files");
    Deno.exit(0);
  }

  await writeGuarded(
    new URL("../_data/publications.yml", import.meta.url),
    publications,
    "Publications",
    force,
  );
  await writeGuarded(
    new URL("../_data/invited-talks.yml", import.meta.url),
    talks,
    "Invited talks",
    force,
  );
}
