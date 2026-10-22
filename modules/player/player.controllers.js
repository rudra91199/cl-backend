import { playerService } from './player.services.js';

export const getPlayer = async (req, res) => {
  try {
    const cleanData = await playerService.getAndSavePlayer(req.params.tag);
    res.json(cleanData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process player' });
  }
};

