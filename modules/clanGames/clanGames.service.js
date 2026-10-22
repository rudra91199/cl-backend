import { clashClient, formatTag } from '../../utils/clashClient.js';
import { ClanGames } from './clanGames.model.js';

const extractGamesChampionScore = (playerObj) => {
  if (!playerObj || !Array.isArray(playerObj.achievements)) return 0;
  const ach = playerObj.achievements.find((a) => a.name === 'Games Champion');
  return Number(ach?.value || 0);
};

const getClanGamesStatus = (now = new Date()) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startTime = new Date(Date.UTC(year, month, 22, 8, 0, 0));
  const endTime = new Date(Date.UTC(year, month, 28, 8, 0, 0));

  let state = 'upcoming';
  if (now >= startTime && now <= endTime) {
    state = 'active';
  } else if (now > endTime) {
    state = 'ended';
  }

  return {
    season: `${year}-${String(month + 1).padStart(2, '0')}`,
    state,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    maxClanTierPoints: 50000,
    maxPlayerPoints: 4000
  };
};

const syncClanGames = async (rawTag, forceResetBaseline = false) => {
  const clanTag = formatTag(rawTag);
  const meta = getClanGamesStatus();

  const existingRecord = await ClanGames.findOne({ tag: clanTag, season: meta.season });
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Serve cached snapshot if synced within the last 5 minutes and not forcing a reset
  if (!forceResetBaseline && existingRecord && existingRecord.lastUpdated > fiveMinutesAgo) {
    return {
      ...meta,
      clanTag,
      totalPoints: existingRecord.totalPoints || 0,
      lastUpdated: existingRecord.lastUpdated,
      members: existingRecord.members || []
    };
  }

  const rawClan = await clashClient.getClan(clanTag);
  const clanMembers = rawClan.members || [];

  // Map existing baseline points per member tag
  const baselineMap = new Map();
  if (!forceResetBaseline && existingRecord && Array.isArray(existingRecord.members)) {
    existingRecord.members.forEach((m) => {
      if (m.tag && typeof m.baselinePoints === 'number') {
        baselineMap.set(m.tag, m.baselinePoints);
      }
    });
  }

  // Fetch all member profiles in parallel to read 'Games Champion' achievement
  const playerProfiles = await Promise.all(
    clanMembers.map((m) => clashClient.getPlayer(m.tag).catch(() => null))
  );

  const syncedMembers = clanMembers.map((m, idx) => {
    const profile = playerProfiles[idx];
    const lifetimeScore = profile ? extractGamesChampionScore(profile) : 0;

    const baseline = baselineMap.has(m.tag) ? baselineMap.get(m.tag) : lifetimeScore;
    const safeBaseline = Math.min(baseline, lifetimeScore);
    const pointsEarned = Math.max(0, lifetimeScore - safeBaseline);

    return {
      tag: m.tag,
      name: m.name,
      role: m.role || 'member',
      townHallLevel: m.townHallLevel || profile?.townHallLevel || 1,
      baselinePoints: safeBaseline,
      currentPoints: lifetimeScore,
      pointsEarned
    };
  });

  // Sort by highest points earned first, then by lifetime Clan Games score
  syncedMembers.sort(
    (a, b) => b.pointsEarned - a.pointsEarned || b.currentPoints - a.currentPoints
  );

  const totalPoints = syncedMembers.reduce((sum, m) => sum + m.pointsEarned, 0);

  const updatedDoc = await ClanGames.findOneAndUpdate(
    { tag: clanTag, season: meta.season },
    {
      $set: {
        tag: clanTag,
        season: meta.season,
        totalPoints,
        members: syncedMembers,
        lastUpdated: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  return {
    ...meta,
    clanTag,
    clanName: rawClan.name,
    badgeUrl: rawClan.badge?.url,
    totalPoints: updatedDoc.totalPoints,
    lastUpdated: updatedDoc.lastUpdated,
    members: updatedDoc.members
  };
};

export const clanGamesService = { syncClanGames };