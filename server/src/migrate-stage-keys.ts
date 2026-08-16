import mongoose from 'mongoose';
import { env } from './env.js';
import { DEFAULT_LABELS } from './types.js';

/**
 * ONE-OFF MIGRATION — run once per database, then forget it exists.
 *
 *   npm run migrate:stages
 *
 * The tournament used to run  qualifiers → semis → finals . It now runs two
 * parallel qualifier groups that both feed the grand finals, so the stage keys
 * changed:
 *
 *     qualifiers  →  qualifiers_a
 *     semis       →  qualifiers_b
 *     finals      →  finals          (unchanged)
 *
 * Renaming the key in the code does not rename the documents already sitting in
 * MongoDB. Without this, the old rows are orphaned: the board reads empty and
 * anything already typed into it is stranded under a key nothing looks up.
 *
 * Teams, status and notes are carried across untouched. Labels are only
 * refreshed when they still hold the old default, so a label edited in /admin
 * is never overwritten.
 *
 * Safe to run twice — the second run finds nothing to do and says so. Writes go
 * through the raw collection on purpose: the old key values no longer satisfy
 * the schema's enum, and a Mongoose validator would reject the very documents
 * being repaired.
 */

/** Labels that are really just a stage key wearing a label's clothes. */
const KEY_SHAPED = new Set(['qualifiers', 'semis', 'finals', 'qualifiers_a', 'qualifiers_b']);

const RENAMES = [
  { from: 'qualifiers', to: 'qualifiers_a', staleLabel: 'Qualifiers', label: 'Qualifiers Group A' },
  { from: 'semis', to: 'qualifiers_b', staleLabel: 'Semi-finals', label: 'Qualifiers Group B' },
] as const;

async function main() {
  if (!env.mongoUri) {
    console.log('MONGODB_URI is not set — this database is JSON files, nothing to migrate.');
    console.log('The keys in server/data/results.json are already correct.');
    return;
  }

  await mongoose.connect(env.mongoUri, { dbName: env.dbName });
  const stages = mongoose.connection.collection('stages');
  console.log(`[migrate] connected to ${env.dbName}`);

  let changed = 0;

  for (const { from, to, staleLabel, label } of RENAMES) {
    const old = await stages.findOne({ key: from });

    if (!old) {
      console.log(`[migrate] no "${from}" document — nothing to rename`);
      continue;
    }

    // If the new key already exists, the old row is a leftover from a half-run
    // migration. Keep whichever one actually holds squads.
    const target = await stages.findOne({ key: to });
    if (target) {
      const oldTeams = Array.isArray(old.teams) ? old.teams.length : 0;
      const newTeams = Array.isArray(target.teams) ? target.teams.length : 0;
      if (oldTeams > newTeams) {
        await stages.deleteOne({ _id: target._id });
        await stages.updateOne({ _id: old._id }, { $set: { key: to } });
        console.log(`[migrate] "${to}" existed but was emptier — kept "${from}" (${oldTeams} squads)`);
        changed += 1;
      } else {
        await stages.deleteOne({ _id: old._id });
        console.log(`[migrate] "${to}" already holds the data — dropped the stale "${from}" row`);
        changed += 1;
      }
      continue;
    }

    const patch: Record<string, unknown> = { key: to };
    if (typeof old.label !== 'string' || old.label.trim() === '' || old.label === staleLabel) {
      patch.label = label;
    }

    await stages.updateOne({ _id: old._id }, { $set: patch });
    const teams = Array.isArray(old.teams) ? old.teams.length : 0;
    console.log(`[migrate] ${from} → ${to}  (${teams} squad${teams === 1 ? '' : 's'} carried over)`);
    changed += 1;
  }

  // Older saves stored the raw key as the display label (a Mongo-only bug in
  // putStage, now fixed). Those read as "qualifiers_a" on the site's tabs, so
  // put the proper name back. A label someone actually chose is left alone.
  for (const [key, label] of Object.entries(DEFAULT_LABELS)) {
    const doc = await stages.findOne({ key });
    if (!doc) continue;

    const current = typeof doc.label === 'string' ? doc.label.trim() : '';
    const looksLikeAKey = current === '' || KEY_SHAPED.has(current.toLowerCase());
    if (!looksLikeAKey || current === label) continue;

    await stages.updateOne({ _id: doc._id }, { $set: { label } });
    console.log(`[migrate] label "${current || '(empty)'}" → "${label}"`);
    changed += 1;
  }

  const remaining = await stages.find({}, { projection: { key: 1, label: 1 } }).toArray();
  console.log(`[migrate] stages now: ${remaining.map((d) => d.key).sort().join(', ') || '(none)'}`);
  console.log(changed === 0 ? '[migrate] already up to date.' : `[migrate] done — ${changed} document(s) updated.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migrate] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
