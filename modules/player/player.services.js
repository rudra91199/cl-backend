import { clashClient, formatTag } from '../../utils/clashClient.js';
import { PlayerSnapshot } from './player.model.js';
import { User } from '../auth/user.model.js';

const getAndSavePlayer = async (tag) => {
  const playerTag = formatTag(tag);
  const rawPlayer = await clashClient.getPlayer(playerTag);

  const snapshotData = {
    playerTag: rawPlayer.tag,
    name: rawPlayer.name,
    townHallLevel: rawPlayer.townHallLevel,
    expLevel: rawPlayer.expLevel,
    trophies: rawPlayer.trophies,
    bestTrophies: rawPlayer.bestTrophies,
    warStars: rawPlayer.warStars,
    attackWins: rawPlayer.attackWins,
    defenseWins: rawPlayer.defenseWins,
    donations: rawPlayer.donations,
    donationsReceived: rawPlayer.received,
    heroes: rawPlayer.heroes,
    heroEquipment: rawPlayer.heroEquipment,
    pets: rawPlayer.pets,
    troops: rawPlayer.troops,
    spells: rawPlayer.spells,
    capitalContribution: rawPlayer.clanCapitalContributions || 0,
    createdAt: new Date()
  };

  // Auto-sync latest TH level, Clan, and Role to any User who has linked this village
  await User.updateMany(
    { 'linkedVillages.tag': rawPlayer.tag },
    {
      $set: {
        'linkedVillages.$.name': rawPlayer.name,
        'linkedVillages.$.townHallLevel': rawPlayer.townHallLevel,
        'linkedVillages.$.clanTag': rawPlayer.clan ? rawPlayer.clan.tag : null,
        'linkedVillages.$.clanName': rawPlayer.clan ? rawPlayer.clan.name : null,
        'linkedVillages.$.role': rawPlayer.role || 'member'
      }
    }
  );

  // Rolling 2-Snapshot System
  const existingSnapshots = await PlayerSnapshot.find({ playerTag: rawPlayer.tag })
    .sort({ createdAt: -1 });

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  if (existingSnapshots.length > 0 && existingSnapshots[0].createdAt > tenMinutesAgo) {
    await PlayerSnapshot.findByIdAndUpdate(existingSnapshots[0]._id, { $set: snapshotData });
  } else {
    await PlayerSnapshot.create(snapshotData);

    const updatedSnapshots = await PlayerSnapshot.find({ playerTag: rawPlayer.tag })
      .sort({ createdAt: -1 })
      .select('_id');

    if (updatedSnapshots.length > 2) {
      const idsToDelete = updatedSnapshots.slice(2).map(s => s._id);
      await PlayerSnapshot.deleteMany({ _id: { $in: idsToDelete } });
    }
  }

  const finalSnapshots = await PlayerSnapshot.find({ playerTag: rawPlayer.tag })
    .sort({ createdAt: -1 });

  return {
    current: finalSnapshots[0] || snapshotData,
    previous: finalSnapshots[1] || null
  };
};

export const playerService = { getAndSavePlayer };