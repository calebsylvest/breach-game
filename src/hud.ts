import type { Player } from "./player.ts";
import type { EnemyManager } from "./enemies.ts";

export class Hud {
  private readonly hpEl: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly killsEl: HTMLElement;
  private readonly deathEl: HTMLElement;
  private readonly deathSub: HTMLElement;
  private readonly restartBtn: HTMLButtonElement;

  constructor(onRestart: () => void) {
    this.hpEl = required("hp");
    this.hpFill = required("hp-fill");
    this.killsEl = required("kills");
    this.deathEl = required("death");
    this.deathSub = required("death-sub");
    this.restartBtn = required("death-restart") as HTMLButtonElement;
    this.restartBtn.addEventListener("click", onRestart);
  }

  update(player: Player, enemies: EnemyManager): void {
    this.hpEl.textContent = `HP ${Math.max(0, Math.round(player.hp))} / ${player.maxHp}`;
    const pct = Math.max(0, player.hp / player.maxHp) * 100;
    this.hpFill.style.width = `${pct}%`;
    this.killsEl.textContent = `kills ${enemies.killCount}`;
  }

  showDeath(cause: string): void {
    this.deathSub.textContent = `killed by ${cause}`;
    this.deathEl.classList.add("show");
  }

  hideDeath(): void {
    this.deathEl.classList.remove("show");
  }
}

function required(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}
