import mongoose from 'mongoose';

const clanGamesSchema = new mongoose.Schema({
  tag: { type: String, required: true, index: true },
  season: { type: String, required: true, index: true }, // e.g., "2026-10"
  totalPoints: { type: Number, default: 0 },
  members: [
    {
      tag: String,
      name: String,
      role: String,
      townHallLevel: Number,
      baselinePoints: Number,
      currentPoints: Number,
      pointsEarned: Number
    }
  ],
  lastUpdated: { type: Date, default: Date.now },
  // Automatically deletes document 30 days after creation
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

clanGamesSchema.index({ tag: 1, season: 1 }, { unique: true });

export const ClanGames = mongoose.model('ClanGames', clanGamesSchema);