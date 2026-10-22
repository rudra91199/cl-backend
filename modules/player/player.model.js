import mongoose from 'mongoose';

const playerSnapshotSchema = new mongoose.Schema({
  playerTag: { type: String, required: true },
  name: { type: String, required: true },
  townHallLevel: { type: Number, required: true },
  
  expLevel: { type: Number, default: 0 },
  trophies: { type: Number, default: 0 },
  bestTrophies: { type: Number, default: 0 },
  warStars: { type: Number, default: 0 },
  attackWins: { type: Number, default: 0 },
  defenseWins: { type: Number, default: 0 },
  donations: { type: Number, default: 0 },
  donationsReceived: { type: Number, default: 0 },
  
  // THE FIX: Accept exact Supercell arrays without filtering or dropping data
  heroes: mongoose.Schema.Types.Mixed,
  heroEquipment: mongoose.Schema.Types.Mixed,
  pets: mongoose.Schema.Types.Mixed,
  troops: mongoose.Schema.Types.Mixed,
  spells: mongoose.Schema.Types.Mixed,
  
  buildings: [{ name: String, level: Number, count: Number }],
  capitalContribution: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const PlayerSnapshot = mongoose.model('PlayerSnapshot', playerSnapshotSchema);