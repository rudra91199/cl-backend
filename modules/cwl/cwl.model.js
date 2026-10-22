import mongoose from 'mongoose';

const cwlSnapshotSchema = new mongoose.Schema({
  tag: { type: String, required: true, index: true }, // CRITICAL: Isolates CWL data per clan
  season: { type: String, required: true, index: true },
  state: { type: String, required: true },
  
  activeParticipants: [{
    tag: String,
    name: String,
    townhallLevel: Number
  }],

  standings: [{ type: mongoose.Schema.Types.Mixed }], 
  wars: [{ type: mongoose.Schema.Types.Mixed }],
  lastUpdated: { type: Date, default: Date.now }
});

cwlSnapshotSchema.index({ tag: 1, season: 1 }, { unique: true });

export const CwlSnapshot = mongoose.model('CwlSnapshot', cwlSnapshotSchema);