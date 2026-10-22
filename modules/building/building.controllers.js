import { buildingService } from "./building.services.js";

export const uploadLayout = async (req, res, next) => {
  try {
    const result = await buildingService.saveLayoutUpload(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLayout = async (req, res, next) => {
  try {
    const data = await buildingService.getLayout(req.params.tag);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
