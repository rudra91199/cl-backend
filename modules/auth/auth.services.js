import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "./user.model.js";
import { PlayerSnapshot } from "../player/player.model.js";
import { clashClient, formatTag } from "../../utils/clashClient.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { buildingService } from "../building/building.services.js";

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Replace with your Cloudinary URL(s):
const CLASHLAB_LOGO_URL =
  process.env.CLASHLAB_LOGO_URL ||
  "https://res.cloudinary.com/daqhrz2gr/image/upload/v1792704747/CL1MobileEmail_bynb5d.png";

// Optional: If you uploaded CLText.webp separately to Cloudinary, put its URL here.
// If your CLASHLAB_LOGO_URL already includes the full logo + text (like CL1.webp), set this to ''
const CLASHLAB_TEXT_URL =
  process.env.CLASHLAB_TEXT_URL ||
  "https://res.cloudinary.com/daqhrz2gr/image/upload/v1792704747/CLTextEmail_slnype.png";

const clashLabEmailTemplate = (title, bodyText, buttonText, buttonUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @font-face {
      font-family: 'Clash';
      src: url('https://clash-lab.netlify.app/fonts/Clash_Bold.otf') format('opentype');
      font-weight: bold;
      font-style: normal;
    }
    .clash-font {
      font-family: 'Clash', 'Arial Black', Impact, 'Segoe UI', sans-serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030305; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #030305; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Dark Glassmorphic / Skeuomorphic Card matching Login UI -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; background: linear-gradient(180deg, #141620 0%, #07080d 100%); border: 1px solid #1e2230; border-radius: 28px; padding: 36px 28px; box-shadow: 0 25px 70px rgba(0,0,0,0.95);">
          
          <!-- Centered Cloudinary Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.07);">
              <img
                src="${CLASHLAB_LOGO_URL}"
                alt="ClashLab"
                width="72"
                style="display: block; margin: 0 auto; height: auto; border: 0; outline: none;"
              />
              ${
                CLASHLAB_TEXT_URL
                  ? `<img
                      src="${CLASHLAB_TEXT_URL}"
                      alt="CLASH LAB"
                      width="165"
                      style="display: block; margin: 10px auto 0 auto; height: auto; border: 0; outline: none;"
                    />`
                  : ""
              }
              <p class="clash-font" style="margin: 10px 0 0 0; font-family: 'Clash', 'Arial Black', sans-serif; font-size: 10px; font-weight: 800; color: #67e8f9; text-transform: uppercase; letter-spacing: 3.5px;">
                CLASH INTEL, REFINED
              </p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-top: 26px; padding-bottom: 14px;">
              <h2 class="clash-font" style="margin: 0; font-family: 'Clash', 'Arial Black', sans-serif; font-size: 18px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                ${title}
              </h2>
            </td>
          </tr>

          <!-- Recessed Inner Message Pod -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="background-color: #050609; border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 18px 20px;">
                <p style="margin: 0; font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; font-size: 13px; line-height: 1.65; color: #d1d5db;">
                  ${bodyText}
                </p>
              </div>
            </td>
          </tr>

          <!-- Tactile Skeuomorphic CTA Button (Matches Launch ClashLab Button) -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a
                href="${buttonUrl}"
                class="clash-font"
                style="display: inline-block; width: 85%; max-width: 300px; background: linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%); color: #000000; font-family: 'Clash', 'Arial Black', sans-serif; font-weight: 900; font-size: 12px; text-transform: uppercase; text-decoration: none; padding: 15px 24px; border-radius: 16px; letter-spacing: 2.5px; box-shadow: 0 8px 20px rgba(0,0,0,0.85);"
              >
                ${buttonText} &rsaquo;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="margin: 0; font-family: monospace; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5;">
                If you did not initiate this request, safely ignore this message.<br />
                Dispatched by ClashLab Command Terminal
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// 1. Register Human Account (Updated Email)
const registerUser = async (email, password) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new Error("Email is already registered.");

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const newUser = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    verificationToken,
  });

  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;

  await sendEmail({
    email: newUser.email,
    subject: "ClashLab: Verify Your Identity",
    message: `Verify your ClashLab account here: ${verifyUrl}`,
    html: clashLabEmailTemplate(
      "Identity Verification Required",
      "Welcome to ClashLab. To finalize your account creation and gain access to the unified command terminal, please verify your email address.",
      "Verify Email Address",
      verifyUrl,
    ),
  });

  return {
    message:
      "ClashLab ID created! Please check your email to verify your identity.",
  };
};

// 2. Verify Email Token
const verifyEmailToken = async (token) => {
  const user = await User.findOne({ verificationToken: token });
  if (!user) throw new Error("Invalid or expired verification token.");

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  await user.save();

  const jwtToken = signToken(user._id);
  return {
    message: "Email verified successfully!",
    token: jwtToken,
    user: { email: user.email, linkedVillages: user.linkedVillages },
  };
};

// 3. Login with Email & Password
const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("Account not found.");

  if (!user.isEmailVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials.");

  const token = signToken(user._id);
  return {
    message: "Login successful!",
    token,
    user: {
      email: user.email,
      linkedVillages: user.linkedVillages,
    },
  };
};

// 4. Forgot Password (Updated Email)
const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with that email.");

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  await sendEmail({
    email: user.email,
    subject: "ClashLab: Password Reset Request",
    message: `Reset your password here: ${resetUrl}`,
    html: clashLabEmailTemplate(
      "Account Recovery",
      "We received a request to reset the security key for your ClashLab ID. This link will expire in 1 hour.",
      "Set New Password",
      resetUrl,
    ),
  });

  return { message: "Recovery link dispatched to your email." };
};

// 5. Reset Password
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) throw new Error("Password reset token is invalid or has expired.");

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: "Password has been updated! You can now log in." };
};

// 6. Link a Clash of Clans Village via In-Game JSON Export
const linkVillage = async (userId, rawJsonInput) => {
  const payload =
    typeof rawJsonInput === "string" ? JSON.parse(rawJsonInput) : rawJsonInput;

  if (!payload?.tag || !Array.isArray(payload?.buildings)) {
    throw new Error(
      "Invalid Village JSON. Please copy the full data export from Clash of Clans settings.",
    );
  }

  const pTag = formatTag(payload.tag);

  // 1. Fetch live player profile from Supercell
  const player = await clashClient.getPlayer(pTag);
  const clanTag = player.clan ? player.clan.tag : null;
  const clanName = player.clan ? player.clan.name : null;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  // 2. Link or update village in User profile
  const existingIndex = user.linkedVillages.findIndex(
    (v) => v.tag === player.tag,
  );
  const villagePayload = {
    tag: player.tag,
    name: player.name,
    townHallLevel: player.townHallLevel,
    clanTag,
    clanName,
    role: player.role || "member",
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
  const existingSnapshot = await PlayerSnapshot.findOne({
    playerTag: player.tag,
  });
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
      capitalContribution: player.clanCapitalContributions || 0,
    });
  }

  return {
    message: `${player.name} (${player.tag}) verified and buildings synced!`,
    linkedVillages: user.linkedVillages,
  };
};

// 7. Unlink a Village
const unlinkVillage = async (userId, playerTag) => {
  const pTag = formatTag(playerTag);
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  user.linkedVillages = user.linkedVillages.filter((v) => v.tag !== pTag);
  await user.save();

  return {
    message: "Village unlinked.",
    linkedVillages: user.linkedVillages,
  };
};

// 8. Fetch Current Logged-In User Profile & Villages
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found.");
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
  getMe,
};
