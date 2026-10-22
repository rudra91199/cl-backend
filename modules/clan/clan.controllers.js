import { clanService } from './clan.services.js';
import { ClanRegistry } from './clanRegistry.model.js';
import { formatTag } from '../../utils/clashClient.js';

export const getClan = async (req, res, next) => {
  try {
    const requestedTag = formatTag(req.params.tag);
    
    // Check if the clan is registered
    const clanRecord = await ClanRegistry.findOne({ tag: requestedTag });

    // Check if ANY of the user's linked villages is a Leader or Co-Leader in THIS specific clan
    const isLeaderInThisClan = req.user.linkedVillages.some(
      v => v.clanTag && formatTag(v.clanTag) === requestedTag && (v.role === 'leader' || v.role === 'coLeader')
    );

    if (!clanRecord || !clanRecord.isRegistered) {
      if (isLeaderInThisClan) {
        return res.json({ isRegistered: false, canRegister: true, clanTag: requestedTag }); 
      } else {
        return res.json({ 
          isRegistered: false, 
          canRegister: false, 
          message: "This clan is not registered yet. Please ask a Leader or Co-Leader of this clan to register it." 
        });
      }
    }

    const clanData = await clanService.getClanData(requestedTag);
    res.json({ isRegistered: true, data: clanData });

  } catch (error) {
    next(error);
  }
};

export const registerClan = async (req, res, next) => {
  try {
    // Allow frontend to specify which clanTag to register, or find a linked village where they are Leader/Co-Leader
    const targetClanTag = req.body.clanTag ? formatTag(req.body.clanTag) : null;

    const authorizedVillage = req.user.linkedVillages.find(v => {
      const isLeaderOrCo = v.role === 'leader' || v.role === 'coLeader';
      if (!v.clanTag || !isLeaderOrCo) return false;
      return targetClanTag ? formatTag(v.clanTag) === targetClanTag : true;
    });

    if (!authorizedVillage) {
      return res.status(403).json({ 
        success: false,
        message: "Only a verified Leader or Co-Leader of this clan can register it." 
      });
    }

    const clanTag = formatTag(authorizedVillage.clanTag);
    const clanData = await clanService.getClanData(clanTag);

    await ClanRegistry.findOneAndUpdate(
      { tag: clanTag },
      { tag: clanTag, name: clanData.name, isRegistered: true },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, message: `${clanData.name} successfully registered!` });
  } catch (error) {
    next(error);
  }
};