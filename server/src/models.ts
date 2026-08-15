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
    key: { type: String, required: true, unique: true, enum: ['qualifiers', 'semis', 'finals'] },
    label: { type: String, required: true },
    status: { type: String, enum: ['pending', 'live', 'complete'], default: 'pending' },
    note: { type: String, default: '' },
    teams: { type: [TeamSchema], default: [] },
  },
  { timestamps: true },
);

const StateSchema = new Schema(
  {
    _id: { type: String, default: 'state' },
    slots: {
      total: { type: Number, default: 256, min: 0 },
      filled: { type: Number, default: 0, min: 0 },
    },
    registrationOpen: { type: Boolean, default: true },
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
