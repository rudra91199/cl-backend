// src/modules/war/war.controllers.js
import { warService } from './war.service.js';

export const getClanWar = async (req, res) => {
  try {
    const { tag } = req.params;
    const data = await warService.getClanWarData(tag);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Clan War data.'
    });
  }
};

export const getPlayerWarAttacks = async (req, res) => {
  try {
    const { tag } = req.params;
    const data = await warService.getPlayerWarHistory(tag);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Player War history.'
    });
  }
};