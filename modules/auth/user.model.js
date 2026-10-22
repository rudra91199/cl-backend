import mongoose from 'mongoose';

const linkedVillageSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  name: { type: String, required: true },
  townHallLevel: { type: Number, required: true },
  clanTag: { type: String, default: null },
  clanName: { type: String, default: null },
  role: { type: String, default: 'member' } // 'member', 'admin' (Elder), 'coLeader', 'leader'
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  linkedVillages: [linkedVillageSchema]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);