import { clashClient, formatTag } from '../../utils/clashClient.js';
import { CwlSnapshot } from './cwl.model.js';
import { warService } from '../war/war.service.js';

const getCwlData = async (tag) => {
  const clanTag = formatTag(tag);
  let group = null;

  try {
    group = await clashClient.getClanWarLeagueGroup(clanTag);
  } catch (error) {
    console.log("Supercell CWL endpoint unavailable (League ended). Falling back to database.");
  }

  const currentSeason = new Date().toISOString().slice(0, 7);

  // 2. IF SUPERCELL IS BLIND: Serve the immortal data for THIS specific clanTag
  if (!group || group.state === 'notInWar') {
    const immortalRecord = await CwlSnapshot.findOne({ tag: clanTag, season: currentSeason });
    
    if (immortalRecord) {
      return {
        isInCwl: true,
        season: immortalRecord.season,
        state: immortalRecord.state,
        activeParticipants: immortalRecord.activeParticipants,
        standings: immortalRecord.standings,
        wars: immortalRecord.wars
      };
    }
    
    return { isInCwl: false, message: 'Clan is not currently in a CWL.' };
  }

  // 3. CHECK CACHE for THIS specific clanTag
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const existingDbRecord = await CwlSnapshot.findOne({ tag: clanTag, season: group.season });

  if (existingDbRecord && existingDbRecord.lastUpdated > tenMinutesAgo) {
    return {
      isInCwl: true,
      season: existingDbRecord.season,
      state: existingDbRecord.state,
      activeParticipants: existingDbRecord.activeParticipants,
      standings: existingDbRecord.standings,
      wars: existingDbRecord.wars
    };
  }

  const validWarTags = group.rounds
    .flatMap(round => round.warTags)
    .filter(warTag => warTag !== '#0');

  const allWars = await Promise.all(
    validWarTags.map(warTag => clashClient.getClanWarLeagueRound(warTag).catch(() => null))
  );

  const ourWars = allWars.filter(war => 
    war && (war.clan.tag === clanTag || war.opponent.tag === clanTag)
  );

  const mappedWars = ourWars.map(war => ({
    state: war.state, 
    startTime: war.startTime,
    endTime: war.endTime,
    ourClan: war.clan.tag === clanTag ? war.clan : war.opponent,
    enemyClan: war.clan.tag === clanTag ? war.opponent : war.clan,
  }));

  await warService.archiveCwlWars(clanTag, group.season, mappedWars);

  const activeParticipantsMap = new Map();
  mappedWars.forEach(war => {
    if (war.ourClan && war.ourClan.members) {
      war.ourClan.members.forEach(member => {
        if (!activeParticipantsMap.has(member.tag)) {
          activeParticipantsMap.set(member.tag, {
            tag: member.tag,
            name: member.name,
            townhallLevel: member.townhallLevel
          });
        }
      });
    }
  });
  const activeParticipants = Array.from(activeParticipantsMap.values());

  // 7. SAVE / UPDATE MONGODB with tag: clanTag
  await CwlSnapshot.findOneAndUpdate(
    { tag: clanTag, season: group.season },
    {
      $set: {
        tag: clanTag,
        season: group.season,
        state: group.state,
        activeParticipants,
        standings: group.clans,
        wars: mappedWars,
        lastUpdated: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  return {
    isInCwl: true,
    season: group.season,
    state: group.state,
    activeParticipants,
    standings: group.clans,
    wars: mappedWars
  };
};

export const cwlService = { getCwlData };