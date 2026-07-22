/**
 * @module One-off audit: semantically compare two data YAML files.
 *
 * Matches entries by title and reports entries that vanished, appeared, or had
 * a field change. Ignores key order and formatting, so it is readable in a way
 * `git diff` is not after a full regeneration.
 *
 * @example
 * ```sh
 * git show HEAD:_data/publications.yml > /tmp/old-pubs.yml
 * deno run -A scripts/compare-data.ts /tmp/old-pubs.yml _data/publications.yml
 * ```
 */
import * as yaml from "@std/yaml";

type Entry = Record<string, unknown>;

function norm(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function key(e: Entry): string {
  return norm(e.title).toLowerCase().replace(/\s+/g, " ");
}

async function load(path: string): Promise<Array<Entry>> {
  let text = await Deno.readTextFile(path);
  let data = yaml.parse(text) as Array<Entry>;
  if (!Array.isArray(data)) throw new Error(`${path} is not a YAML list`);
  return data;
}

if (import.meta.main) {
  let [oldPath, newPath] = Deno.args;
  if (!oldPath || !newPath) {
    console.error("usage: compare-data.ts <old.yml> <new.yml>");
    Deno.exit(1);
  }

  let oldEntries = await load(oldPath);
  let newEntries = await load(newPath);
  let oldMap = new Map(oldEntries.map((e) => [key(e), e]));
  let newMap = new Map(newEntries.map((e) => [key(e), e]));

  let gone = [...oldMap.keys()].filter((k) => !newMap.has(k));
  let added = [...newMap.keys()].filter((k) => !oldMap.has(k));

  console.log(`old: ${oldEntries.length}   new: ${newEntries.length}\n`);

  if (gone.length) {
    console.log(`--- LOST (${gone.length}) - in old, missing from Zotero ---`);
    for (let k of gone) console.log(`  ${oldMap.get(k)!.title}`);
    console.log();
  }
  if (added.length) {
    console.log(`--- NEW (${added.length}) - in Zotero, not in old file ---`);
    for (let k of added) console.log(`  ${newMap.get(k)!.title}`);
    console.log();
  }

  let changed = 0;
  for (let [k, oldEntry] of oldMap) {
    let newEntry = newMap.get(k);
    if (!newEntry) continue;
    let fields = new Set([...Object.keys(oldEntry), ...Object.keys(newEntry)]);
    let diffs: Array<string> = [];
    for (let f of fields) {
      let a = norm(oldEntry[f]);
      let b = norm(newEntry[f]);
      if (a !== b) {
        diffs.push(
          `      ${f}:\n        old: ${a || "(empty)"}\n        new: ${
            b || "(empty)"
          }`,
        );
      }
    }
    if (diffs.length) {
      changed++;
      console.log(`~ ${oldEntry.title}`);
      console.log(diffs.join("\n"));
    }
  }

  console.log(
    `\nsummary: ${gone.length} lost, ${added.length} new, ${changed} changed, ` +
      `${oldMap.size - gone.length - changed} identical`,
  );
}
