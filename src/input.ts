export class Input {
  readonly keys = new Set<string>();
  mouseNdcX = 0;
  mouseNdcY = 0;
  firing = false;

  constructor(target: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.firing = false;
    });

    target.addEventListener("mousemove", (e) => {
      const rect = target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.mouseNdcX = x * 2 - 1;
      this.mouseNdcY = -(y * 2 - 1);
    });
    target.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.firing = true;
    });
    target.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.firing = false;
    });
    target.addEventListener("contextmenu", (e) => e.preventDefault());
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
