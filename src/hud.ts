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
  private readonly dashFill: HTMLElement;
  private readonly killsEl: HTMLElement;
  private readonly roomEl: HTMLElement;
  private readonly ammoEl: HTMLElement;
  private readonly weaponEl: HTMLElement;
  private readonly deathEl: HTMLElement;
  private readonly deathSub: HTMLElement;
  private readonly deathStats: HTMLElement;
  private readonly deathRestart: HTMLButtonElement;
  private readonly winEl: HTMLElement;
  private readonly winStats: HTMLElement;
  private readonly winRestart: HTMLButtonElement;
  private readonly minimapCanvas: HTMLCanvasElement;
  private readonly minimapCtx: CanvasRenderingContext2D;
  private readonly upgradeEl: HTMLElement;
  private readonly upgradeCards: HTMLElement;
  private readonly upgradeClose: HTMLButtonElement;
  private readonly interactHint: HTMLElement;
  private upgradeCloseCleanup: (() => void) | null = null;
  private readonly titleEl: HTMLElement;
  private readonly titlePlay: HTMLButtonElement;
  private readonly callsignInput: HTMLInputElement;
  private readonly callsignLabel: HTMLElement;
  private readonly levelTransEl: HTMLElement;
  private readonly levelTransNum: HTMLElement;
  private readonly levelTransName: HTMLElement;
  private readonly levelTransBtn: HTMLButtonElement;
  private levelTransCleanup: (() => void) | null = null;
  private readonly pauseEl: HTMLElement;
  private readonly pauseResume: HTMLButtonElement;

  constructor(
    onDeathRestart: () => void,
    onWinRestart: () => void,
    onTitlePlay: () => void,
  ) {
    this.hpEl = required("hp");
    this.hpFill = required("hp-fill");
    this.dashFill = required("dash-fill");
    this.killsEl = required("kills");
    this.roomEl = required("room-label");
    this.ammoEl = required("ammo");
    this.weaponEl = required("weapon-name");
    this.deathEl = required("death");
    this.deathSub = required("death-sub");
    this.deathStats = required("death-stats");
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
    this.upgradeClose = required("upgrade-close") as HTMLButtonElement;
    this.interactHint = required("interact-hint");
    this.titleEl = required("title");
    this.titlePlay = required("title-play") as HTMLButtonElement;
    this.titlePlay.addEventListener("click", onTitlePlay);
    this.callsignInput = required("callsign-input") as HTMLInputElement;
    this.callsignLabel = required("callsign-label");
    this.levelTransEl = required("level-trans");
    this.levelTransNum = required("level-trans-num");
    this.levelTransName = required("level-trans-name");
    this.levelTransBtn = required("level-trans-btn") as HTMLButtonElement;
    this.pauseEl = required("pause");
    this.pauseResume = required("pause-resume") as HTMLButtonElement;
  }

  hideTitle(): void {
    const name = this.callsignInput.value.trim().toUpperCase() || "SOLDIER";
    this.callsignLabel.textContent = name;
    this.titleEl.classList.add("hidden");
  }

  get callsign(): string {
    return this.callsignLabel.textContent || "SOLDIER";
  }

  showLevelTransition(levelNumber: number, name: string, onContinue: () => void): void {
    this.levelTransNum.textContent = `LEVEL ${levelNumber}`;
    this.levelTransName.textContent = name;
    if (this.levelTransCleanup) this.levelTransCleanup();
    const handler = () => onContinue();
    this.levelTransBtn.addEventListener("click", handler, { once: true });
    this.levelTransCleanup = () => this.levelTransBtn.removeEventListener("click", handler);
    this.levelTransEl.classList.add("show");
  }

  hideLevelTransition(): void {
    this.levelTransEl.classList.remove("show");
    this.levelTransCleanup = null;
  }

  update(player: Player, enemies: EnemyManager, world: World): void {
    this.hpEl.textContent = `HP ${Math.max(0, Math.round(player.hp))} / ${player.maxHp}`;
    const pct = Math.max(0, player.hp / player.maxHp) * 100;
    this.hpFill.style.width = `${pct}%`;
    const dashPct = player.dashCooldown <= 0
      ? 100
      : (1 - player.dashCooldown / player.dashCooldownMax) * 100;
    this.dashFill.style.width = `${dashPct}%`;
    this.killsEl.textContent = `kills ${enemies.killCount}`;
    const current = currentRoom(world, player.position.x, player.position.z);
    this.roomEl.textContent = current ? current.type : "void";
    this.weaponEl.textContent = player.weaponName;
    if (player.reloading) {
      this.ammoEl.textContent = "RELOADING...";
      this.ammoEl.style.color = "#d4c066";
    } else {
      this.ammoEl.textContent = `${player.mag} / ${player.reserve}`;
      this.ammoEl.style.color = player.mag === 0 ? "#ff4b4b" : "";
    }
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

  showDeath(cause: string, kills: number, elapsedSec: number, level: number, upgrades: number): void {
    const m = Math.floor(elapsedSec / 60);
    const s = Math.floor(elapsedSec % 60);
    this.deathSub.textContent = `${this.callsign} — killed by ${cause}`;
    this.deathStats.textContent = `kills ${kills} · time ${m}:${s.toString().padStart(2, "0")} · level ${level} · upgrades ${upgrades}`;
    this.deathEl.classList.add("show");
  }

  hideDeath(): void {
    this.deathEl.classList.remove("show");
  }

  showWin(kills: number, elapsedSec: number, level: number, upgrades: number): void {
    const m = Math.floor(elapsedSec / 60);
    const s = Math.floor(elapsedSec % 60);
    const t = `${m}:${s.toString().padStart(2, "0")}`;
    this.winStats.textContent = `kills ${kills} · time ${t} · levels ${level} · upgrades ${upgrades}`;
    this.winEl.classList.add("show");
  }

  hideWin(): void {
    this.winEl.classList.remove("show");
  }

  showUpgrade(cards: Upgrade[], onPick: (card: Upgrade) => void, onClose: () => void): void {
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
    if (this.upgradeCloseCleanup) this.upgradeCloseCleanup();
    const handler = () => onClose();
    this.upgradeClose.addEventListener("click", handler, { once: true });
    this.upgradeCloseCleanup = () => this.upgradeClose.removeEventListener("click", handler);
    this.upgradeEl.classList.add("show");
  }

  hideUpgrade(): void {
    this.upgradeEl.classList.remove("show");
    this.upgradeCards.innerHTML = "";
    this.upgradeCloseCleanup = null;
  }

  showPause(onResume: () => void): void {
    const handler = () => onResume();
    this.pauseResume.addEventListener("click", handler, { once: true });
    this.pauseEl.classList.add("show");
  }

  hidePause(): void {
    this.pauseEl.classList.remove("show");
  }

  setInteractHint(visible: boolean): void {
    this.interactHint.style.display = visible ? "block" : "none";
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
