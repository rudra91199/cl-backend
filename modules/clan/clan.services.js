import { clashClient, formatTag } from '../../utils/clashClient.js';
import { ClanSnapshot } from './clanSnapshot.model.js';

const getClanData = async (tag) => {
  const clanTag = formatTag(tag);
  
  // Fetch the full, rich object from Supercell
  const rawClan = await clashClient.getClan(clanTag);

  // Get today's date strictly formatted (e.g., "2026-10-11")
  const today = new Date().toISOString().split('T')[0];

  // Safely save or update TODAY's snapshot with ALL available data.
  await ClanSnapshot.findOneAndUpdate(
    { tag: clanTag, date: today },
    { 
      $set: {
        tag: clanTag, 
        date: today, 
        name: rawClan.name,
        description: rawClan.description,
        type: rawClan.type,
        level: rawClan.level,
        points: rawClan.points,
        builderBasePoints: rawClan.builderBasePoints,
        capitalPoints: rawClan.capitalPoints,
        warWins: rawClan.warWins,
        warTies: rawClan.warTies,
        warLosses: rawClan.warLosses,
        warWinStreak: rawClan.warWinStreak,
        memberCount: rawClan.memberCount,

        // FIXED: Inject the badge URLs into the database record
        badgeUrls: rawClan.badge,

        labels: rawClan.labels,
        clanCapital: rawClan.clanCapital,
        capitalLeague: rawClan.capitalLeague,
        warLeague: rawClan.warLeague,
        
        // Pass the ENTIRE members array exactly as Supercell provides it
        members: rawClan.members
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

// Update inside src/modules/clan/clan.service.js (right after ClanSnapshot.findOneAndUpdate):
  const allClanSnapshots = await ClanSnapshot.find({ tag: clanTag })
    .sort({ date: -1, createdAt: -1 })
    .select('_id');

  if (allClanSnapshots.length > 2) {
    const oldIds = allClanSnapshots.slice(2).map((s) => s._id);
    await ClanSnapshot.deleteMany({ _id: { $in: oldIds } });
  }

  return rawClan;

};

export const clanService = { getClanData };