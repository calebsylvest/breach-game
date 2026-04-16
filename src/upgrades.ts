import type { Player } from "./player.ts";

export type UpgradeCategory = "offense" | "defense" | "utility";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  apply: (player: Player) => void;
}

export const UPGRADES: Upgrade[] = [
  // ── Offense ──────────────────────────────────────────────────────────────
  {
    id: "hollow_points",
    name: "Hollow Points",
    category: "offense",
    description: "Expanding ammo. Rounds hit 20% harder on soft targets.",
    apply: (p) => { p.stats.damageMult *= 1.2; },
  },
  {
    id: "ap_rounds",
    name: "AP Rounds",
    category: "offense",
    description: "Armor-piercing penetrators. +35% damage through plating.",
    apply: (p) => { p.stats.damageMult *= 1.35; },
  },
  {
    id: "trigger_job",
    name: "Trigger Job",
    category: "offense",
    description: "Lightened spring, polished sear. 20% faster cyclic rate.",
    apply: (p) => { p.stats.fireRateMult *= 1.2; },
  },
  {
    id: "bcg_upgrade",
    name: "Enhanced BCG",
    category: "offense",
    description: "Optimized bolt carrier group. 35% faster fire rate.",
    apply: (p) => { p.stats.fireRateMult *= 1.35; },
  },
  {
    id: "frag_rounds",
    name: "Frag Rounds",
    category: "offense",
    description: "Fragmenting projectiles. +25% damage, nasty wound channels.",
    apply: (p) => { p.stats.damageMult *= 1.25; },
  },

  // ── Defense ───────────────────────────────────────────────────────────────
  {
    id: "trauma_plate",
    name: "Trauma Plate",
    category: "defense",
    description: "Ceramic insert rated for rifle rounds. +25 max HP.",
    apply: (p) => {
      p.stats.maxHpBonus += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    },
  },
  {
    id: "kevlar_vest",
    name: "Kevlar Vest",
    category: "defense",
    description: "Full torso ballistic vest. +50 max HP.",
    apply: (p) => {
      p.stats.maxHpBonus += 50;
      p.hp = Math.min(p.maxHp, p.hp + 50);
    },
  },
  {
    id: "medkit",
    name: "Medkit",
    category: "defense",
    description: "Combat trauma kit. Pressure dressings restore full HP.",
    apply: (p) => { p.hp = p.maxHp; },
  },
  {
    id: "stim_injector",
    name: "Stim Injector",
    category: "defense",
    description: "Adrenaline and clotting compound. Restore 50 HP now.",
    apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 50); },
  },
  {
    id: "nano_bandage",
    name: "Nano Bandage",
    category: "defense",
    description: "Self-sealing wound wrap. Restore 30 HP.",
    apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 30); },
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  {
    id: "exo_legs",
    name: "Exo-Legs",
    category: "utility",
    description: "Powered leg braces, near-silent servos. +20% move speed.",
    apply: (p) => { p.stats.speedMult *= 1.2; },
  },
  {
    id: "sprint_actuators",
    name: "Sprint Actuators",
    category: "utility",
    description: "Military-grade exo-frame, full stride assist. +30% speed.",
    apply: (p) => { p.stats.speedMult *= 1.3; },
  },
  {
    id: "dash_canister",
    name: "Dash Canister",
    category: "utility",
    description: "Compressed thruster charge. Dash cooldown reduced 35%.",
    apply: (p) => { p.stats.dashCooldownMult *= 0.65; },
  },
  {
    id: "ammo_cache",
    name: "Ammo Cache",
    category: "utility",
    description: "Three full magazines, every weapon type. All ammo refilled.",
    apply: (p) => { p.refillAmmo(); },
  },
  {
    id: "field_kit",
    name: "Field Reload Kit",
    category: "utility",
    description: "Speed loaders and pre-loaded strips. Ammo fully restored.",
    apply: (p) => { p.refillAmmo(); },
  },
];

export function rollUpgrades(n: number): Upgrade[] {
  const pool = UPGRADES.slice();
  const result: Upgrade[] = [];
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
