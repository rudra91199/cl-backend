import { cwlService } from './cwl.services.js';
import { ClanRegistry } from '../clan/clanRegistry.model.js';
import { formatTag } from '../../utils/clashClient.js';

export const getCwl = async (req, res, next) => {
  try {
    const requestedTag = formatTag(req.params.tag);

    // 1. Multi-Village Anti-Spying Check: Does the user have ANY linked village in this clan?
    const belongsToClan = req.user.linkedVillages.some(
      v => v.clanTag && formatTag(v.clanTag) === requestedTag
    );

    if (!belongsToClan) {
      return res.status(403).json({
        success: false,
        message: "Access denied. None of your linked villages belong to this clan."
      });
    }

    // 2. The Lock Check: Ensure the clan is officially registered
    const clanRecord = await ClanRegistry.findOne({ tag: requestedTag, isRegistered: true });
    
    if (!clanRecord) {
      return res.status(403).json({ 
        success: false,
        message: "This clan is not registered yet. Please ask a Leader or Co-Leader to unlock it." 
      });
    }

    // 3. Fetch the CWL data
    const cwlData = await cwlService.getCwlData(requestedTag);
    
    res.status(200).json({
      success: true,
      data: cwlData
    });
  } catch (error) {
    next(error);
  }
};