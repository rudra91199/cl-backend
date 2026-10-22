import { clashClient, formatTag } from '../../utils/clashClient.js';
import { WarSnapshot } from './war.model.js';

const getDestruction = (clanObj) =>
  Number(clanObj?.destructionPercentage ?? clanObj?.destruction ?? 0);

const determineWarResult = (state, ourClan, enemyClan) => {
  if (state !== 'warEnded') return 'ongoing';
  const ourStars = Number(ourClan?.stars || 0);
  const enemyStars = Number(enemyClan?.stars || 0);
  if (ourStars > enemyStars) return 'win';
  if (ourStars < enemyStars) return 'lose';

  const ourDest = getDestruction(ourClan);
  const enemyDest = getDestruction(enemyClan);
  if (ourDest > enemyDest) return 'win';
  if (ourDest < enemyDest) return 'lose';
  return 'tie';
};

// Normalizes either a raw Supercell ClanWar or a CWL War and archives it in MongoDB
const archiveSingleWar = async (
  rawClanTag,
  warData,
  options = { warType: 'classic', season: null, cwlRound: null }
) => {
  if (!warData || warData.state === 'notInWar' || !warData.startTime) return null;
  const clanTag = formatTag(rawClanTag);

  // Support both standard Supercell war ({ clan, opponent }) and pre-mapped CWL war ({ ourClan, enemyClan })
  let ourClan = warData.ourClan;
  let enemyClan = warData.enemyClan;

  if (!ourClan || !enemyClan) {
    if (warData.clan?.tag === clanTag) {
      ourClan = warData.clan;
      enemyClan = warData.opponent;
    } else if (warData.opponent?.tag === clanTag) {
      ourClan = warData.opponent;
      enemyClan = warData.clan;
    } else {
      ourClan = warData.clan;
      enemyClan = warData.opponent;
    }
  }

  if (!ourClan || !enemyClan) return null;

  const warType = options.warType || 'classic';
  const attacksPerMember =
    warData.attacksPerMember || (warType === 'cwl' ? 1 : 2);
  const teamSize =
    warData.teamSize || ourClan.members?.length || 15;

  // Build map of enemy members for instant defender lookup
  const enemyMemberMap = new Map();
  (enemyClan.members || []).forEach((em) => {
    enemyMemberMap.set(em.tag, em);
  });

  // Sort our members by mapPosition
  const sortedOurMembers = [...(ourClan.members || [])].sort(
    (a, b) => (a.mapPosition || 99) - (b.mapPosition || 99)
  );

  const participants = sortedOurMembers.map((member) => {
    const rawAttacks = Array.isArray(member.attacks) ? member.attacks : [];
    const mappedAttacks = rawAttacks.map((att) => {
      const defender = enemyMemberMap.get(att.defenderTag);
      const dest = Number(att.destructionPercentage ?? att.destruction ?? 0);
      return {
        order: att.order || 0,
        attackerTag: member.tag,
        defenderTag: att.defenderTag,
        defenderName: defender?.name || 'Unknown Chief',
        defenderTownHall: defender?.townhallLevel || defender?.townHallLevel || 1,
        defenderMapPosition: defender?.mapPosition || null,
        stars: Number(att.stars || 0),
        destructionPercentage: dest,
        duration: Number(att.duration || 0)
      };
    });

    const totalStars = mappedAttacks.reduce((sum, a) => sum + a.stars, 0);
    const totalDestruction = mappedAttacks.reduce(
      (sum, a) => sum + a.destructionPercentage,
      0
    );

    const bestDef = member.bestOpponentAttack;
    return {
      tag: member.tag,
      name: member.name,
      townHallLevel: member.townhallLevel || member.townHallLevel || 1,
      mapPosition: member.mapPosition || 0,
      attacksAllowed: attacksPerMember,
      attacksUsed: mappedAttacks.length,
      totalStars,
      totalDestruction,
      attacks: mappedAttacks,
      bestOpponentAttack: bestDef
        ? {
            attackerTag: bestDef.attackerTag,
            attackerName:
              enemyMemberMap.get(bestDef.attackerTag)?.name || 'Enemy Chief',
            stars: Number(bestDef.stars || 0),
            destructionPercentage: Number(
              bestDef.destructionPercentage ?? bestDef.destruction ?? 0
            ),
            duration: Number(bestDef.duration || 0)
          }
        : null
    };
  });

  const season =
    options.season || new Date().toISOString().slice(0, 7);
  const warId = `${clanTag}_${warData.startTime}`;
  const result = determineWarResult(warData.state, ourClan, enemyClan);

  return await WarSnapshot.findOneAndUpdate(
    { warId },
    {
      $set: {
        warId,
        clanTag,
        opponentTag: enemyClan.tag || 'UNKNOWN',
        warType,
        season,
        cwlRound: options.cwlRound ?? null,
        state: warData.state,
        result,
        teamSize,
        attacksPerMember,
        preparationStartTime: warData.preparationStartTime || null,
        startTime: String(warData.startTime),
        endTime: String(warData.endTime || ''),
        ourClan: {
          tag: ourClan.tag,
          name: ourClan.name,
          level: ourClan.level || ourClan.clanLevel || 1,
          badgeUrl:
            ourClan.badge?.url ||
            ourClan.badgeUrls?.medium ||
            ourClan.badgeUrls?.small ||
            null,
          stars: Number(ourClan.stars || 0),
          destructionPercentage: getDestruction(ourClan),
          attacks: Number(ourClan.attacks || 0),
          members: sortedOurMembers
        },
        enemyClan: {
          tag: enemyClan.tag,
          name: enemyClan.name,
          level: enemyClan.level || enemyClan.clanLevel || 1,
          badgeUrl:
            enemyClan.badge?.url ||
            enemyClan.badgeUrls?.medium ||
            enemyClan.badgeUrls?.small ||
            null,
          stars: Number(enemyClan.stars || 0),
          destructionPercentage: getDestruction(enemyClan),
          attacks: Number(enemyClan.attacks || 0),
          members: enemyClan.members || []
        },
        participants,
        lastUpdated: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
};

// Called by cwl.service.js so every CWL round is ALSO stored in WarSnapshot
const archiveCwlWars = async (clanTag, season, mappedWars = []) => {
  if (!Array.isArray(mappedWars) || mappedWars.length === 0) return;
  await Promise.all(
    mappedWars.map((war, idx) =>
      archiveSingleWar(clanTag, war, {
        warType: 'cwl',
        season,
        cwlRound: idx + 1
      }).catch(() => null)
    )
  );
};

// Fetches live Classic War from Supercell, archives it, and returns live war + archived history
const getClanWarData = async (rawTag) => {
  const clanTag = formatTag(rawTag);
  let liveWarDoc = null;
  let isInWar = false;

  try {
    const rawLiveWar = await clashClient.getCurrentWar(clanTag);
    if (rawLiveWar && rawLiveWar.state && rawLiveWar.state !== 'notInWar') {
      isInWar = true;
      liveWarDoc = await archiveSingleWar(clanTag, rawLiveWar, {
        warType: 'classic'
      });
    }
  } catch (error) {
    console.log('Clan War log private or currently in CWL. Serving archived wars.');
  }

  // Fetch archived Classic Wars & CWL Wars for this clan
  const warHistory = await WarSnapshot.find({ clanTag })
    .sort({ startTime: -1 })
    .limit(25)
    .lean();

  // If Supercell says 'notInWar' right now, check if there is an ongoing CWL war in DB
  if (!liveWarDoc && warHistory.length > 0) {
    const ongoingInDb = warHistory.find(
      (w) => w.state === 'inWar' || w.state === 'preparation'
    );
    if (ongoingInDb) {
      isInWar = true;
      liveWarDoc = ongoingInDb;
    }
  }

  return {
    isInWar,
    activeWar: liveWarDoc || warHistory[0] || null,
    classicWars: warHistory.filter((w) => w.warType === 'classic'),
    allArchivedWars: warHistory
  };
};

// Fetches a specific player's war attack history across both Classic Wars and CWL
const getPlayerWarHistory = async (rawPlayerTag, limit = 15) => {
  const playerTag = formatTag(rawPlayerTag);

  const wars = await WarSnapshot.find({ 'participants.tag': playerTag })
    .sort({ startTime: -1 })
    .limit(limit)
    .lean();

  let totalAttacksUsed = 0;
  let totalAttacksAllowed = 0;
  let totalStars = 0;
  let totalDestruction = 0;
  let threeStarHits = 0;

  const recentWars = wars
    .map((w) => {
      const p = (w.participants || []).find((part) => part.tag === playerTag);
      if (!p) return null;

      totalAttacksUsed += p.attacksUsed || 0;
      totalAttacksAllowed += p.attacksAllowed || 0;
      totalStars += p.totalStars || 0;
      totalDestruction += p.totalDestruction || 0;
      (p.attacks || []).forEach((a) => {
        if (a.stars === 3) threeStarHits += 1;
      });

      return {
        warId: w.warId,
        warType: w.warType,
        season: w.season,
        cwlRound: w.cwlRound,
        state: w.state,
        result: w.result,
        startTime: w.startTime,
        endTime: w.endTime,
        ourClan: {
          tag: w.ourClan?.tag,
          name: w.ourClan?.name,
          badgeUrl: w.ourClan?.badgeUrl,
          stars: w.ourClan?.stars,
          destructionPercentage: w.ourClan?.destructionPercentage
        },
        enemyClan: {
          tag: w.enemyClan?.tag,
          name: w.enemyClan?.name,
          badgeUrl: w.enemyClan?.badgeUrl,
          stars: w.enemyClan?.stars,
          destructionPercentage: w.enemyClan?.destructionPercentage
        },
        playerPerformance: p
      };
    })
    .filter(Boolean);

  return {
    playerTag,
    summary: {
      warsTracked: recentWars.length,
      totalAttacksUsed,
      totalAttacksAllowed,
      missedAttacks: Math.max(0, totalAttacksAllowed - totalAttacksUsed),
      totalStars,
      threeStarHits,
      avgStarsPerAttack:
        totalAttacksUsed > 0
          ? Number((totalStars / totalAttacksUsed).toFixed(2))
          : 0,
      avgDestructionPerAttack:
        totalAttacksUsed > 0
          ? Number((totalDestruction / totalAttacksUsed).toFixed(1))
          : 0
    },
    recentWars
  };
};

export const warService = {
  archiveSingleWar,
  archiveCwlWars,
  getClanWarData,
  getPlayerWarHistory
};