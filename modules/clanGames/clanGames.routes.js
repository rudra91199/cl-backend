// src/modules/clanGames/clanGames.routes.js
import { Router } from "express";
import { getClanGames } from "./clanGames.controllers.js";
import { verifyUser } from "../../middlewares/verifyToken.js";

const router = Router();

router.get("/:tag", verifyUser, getClanGames);

export const ClanGamesRoutes = router;
