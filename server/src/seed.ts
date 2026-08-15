import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from './env.js';
import { StageModel, StateModel } from './models.js';
import { DEFAULT_STATE, STAGE_KEYS, parseResults } from './types.js';

/**
 *   npm run seed              import data/results.json
 *   npm run seed -- --sample  import data/results.sample.json (a filled-in board
 *                             for previewing the populated standings)
 *   npm run seed -- --force   overwrite results.json even if it holds real scores
 */
async function main() {
  const args = new Set(process.argv.slice(2));
  const useSample = args.has('--sample');
  const force = args.has('--force');

  const sourceFile = path.join(env.dataDir, useSample ? 'results.sample.json' : 'results.json');
  const targetFile = path.join(env.dataDir, 'results.json');

  const source = parseResults(JSON.parse(await fs.readFile(sourceFile, 'utf8')));
  const teamCount = STAGE_KEYS.reduce((n, key) => n + source.stages[key].teams.length, 0);

  if (!env.mongoUri) {
    if (!useSample) {
      console.log(`[seed] No MONGODB_URI set. data/results.json is already the live source — nothing to import.`);
      console.log(`[seed] Edit it and refresh the page. Add --sample to load the demo board.`);
      return;
    }

    const existing = parseResults(JSON.parse(await fs.readFile(targetFile, 'utf8').catch(() => '{}')));
    const existingTeams = STAGE_KEYS.reduce((n, key) => n + existing.stages[key].teams.length, 0);
    if (existingTeams > 0 && !force) {
      console.error(`[seed] results.json already has ${existingTeams} squads in it. Re-run with --force to replace.`);
      process.exitCode = 1;
      return;
    }

    await fs.writeFile(targetFile, `${JSON.stringify(source, null, 2)}\n`, 'utf8');
    console.log(`[seed] wrote the sample board into data/results.json (${teamCount} squads)`);
    return;
  }

  await mongoose.connect(env.mongoUri, { dbName: env.dbName, serverSelectionTimeoutMS: 5000 });
  await StageModel.deleteMany({});
  await StageModel.insertMany(STAGE_KEYS.map((key) => ({ key, ...source.stages[key] })));
  await StateModel.findByIdAndUpdate('state', DEFAULT_STATE, { upsert: true });
  console.log(`[seed] imported ${path.basename(sourceFile)} into ${env.dbName} (${teamCount} squads)`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[seed] failed:', error);
  process.exit(1);
});
