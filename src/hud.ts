import type { Player } from "./player.ts";
import type { EnemyManager } from "./enemies.ts";
import type { World, Room, RoomType } from "./world.ts";
import type { Upgrade } from "./upgrades.ts";

const ROOM_COLORS: Record<RoomType, string> = {
  start: "#2e4a6b",
  corridor: "#1e2a3a",
  arena: "#4a2e2e",
  nest: "#4a2e4a",
  extraction: "#2e4a3a",
};

export class Hud {
  private readonly hpEl: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly killsEl: HTMLElement;
  private readonly roomEl: HTMLElement;
  private readonly deathEl: HTMLElement;
  private readonly deathSub: HTMLElement;
  private readonly deathRestart: HTMLButtonElement;
  private readonly winEl: HTMLElement;
  private readonly winStats: HTMLElement;
  private readonly winRestart: HTMLButtonElement;
  private readonly minimapCanvas: HTMLCanvasElement;
  private readonly minimapCtx: CanvasRenderingContext2D;
  private readonly upgradeEl: HTMLElement;
  private readonly upgradeCards: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly titlePlay: HTMLButtonElement;

  constructor(
    onDeathRestart: () => void,
    onWinRestart: () => void,
    onTitlePlay: () => void,
  ) {
    this.hpEl = required("hp");
    this.hpFill = required("hp-fill");
    this.killsEl = required("kills");
    this.roomEl = required("room-label");
    this.deathEl = required("death");
    this.deathSub = required("death-sub");
    this.deathRestart = required("death-restart") as HTMLButtonElement;
    this.deathRestart.addEventListener("click", onDeathRestart);
    this.winEl = required("win");
    this.winStats = required("win-stats");
    this.winRestart = required("win-restart") as HTMLButtonElement;
    this.winRestart.addEventListener("click", onWinRestart);
    this.minimapCanvas = required("minimap") as HTMLCanvasElement;
    const ctx = this.minimapCanvas.getContext("2d");
    if (!ctx) throw new Error("minimap 2d ctx unavailable");
    this.minimapCtx = ctx;
    this.upgradeEl = required("upgrade");
    this.upgradeCards = required("upgrade-cards");
    this.titleEl = required("title");
    this.titlePlay = required("title-play") as HTMLButtonElement;
    this.titlePlay.addEventListener("click", onTitlePlay);
  }

  hideTitle(): void {
    this.titleEl.classList.add("hidden");
  }

  update(player: Player, enemies: EnemyManager, world: World): void {
    this.hpEl.textContent = `HP ${Math.max(0, Math.round(player.hp))} / ${player.maxHp}`;
    const pct = Math.max(0, player.hp / player.maxHp) * 100;
    this.hpFill.style.width = `${pct}%`;
    this.killsEl.textContent = `kills ${enemies.killCount}`;
    const current = currentRoom(world, player.position.x, player.position.z);
    this.roomEl.textContent = current ? current.type : "void";
    this.drawMinimap(world, player.position.x, player.position.z);
  }

  private drawMinimap(world: World, px: number, pz: number): void {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(5, 8, 12, 0.72)";
    ctx.fillRect(0, 0, w, h);

    const pad = 6;
    const b = world.bounds;
    const worldW = b.maxX - b.minX;
    const worldH = b.maxZ - b.minZ;
    const scale = Math.min((w - pad * 2) / worldW, (h - pad * 2) / worldH);
    const ox = pad + ((w - pad * 2) - worldW * scale) / 2;
    const oy = pad + ((h - pad * 2) - worldH * scale) / 2;
    const toX = (x: number) => ox + (x - b.minX) * scale;
    const toY = (z: number) => oy + (z - b.minZ) * scale;

    for (const room of world.rooms) {
      ctx.fillStyle = ROOM_COLORS[room.type];
      ctx.fillRect(
        toX(room.minX),
        toY(room.minZ),
        (room.maxX - room.minX) * scale,
        (room.maxZ - room.minZ) * scale,
      );
      ctx.strokeStyle = "#5a6a82";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toX(room.minX) + 0.5,
        toY(room.minZ) + 0.5,
        (room.maxX - room.minX) * scale - 1,
        (room.maxZ - room.minZ) * scale - 1,
      );
    }

    const e = world.extraction;
    ctx.fillStyle = "#66ffaa";
    ctx.beginPath();
    ctx.arc(toX(e.x), toY(e.z), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe2b2";
    ctx.beginPath();
    ctx.arc(toX(px), toY(pz), 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  showDeath(cause: string): void {
    this.deathSub.textContent = `killed by ${cause}`;
    this.deathEl.classList.add("show");
  }

  hideDeath(): void {
    this.deathEl.classList.remove("show");
  }

  showWin(kills: number, elapsedSec: number): void {
    const m = Math.floor(elapsedSec / 60);
    const s = Math.floor(elapsedSec % 60);
    const t = `${m}:${s.toString().padStart(2, "0")}`;
    this.winStats.textContent = `kills ${kills} · time ${t}`;
    this.winEl.classList.add("show");
  }

  hideWin(): void {
    this.winEl.classList.remove("show");
  }

  showUpgrade(cards: Upgrade[], onPick: (card: Upgrade) => void): void {
    this.upgradeCards.innerHTML = "";
    for (const card of cards) {
      const btn = document.createElement("button");
      btn.className = `upgrade-card ${card.category}`;
      btn.innerHTML =
        `<div class="card-tag">${card.category}</div>` +
        `<div class="card-name">${card.name}</div>` +
        `<div class="card-desc">${card.description}</div>`;
      btn.addEventListener("click", () => onPick(card), { once: true });
      this.upgradeCards.appendChild(btn);
    }
    this.upgradeEl.classList.add("show");
  }

  hideUpgrade(): void {
    this.upgradeEl.classList.remove("show");
    this.upgradeCards.innerHTML = "";
  }
}

function required(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function currentRoom(world: World, x: number, z: number): Room | null {
  for (const r of world.rooms) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r;
  }
  return null;
}
