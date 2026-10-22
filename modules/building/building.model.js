import mongoose from 'mongoose';

const buildingSnapshotSchema = new mongoose.Schema({
  playerTag: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  // Unix timestamp exported directly in the JSON file
  uploadTimestamp: { 
    type: Number, 
    required: true 
  },
  
  // Home Village
// Home Village
  buildings: [{ type: mongoose.Schema.Types.Mixed }],
  traps: [{ type: mongoose.Schema.Types.Mixed }],
  heroes: [{ type: mongoose.Schema.Types.Mixed }], // <-- ADD THIS LINE
  helpers: [{ type: mongoose.Schema.Types.Mixed }],
  
  // Builder Base (Preserved for future expansion)
  buildings2: [{ type: mongoose.Schema.Types.Mixed }],
  traps2: [{ type: mongoose.Schema.Types.Mixed }],

  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const BuildingSnapshot = mongoose.model('BuildingSnapshot', buildingSnapshotSchema);