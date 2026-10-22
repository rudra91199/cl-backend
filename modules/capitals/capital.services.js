import { clashClient, formatTag } from '../../utils/clashClient.js';

const getLiveRaid = async (tag) => {
  const clanTag = formatTag(tag);

  // Fetch ONLY the most recent raid weekend (no database needed!)
  const seasons = await clashClient.getCapitalRaidSeasons(clanTag, { limit: 1 });

  if (!seasons || seasons.length === 0) {
    return { isRaidActive: false, message: 'No raid data found.' };
  }

  const currentRaid = seasons[0];

  // Format the data cleanly for your React frontend
  return {
    isRaidActive: true,
    state: currentRaid.state, // Will say 'ongoing' during the weekend, or 'ended'
    startTime: currentRaid.startTime,
    endTime: currentRaid.endTime,
    totalLoot: currentRaid.capitalTotalLoot,
    totalAttacks: currentRaid.totalAttacks,
    members: currentRaid.members.map(member => ({
      tag: member.tag,
      name: member.name,
      attacks: member.attacks,
      attackLimit: member.attackLimit, // Easily shows who earned their 6th attack
      looted: member.capitalResourcesLooted
    })).sort((a, b) => b.looted - a.looted) // Sort by highest loot automatically
  };
};

export const capitalService = { getLiveRaid };