import { BuildingSnapshot } from "./building.model.js";
import { formatTag } from "../../utils/clashClient.js";
import {
  BUILDING_ID_MAP,
  TRAP_ID_MAP,
} from "../../utils/buildingDictionary.js";

const HERO_ID_MAP = {
  28000000: "Barbarian King",
  28000001: "Archer Queen",
  28000002: "Grand Warden",
  28000004: "Royal Champion",
  28000006: "Minion Prince",
  28000007: "Dragon Duke",
};

const saveLayoutUpload = async (rawPayload) => {
  if (!rawPayload?.tag) throw new Error("Invalid JSON: missing player tag.");
  const playerTag = formatTag(rawPayload.tag);

  // 1. Translate Buildings
  const parsedBuildings = (rawPayload.buildings || []).map((b) => ({
    dataId: b.data,
    name: BUILDING_ID_MAP[b.data] || `Unknown Building (${b.data})`,
    level: b.lvl ?? 1,
    count: b.cnt || 1,
    timer: b.timer || 0,
    weapon: b.weapon || 0,
    gear_up: b.gear_up || 0,
  }));

  // 2. Translate Traps (Include timer!)
  const parsedTraps = (rawPayload.traps || []).map((t) => ({
    dataId: t.data,
    name: TRAP_ID_MAP[t.data] || `Unknown Trap (${t.data})`,
    level: t.lvl ?? 1,
    count: t.cnt || 1,
    timer: t.timer || 0, // <-- FIXED: Traps also use Builders
  }));

  // 3. Translate Home Village Heroes (Include timer!)
  const parsedHeroes = (rawPayload.heroes || [])
    .filter((h) => h.data !== 28000003 && h.data !== 28000005) // Exclude Builder Base heroes
    .map((h) => ({
      dataId: h.data,
      name: HERO_ID_MAP[h.data] || `Hero (${h.data})`,
      level: h.lvl ?? 1,
      timer: h.timer || 0, // <-- FIXED: Heroes use Builders
    }));

  const incomingTimestamp =
    rawPayload.timestamp || Math.floor(Date.now() / 1000);
  const existingRecord = await BuildingSnapshot.findOne({ playerTag });

  // If the database already has a NEWER building snapshot for this village, keep it!
  if (existingRecord && existingRecord.uploadTimestamp > incomingTimestamp) {
    return existingRecord;
  }

  return await BuildingSnapshot.findOneAndUpdate(
    { playerTag },
    {
      $set: {
        playerTag,
        uploadTimestamp: rawPayload.timestamp || Math.floor(Date.now() / 1000),
        buildings: parsedBuildings,
        traps: parsedTraps,
        heroes: parsedHeroes, // <-- SAVE HERO TIMERS
        helpers: rawPayload.helpers || [],
        buildings2: rawPayload.buildings2 || [],
        traps2: rawPayload.traps2 || [],
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );
};
const getLayout = async (tag) => {
  return await BuildingSnapshot.findOne({ playerTag: formatTag(tag) });
};

export const buildingService = { saveLayoutUpload, getLayout };
