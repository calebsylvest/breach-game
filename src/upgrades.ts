import type { Player } from "./player.ts";

export type UpgradeCategory = "offense" | "defense" | "utility";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  maxStacks?: number;
  apply: (player: Player) => void;
}

export const UPGRADES: Upgrade[] = [
  // ── Offense ──────────────────────────────────────────────────────────────
  {
    id: "hollow_points",
    name: "Hollow Points",
    category: "offense",
    description: "Expanding ammo. Rounds hit 20% harder on soft targets.",
    maxStacks: 2,
    apply: (p) => { p.stats.damageMult *= 1.2; },
  },
  {
    id: "ap_rounds",
    name: "AP Rounds",
    category: "offense",
    description: "Armor-piercing penetrators. +35% damage through plating.",
    maxStacks: 2,
    apply: (p) => { p.stats.damageMult *= 1.35; },
  },
  {
    id: "trigger_job",
    name: "Trigger Job",
    category: "offense",
    description: "Lightened spring, polished sear. 20% faster cyclic rate.",
    maxStacks: 2,
    apply: (p) => { p.stats.fireRateMult *= 1.2; },
  },
  {
    id: "bcg_upgrade",
    name: "Enhanced BCG",
    category: "offense",
    description: "Optimized bolt carrier group. 35% faster fire rate.",
    maxStacks: 2,
    apply: (p) => { p.stats.fireRateMult *= 1.35; },
  },
  {
    id: "frag_rounds",
    name: "Frag Rounds",
    category: "offense",
    description: "Fragmenting projectiles. +25% damage, nasty wound channels.",
    maxStacks: 2,
    apply: (p) => { p.stats.damageMult *= 1.25; },
  },

  // ── Defense — Armor ───────────────────────────────────────────────────────
  {
    id: "armor_plate_1",
    name: "Armor Plate I",
    category: "defense",
    description: "Standard-issue ceramic plate. +25 max armor, restore 25.",
    maxStacks: 2,
    apply: (p) => {
      p.stats.maxArmorBonus += 25;
      p.repairArmor(25);
    },
  },
  {
    id: "armor_plate_2",
    name: "Armor Plate II",
    category: "defense",
    description: "Reinforced composite panel. +40 max armor, restore 40.",
    maxStacks: 2,
    apply: (p) => {
      p.stats.maxArmorBonus += 40;
      p.repairArmor(40);
    },
  },
  {
    id: "armor_plate_3",
    name: "Armor Plate III",
    category: "defense",
    description: "Ballistic-rated hard plate. +60 max armor, restore to full.",
    maxStacks: 1,
    apply: (p) => {
      p.stats.maxArmorBonus += 60;
      p.armor = p.maxArmor;
    },
  },
  {
    id: "armor_repair",
    name: "Armor Repair Kit",
    category: "defense",
    description: "Field patch compound. Restore 35 armor.",
    apply: (p) => { p.repairArmor(35); },
  },
  // ── Defense — Health (rare) ────────────────────────────────────────────────
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

  // ── Offense (continued) ──────────────────────────────────────────────────
  {
    id: "piercing_rounds",
    name: "Piercing Rounds",
    category: "offense",
    description: "Hardened penetrators. All bullets pierce through enemies.",
    maxStacks: 1,
    apply: (p) => { p.stats.piercingBullets = true; },
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  {
    id: "exo_legs",
    name: "Exo-Legs",
    category: "utility",
    description: "Powered leg braces, near-silent servos. +20% move speed.",
    maxStacks: 3,
    apply: (p) => { p.stats.speedMult *= 1.2; },
  },
  {
    id: "sprint_actuators",
    name: "Sprint Actuators",
    category: "utility",
    description: "Military-grade exo-frame, full stride assist. +30% speed.",
    maxStacks: 2,
    apply: (p) => { p.stats.speedMult *= 1.3; },
  },
  {
    id: "dash_canister",
    name: "Dash Canister",
    category: "utility",
    description: "Compressed thruster charge. Dash cooldown reduced 35%.",
    maxStacks: 3,
    apply: (p) => { p.stats.dashCooldownMult *= 0.65; },
  },
  {
    id: "extra_life",
    name: "Emergency Beacon",
    category: "utility",
    description: "Automated distress signal. Revive once with 50 HP on death.",
    maxStacks: 2,
    apply: (p) => { p.extraLives++; },
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

export function rollUpgrades(n: number, used?: Map<string, number>): Upgrade[] {
  const pool = UPGRADES.filter(u => {
    if (!u.maxStacks || !used) return true;
    return (used.get(u.id) ?? 0) < u.maxStacks;
  });
  const result: Upgrade[] = [];
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
