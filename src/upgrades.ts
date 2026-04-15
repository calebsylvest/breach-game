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
  {
    id: "dmg15",
    name: "+15% damage",
    description: "rounds hit harder",
    category: "offense",
    apply: (p) => {
      p.stats.damageMult *= 1.15;
    },
  },
  {
    id: "dmg30",
    name: "+30% damage",
    description: "heavy caliber",
    category: "offense",
    apply: (p) => {
      p.stats.damageMult *= 1.3;
    },
  },
  {
    id: "firerate20",
    name: "+20% fire rate",
    description: "trigger work",
    category: "offense",
    apply: (p) => {
      p.stats.fireRateMult *= 1.2;
    },
  },
  {
    id: "firerate35",
    name: "+35% fire rate",
    description: "high cyclic",
    category: "offense",
    apply: (p) => {
      p.stats.fireRateMult *= 1.35;
    },
  },
  {
    id: "hp25",
    name: "+25 max HP",
    description: "reinforced plating",
    category: "defense",
    apply: (p) => {
      p.stats.maxHpBonus += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    },
  },
  {
    id: "hp50",
    name: "+50 max HP",
    description: "bulkhead",
    category: "defense",
    apply: (p) => {
      p.stats.maxHpBonus += 50;
      p.hp = Math.min(p.maxHp, p.hp + 50);
    },
  },
  {
    id: "heal",
    name: "repair kit",
    description: "restore full HP",
    category: "defense",
    apply: (p) => {
      p.hp = p.maxHp;
    },
  },
  {
    id: "speed15",
    name: "+15% speed",
    description: "lighter boots",
    category: "utility",
    apply: (p) => {
      p.stats.speedMult *= 1.15;
    },
  },
  {
    id: "speed30",
    name: "+30% speed",
    description: "overclocked servos",
    category: "utility",
    apply: (p) => {
      p.stats.speedMult *= 1.3;
    },
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
