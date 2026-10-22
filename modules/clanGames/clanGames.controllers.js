// src/modules/clanGames/clanGames.controllers.js
import { clanGamesService } from './clanGames.service.js';

export const getClanGames = async (req, res) => {
  try {
    const { tag } = req.params;
    const forceReset = req.query.reset === 'true';
    const data = await clanGamesService.syncClanGames(tag, forceReset);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync Clan Games data.'
    });
  }
};