import { Router } from "express";
import { PlayerRoutes } from "./modules/player/player.routes.js";
import { ClanRoutes } from "./modules/clan/clan.routes.js";
import { CwlRoutes } from "./modules/cwl/cwl.routes.js";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import { CapitalRoutes } from "./modules/capitals/capital.routes.js";
import { BuildingRoutes } from "./modules/building/building.routes.js"; // 1. Import the new route
import { ClanGamesRoutes } from "./modules/clanGames/clanGames.routes.js";
import { WarRoutes } from "./modules/war/war.routes.js";

const router = Router();

const moduleRoutes = [
  {
    path: "/player",
    router: PlayerRoutes,
  },
  {
    path: "/clan",
    router: ClanRoutes,
  },
  {
    path: "/cwl",
    router: CwlRoutes,
  },
  {
    path: "/auth",
    router: AuthRoutes,
  },
  {
    path: "/capital",
    router: CapitalRoutes,
  },
  {
    path: "/building",
    router: BuildingRoutes, // 2. Register it with the '/building' endpoint
  },
  {
    path: "/clan-games",
    router: ClanGamesRoutes,
  },
  // Add inside moduleRoutes array:
  {
    path: "/war",
    router: WarRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.router);
});

export default router;
