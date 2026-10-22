import { capitalService } from './capital.services.js';
import { formatTag } from '../../utils/clashClient.js';

export const getLiveRaid = async (req, res, next) => {
  try {
    const rawTag = req.params.tag || req.query.tag || req.user.linkedVillages[0]?.clanTag;
    if (!rawTag) {
      return res.status(400).json({ success: false, message: 'No clan tag found for this village.' });
    }

    const clanTag = formatTag(rawTag);
    const raidData = await capitalService.getLiveRaid(clanTag);
    
    res.status(200).json({ success: true, data: raidData });
  } catch (error) {
    next(error);
  }
};