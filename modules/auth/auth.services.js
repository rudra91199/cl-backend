import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { PlayerSnapshot } from '../player/player.model.js';
import { clashClient, formatTag } from '../../utils/clashClient.js';
import { sendEmail } from '../../utils/sendEmail.js';
import { buildingService } from '../building/building.services.js';

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 1. Register Human Account
const registerUser = async (email, password) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new Error('Email is already registered.');

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const newUser = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    verificationToken
  });

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
  await sendEmail({
    email: newUser.email,
    subject: 'Monolith: Verify Your Identity',
    message: `Verify your Monolith account by clicking this link:\n\n${verifyUrl}`
  });

  return { message: 'Registration successful! Please check your email (or server console) to verify your account.' };
};

// 2. Verify Email Token
const verifyEmailToken = async (token) => {
  const user = await User.findOne({ verificationToken: token });
  if (!user) throw new Error('Invalid or expired verification token.');

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  await user.save();

  const jwtToken = signToken(user._id);
  return {
    message: 'Email verified successfully!',
    token: jwtToken,
    user: { email: user.email, linkedVillages: user.linkedVillages }
  };
};

// 3. Login with Email & Password
const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Account not found.');

  if (!user.isEmailVerified) {
    throw new Error('Please verify your email before logging in.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials.');

  const token = signToken(user._id);
  return {
    message: 'Login successful!',
    token,
    user: {
      email: user.email,
      linkedVillages: user.linkedVillages
    }
  };
};

// 4. Forgot Password
const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('No account found with that email.');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  await sendEmail({
    email: user.email,
    subject: 'Monolith: Password Reset Request',
    message: `Reset your password by clicking this link (valid for 1 hour):\n\n${resetUrl}`
  });

  return { message: 'Password reset link sent to your email.' };
};

// 5. Reset Password
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) throw new Error('Password reset token is invalid or has expired.');

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been updated! You can now log in.' };
};

// 6. Link a Clash of Clans Village via In-Game JSON Export
const linkVillage = async (userId, rawJsonInput) => {
  const payload = typeof rawJsonInput === 'string' ? JSON.parse(rawJsonInput) : rawJsonInput;

  if (!payload?.tag || !Array.isArray(payload?.buildings)) {
    throw new Error('Invalid Village JSON. Please copy the full data export from Clash of Clans settings.');
  }

  const pTag = formatTag(payload.tag);

  // 1. Fetch live player profile from Supercell
  const player = await clashClient.getPlayer(pTag);
  const clanTag = player.clan ? player.clan.tag : null;
  const clanName = player.clan ? player.clan.name : null;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  // 2. Link or update village in User profile
  const existingIndex = user.linkedVillages.findIndex(v => v.tag === player.tag);
  const villagePayload = {
    tag: player.tag,
    name: player.name,
    townHallLevel: player.townHallLevel,
    clanTag,
    clanName,
    role: player.role || 'member'
  };

  if (existingIndex > -1) {
    user.linkedVillages[existingIndex] = villagePayload;
  } else {
    user.linkedVillages.push(villagePayload);
  }
  await user.save();

  // 3. Save buildings & active builder timers immediately
  await buildingService.saveLayoutUpload(payload);

  // 4. Create initial player snapshot if none exists
  const existingSnapshot = await PlayerSnapshot.findOne({ playerTag: player.tag });
  if (!existingSnapshot) {
    await PlayerSnapshot.create({
      playerTag: player.tag,
      name: player.name,
      townHallLevel: player.townHallLevel,
      expLevel: player.expLevel,
      trophies: player.trophies,
      bestTrophies: player.bestTrophies,
      warStars: player.warStars,
      attackWins: player.attackWins,
      defenseWins: player.defenseWins,
      donations: player.donations,
      donationsReceived: player.donationsReceived,
      heroes: player.heroes,
      heroEquipment: player.heroEquipment,
      pets: player.pets,
      troops: player.troops,
      spells: player.spells,
      capitalContribution: player.clanCapitalContributions || 0
    });
  }

  return {
    message: `${player.name} (${player.tag}) verified and buildings synced!`,
    linkedVillages: user.linkedVillages
  };
};

// 7. Unlink a Village
const unlinkVillage = async (userId, playerTag) => {
  const pTag = formatTag(playerTag);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  user.linkedVillages = user.linkedVillages.filter(v => v.tag !== pTag);
  await user.save();

  return {
    message: 'Village unlinked.',
    linkedVillages: user.linkedVillages
  };
};

// 8. Fetch Current Logged-In User Profile & Villages
const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found.');
  return user;
};

export const authService = {
  registerUser,
  verifyEmailToken,
  loginUser,
  forgotPassword,
  resetPassword,
  linkVillage,
  unlinkVillage,
  getMe
};