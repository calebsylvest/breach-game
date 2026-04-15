import type { Player } from "./player.ts";

export class Hud {
  private readonly hpEl: HTMLElement;
  private readonly ammoEl: HTMLElement;

  constructor() {
    const hp = document.getElementById("hp");
    const ammo = document.getElementById("ammo");
    if (!hp || !ammo) throw new Error("HUD elements missing");
    this.hpEl = hp;
    this.ammoEl = ammo;
  }

  update(player: Player): void {
    this.hpEl.textContent = `HP ${Math.max(0, Math.round(player.hp))}`;
    this.ammoEl.textContent = `∞ / ∞`;
  }
}
