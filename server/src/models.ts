import { Schema, model } from 'mongoose';
import type { StageKey, StageStatus } from './types.js';

const TeamSchema = new Schema(
  {
    tag: { type: String, required: true, uppercase: true, trim: true, maxlength: 6 },
    name: { type: String, required: true, trim: true, maxlength: 48 },
    matches: { type: Number, default: 0, min: 0 },
    placementPts: { type: Number, default: 0, min: 0 },
    killPts: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const StageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, enum: ['qualifiers_a', 'qualifiers_b', 'finals'] },
    label: { type: String, required: true },
    status: { type: String, enum: ['pending', 'live', 'complete'], default: 'pending' },
    note: { type: String, default: '' },
    teams: { type: [TeamSchema], default: [] },
  },
  { timestamps: true },
);

/** ISO strings, not Dates — they carry the +05:30 offset the site displays. */
const WindowSchema = new Schema(
  { startsAt: { type: String, default: '' }, endsAt: { type: String, default: '' } },
  { _id: false },
);

const StateSchema = new Schema(
  {
    _id: { type: String, default: 'state' },
    slots: {
      total: { type: Number, default: 256, min: 0 },
      filled: { type: Number, default: 0, min: 0 },
    },
    registrationOpen: { type: Boolean, default: true },
    /** Entry fee, the calendar and the prize pool — all editable from /admin. */
    event: {
      entryFee: { type: Number, default: 200, min: 0 },
      schedule: {
        registration: { type: WindowSchema, default: () => ({}) },
        qualifiers_a: { type: WindowSchema, default: () => ({}) },
        qualifiers_b: { type: WindowSchema, default: () => ({}) },
        finals: { type: WindowSchema, default: () => ({}) },
      },
      // Each prize is Mixed because it is either rupees or a label like
      // 'Certificate'. types.ts decides which on the way in.
      prizePool: {
        total: { type: Number, default: 0, min: 0 },
        first: { type: Schema.Types.Mixed, default: 0 },
        second: { type: Schema.Types.Mixed, default: 0 },
        third: { type: Schema.Types.Mixed, default: 0 },
        mvp: { type: Schema.Types.Mixed, default: '' },
        mostKills: { type: Schema.Types.Mixed, default: '' },
        participationNote: { type: String, default: '' },
      },
    },
  },
  { timestamps: true, _id: false },
);

/** One row per squad that opened the registration form. Nothing personal in it. */
const IntentSchema = new Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    referrer: { type: String, default: '' },
  },
  { versionKey: false },
);

export type StageDoc = {
  key: StageKey;
  label: string;
  status: StageStatus;
  note: string;
  teams: Array<{ tag: string; name: string; matches: number; placementPts: number; killPts: number }>;
  updatedAt?: Date;
};

/** Backdrop image/video and the two sounds, uploaded from /admin. Kept in the
 *  database (not on disk) because hosted disks are wiped on every restart. */
const MediaSchema = new Schema(
  {
    kind: { type: String, required: true, unique: true, enum: ['image', 'video', 'audio', 'click'] },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export const StageModel = model('Stage', StageSchema);
export const StateModel = model('State', StateSchema);
export const IntentModel = model('Intent', IntentSchema);
export const MediaModel = model('Media', MediaSchema);
