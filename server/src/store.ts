import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from './env.js';
import { IntentModel, MediaModel, StageModel, StateModel } from './models.js';
import {
  DEFAULT_STATE,
  STAGE_KEYS,
  parseResults,
  parseStage,
  parseState,
  type Results,
  type Stage,
  type StageKey,
  type TournamentState,
} from './types.js';

/** image = backdrop still, video = backdrop loop, audio = ambient bed, click = UI tick. */
export const MEDIA_KINDS = ['image', 'video', 'audio', 'click'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
export type MediaMeta = { kind: MediaKind; contentType: string; size: number; updatedAt: string };

export type Store = {
  mode: 'mongo' | 'file';
  describe: string;
  getResults(): Promise<Results>;
  putStage(key: StageKey, stage: unknown): Promise<Stage>;
  getState(): Promise<TournamentState>;
  patchState(patch: unknown): Promise<TournamentState>;
  recordIntent(referrer: string): Promise<void>;
  countIntents(): Promise<number>;
  listMedia(): Promise<MediaMeta[]>;
  getMedia(kind: MediaKind): Promise<{ meta: MediaMeta; data: Buffer } | null>;
  putMedia(kind: MediaKind, contentType: string, data: Buffer): Promise<MediaMeta>;
  deleteMedia(kind: MediaKind): Promise<void>;
  close(): Promise<void>;
};

const resultsPath = () => path.join(env.dataDir, 'results.json');
const statePath = () => path.join(env.dataDir, 'state.json');
const intentsPath = () => path.join(env.dataDir, 'intents.jsonl');
const mediaDir = () => path.join(env.dataDir, 'media');
/** The bytes and their content type are stored side by side, so the extension
 *  of the uploaded file never has to be trusted or guessed. */
const mediaBin = (kind: MediaKind) => path.join(mediaDir(), `${kind}.bin`);
const mediaMeta = (kind: MediaKind) => path.join(mediaDir(), `${kind}.json`);

async function readJson(file: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Write to a temp file and rename, so a crash mid-write cannot shred results.json. */
async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, file);
}

/* ────────────────────────────────────────────────────────────── file store ── */
/** No database needed. results.json is re-read on every request, so a hand edit
 *  shows up on the next refresh without restarting anything. */
function createFileStore(): Store {
  return {
    mode: 'file',
    describe: `JSON files in ${env.dataDir}`,

    async getResults() {
      return parseResults(await readJson(resultsPath()));
    },

    async putStage(key, stage) {
      const results = parseResults(await readJson(resultsPath()));
      results.stages[key] = parseStage(stage, results.stages[key].label);
      results.updatedAt = new Date().toISOString();
      await writeJson(resultsPath(), results);
      return results.stages[key];
    },

    async getState() {
      const stored = await readJson(statePath());
      return stored ? parseState(stored, DEFAULT_STATE) : DEFAULT_STATE;
    },

    async patchState(patch) {
      const current = await this.getState();
      const next = parseState({ ...current, ...(patch as object) }, current);
      await writeJson(statePath(), next);
      return next;
    },

    async recordIntent(referrer) {
      const line = `${JSON.stringify({ at: new Date().toISOString(), referrer })}\n`;
      await fs.mkdir(env.dataDir, { recursive: true });
      await fs.appendFile(intentsPath(), line, 'utf8');
    },

    async countIntents() {
      try {
        const raw = await fs.readFile(intentsPath(), 'utf8');
        return raw.split('\n').filter(Boolean).length;
      } catch {
        return 0;
      }
    },

    async listMedia() {
      const found: MediaMeta[] = [];
      for (const kind of MEDIA_KINDS) {
        const meta = (await readJson(mediaMeta(kind))) as MediaMeta | null;
        if (meta) found.push({ ...meta, kind });
      }
      return found;
    },

    async getMedia(kind) {
      const meta = (await readJson(mediaMeta(kind))) as MediaMeta | null;
      if (!meta) return null;
      try {
        return { meta: { ...meta, kind }, data: await fs.readFile(mediaBin(kind)) };
      } catch {
        return null;
      }
    },

    async putMedia(kind, contentType, data) {
      const meta: MediaMeta = { kind, contentType, size: data.length, updatedAt: new Date().toISOString() };
      await fs.mkdir(mediaDir(), { recursive: true });
      const tmp = `${mediaBin(kind)}.tmp`;
      await fs.writeFile(tmp, data);
      await fs.rename(tmp, mediaBin(kind));
      await writeJson(mediaMeta(kind), meta);
      return meta;
    },

    async deleteMedia(kind) {
      await fs.rm(mediaBin(kind), { force: true });
      await fs.rm(mediaMeta(kind), { force: true });
    },

    async close() {
      /* nothing to close */
    },
  };
}

/* ─────────────────────────────────────────────────────────── mongo store ── */
function createMongoStore(): Store {
  return {
    mode: 'mongo',
    describe: `MongoDB ${env.dbName}`,

    async getResults() {
      const docs = await StageModel.find().lean();
      const byKey = new Map(docs.map((d) => [d.key as StageKey, d]));
      const newest = docs.reduce<number>((acc, d) => Math.max(acc, new Date(d.updatedAt ?? 0).getTime()), 0);

      return parseResults({
        updatedAt: new Date(newest || Date.now()).toISOString(),
        stages: Object.fromEntries(STAGE_KEYS.map((key) => [key, byKey.get(key)])),
      });
    },

    async putStage(key, stage) {
      const clean = parseStage(stage, key);
      await StageModel.findOneAndUpdate({ key }, { ...clean, key }, { upsert: true, new: true });
      return clean;
    },

    async getState() {
      const doc = await StateModel.findById('state').lean();
      if (doc) return parseState(doc, DEFAULT_STATE);
      const created = await StateModel.create({ _id: 'state', ...DEFAULT_STATE });
      return parseState(created.toObject(), DEFAULT_STATE);
    },

    async patchState(patch) {
      const current = await this.getState();
      const next = parseState({ ...current, ...(patch as object) }, current);
      await StateModel.findByIdAndUpdate('state', next, { upsert: true });
      return next;
    },

    async recordIntent(referrer) {
      await IntentModel.create({ referrer });
    },

    async countIntents() {
      return IntentModel.countDocuments();
    },

    async listMedia() {
      const docs = await MediaModel.find({}, { data: 0 }).lean();
      return docs.map((d) => ({
        kind: d.kind as MediaKind,
        contentType: d.contentType,
        size: d.size,
        updatedAt: new Date(d.updatedAt ?? Date.now()).toISOString(),
      }));
    },

    async getMedia(kind) {
      const doc = await MediaModel.findOne({ kind }).lean();
      if (!doc) return null;
      return {
        meta: {
          kind,
          contentType: doc.contentType,
          size: doc.size,
          updatedAt: new Date(doc.updatedAt ?? Date.now()).toISOString(),
        },
        data: Buffer.from(doc.data as unknown as Buffer),
      };
    },

    async putMedia(kind, contentType, data) {
      const doc = await MediaModel.findOneAndUpdate(
        { kind },
        { kind, contentType, size: data.length, data },
        { upsert: true, new: true },
      ).lean();
      return {
        kind,
        contentType,
        size: data.length,
        updatedAt: new Date(doc?.updatedAt ?? Date.now()).toISOString(),
      };
    },

    async deleteMedia(kind) {
      await MediaModel.deleteOne({ kind });
    },

    async close() {
      await mongoose.disconnect();
    },
  };
}

/** First run against an empty database: import whatever is in data/results.json. */
async function seedIfEmpty(): Promise<void> {
  if ((await StageModel.estimatedDocumentCount()) > 0) return;
  const results = parseResults(await readJson(resultsPath()));
  await StageModel.insertMany(STAGE_KEYS.map((key) => ({ key, ...results.stages[key] })));
  console.log('[db] empty database — imported data/results.json');
}

/**
 * Mongo when MONGODB_URI is set and reachable, JSON files otherwise. A database
 * that will not connect must never take the site down: standings are the point.
 */
export async function createStore(): Promise<Store> {
  if (!env.mongoUri) {
    console.log('[db] MONGODB_URI not set — running on the JSON file store');
    return createFileStore();
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { dbName: env.dbName, serverSelectionTimeoutMS: 5000 });
    await seedIfEmpty();
    console.log(`[db] connected to MongoDB (${env.dbName})`);
    return createMongoStore();
  } catch (error) {
    console.warn(`[db] MongoDB unreachable (${(error as Error).message}) — falling back to JSON files`);
    await mongoose.disconnect().catch(() => undefined);
    return createFileStore();
  }
}
