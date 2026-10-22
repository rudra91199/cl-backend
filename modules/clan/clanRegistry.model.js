import mongoose from 'mongoose';

const clanRegistrySchema = new mongoose.Schema({
  tag: { type: String, required: true, unique: true }, // The 'unique: true' prevents duplicates!
  name: { type: String, required: true },
  isRegistered: { type: Boolean, default: false }
});

export const ClanRegistry = mongoose.model('ClanRegistry', clanRegistrySchema);