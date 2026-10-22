import mongoose from 'mongoose';

const participantAttackSchema = new mongoose.Schema(
  {
    order: Number,
    attackerTag: String,
    defenderTag: String,
    defenderName: String,
    defenderTownHall: Number,
    defenderMapPosition: Number,
    stars: Number,
    destructionPercentage: Number,
    duration: Number
  },
  { _id: false }
);

const warParticipantSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, index: true },
    name: String,
    townHallLevel: Number,
    mapPosition: Number,
    attacksAllowed: Number,
    attacksUsed: Number,
    totalStars: Number,
    totalDestruction: Number,
    attacks: [participantAttackSchema],
    bestOpponentAttack: {
      attackerTag: String,
      attackerName: String,
      stars: Number,
      destructionPercentage: Number,
      duration: Number
    }
  },
  { _id: false }
);

const warSnapshotSchema = new mongoose.Schema({
  // Unique composite identifier: `${clanTag}_${startTime}`
  warId: { type: String, required: true, unique: true, index: true },
  clanTag: { type: String, required: true, index: true },
  opponentTag: { type: String, required: true, index: true },

  // 'classic' for regular Clan Wars, 'cwl' for Clan War League rounds
  warType: { type: String, enum: ['classic', 'cwl'], default: 'classic', index: true },
  season: { type: String, index: true }, // e.g., "2026-10"
  cwlRound: { type: Number, default: null },

  state: { type: String, required: true }, // 'preparation' | 'inWar' | 'warEnded'
  result: { type: String, default: 'ongoing' }, // 'ongoing' | 'win' | 'lose' | 'tie'
  teamSize: { type: Number, default: 15 },
  attacksPerMember: { type: Number, default: 2 },

  preparationStartTime: String,
  startTime: { type: String, required: true, index: true },
  endTime: String,

  ourClan: { type: mongoose.Schema.Types.Mixed },
  enemyClan: { type: mongoose.Schema.Types.Mixed },

  // Indexed participant array for instant Player Terminal War History queries
  participants: [warParticipantSchema],

  lastUpdated: { type: Date, default: Date.now }
});

export const WarSnapshot = mongoose.model('WarSnapshot', warSnapshotSchema);