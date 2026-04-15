export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Circle {
  x: number;
  z: number;
  r: number;
}

export function resolveMovement(
  circle: Circle,
  dx: number,
  dz: number,
  colliders: AABB[],
): { x: number; z: number } {
  let nx = circle.x + dx;
  for (const c of colliders) {
    if (overlapsCircleAABB(nx, circle.z, circle.r, c)) {
      if (dx > 0) nx = c.minX - circle.r - 1e-4;
      else if (dx < 0) nx = c.maxX + circle.r + 1e-4;
    }
  }
  let nz = circle.z + dz;
  for (const c of colliders) {
    if (overlapsCircleAABB(nx, nz, circle.r, c)) {
      if (dz > 0) nz = c.minZ - circle.r - 1e-4;
      else if (dz < 0) nz = c.maxZ + circle.r + 1e-4;
    }
  }
  return { x: nx, z: nz };
}

export function pointInAABB(x: number, z: number, a: AABB): boolean {
  return x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ;
}

function overlapsCircleAABB(cx: number, cz: number, r: number, a: AABB): boolean {
  const clampedX = Math.max(a.minX, Math.min(cx, a.maxX));
  const clampedZ = Math.max(a.minZ, Math.min(cz, a.maxZ));
  const dx = cx - clampedX;
  const dz = cz - clampedZ;
  return dx * dx + dz * dz < r * r;
}
