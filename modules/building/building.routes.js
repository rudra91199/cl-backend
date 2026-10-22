import { Router } from "express";
import { uploadLayout, getLayout } from "./building.controllers.js";
import { verifyUser } from "../../middlewares/verifyToken.js";

const router = Router();

router.get("/:tag", verifyUser, getLayout);
router.post("/upload", verifyUser, uploadLayout);

export const BuildingRoutes = router;
