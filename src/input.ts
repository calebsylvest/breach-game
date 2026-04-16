export class Input {
  readonly keys = new Set<string>();
  mouseNdcX = 0;
  mouseNdcY = 0;
  firing = false;
  private dashQueued = false;
  private clickQueued = false;
  private weaponSwitchQueued: number | null = null;
  private reloadQueued = false;

  constructor(target: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        if (!this.keys.has(e.code)) this.dashQueued = true;
      }
      if (e.code === "Digit1") this.weaponSwitchQueued = 0;
      if (e.code === "Digit2") this.weaponSwitchQueued = 1;
      if (e.code === "Digit3") this.weaponSwitchQueued = 2;
      if (e.code === "KeyR" && !this.keys.has("KeyR")) this.reloadQueued = true;
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.firing = false;
      this.dashQueued = false;
      this.clickQueued = false;
      this.weaponSwitchQueued = null;
      this.reloadQueued = false;
    });

    target.addEventListener("mousemove", (e) => {
      const rect = target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.mouseNdcX = x * 2 - 1;
      this.mouseNdcY = -(y * 2 - 1);
    });
    target.addEventListener("mousedown", (e) => {
      if (e.button === 0) { this.firing = true; this.clickQueued = true; }
    });
    target.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.firing = false;
    });
    target.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  consumeDash(): boolean {
    if (this.dashQueued) {
      this.dashQueued = false;
      return true;
    }
    return false;
  }

  consumeWeaponSwitch(): number | null {
    const v = this.weaponSwitchQueued;
    this.weaponSwitchQueued = null;
    return v;
  }

  consumeClick(): boolean {
    if (this.clickQueued) { this.clickQueued = false; return true; }
    return false;
  }

  consumeReload(): boolean {
    if (this.reloadQueued) {
      this.reloadQueued = false;
      return true;
    }
    return false;
  }

  movement(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyW")) z -= 1;
    if (this.keys.has("KeyS")) z += 1;
    if (this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("KeyD")) x += 1;
    const len = Math.hypot(x, z);
    if (len > 0) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }
}
