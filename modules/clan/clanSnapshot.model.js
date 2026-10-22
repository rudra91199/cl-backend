import mongoose from 'mongoose';

const clanSnapshotSchema = new mongoose.Schema({
  tag: { type: String, required: true, index: true },
  date: { type: String, required: true }, // e.g., "2026-10-11"
  
  // Core Clan Identity & Stats
  name: String,
  description: String,
  type: String,
  level: Number,
  points: Number,
  builderBasePoints: Number,
  capitalPoints: Number,
  
  // War Metrics
  warWins: Number,
  warTies: Number,
  warLosses: Number,
  warWinStreak: Number,
  memberCount: Number,
  
  // FIXED: Store the Supercell badge URLs
  badgeUrls: mongoose.Schema.Types.Mixed,
  
  // Complex Supercell Objects/Arrays (Stored exactly as received)
  labels: [{ type: mongoose.Schema.Types.Mixed }],
  clanCapital: mongoose.Schema.Types.Mixed,
  capitalLeague: mongoose.Schema.Types.Mixed,
  warLeague: mongoose.Schema.Types.Mixed,
  members: [{ type: mongoose.Schema.Types.Mixed }],
  
  createdAt: { type: Date, default: Date.now }
});

// Guarantees MongoDB only saves ONE snapshot per day, per clan.
clanSnapshotSchema.index({ tag: 1, date: 1 }, { unique: true });

export const ClanSnapshot = mongoose.model('ClanSnapshot', clanSnapshotSchema);