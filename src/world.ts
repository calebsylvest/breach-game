import * as THREE from "three";
import type { AABB } from "./collision.ts";
import { pointInAABB } from "./collision.ts";

export type RoomType = "start" | "corridor" | "arena" | "nest" | "extraction";

export interface Room {
  type: RoomType;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface RoomSpec {
  type: RoomType;
  width: number;
  depth: number;
}

export const LEVEL_NAMES = [
  "OUTER CORRIDORS",
  "PROCESSING WING",
  "NEST CORE",
  "REACTOR DEPTH",
  "EXTRACTION RUN",
];

const LEVEL_SPECS: RoomSpec[][] = [
  // Level 1 — 5 rooms, tutorial feel
  [
    { type: "start",      width: 16, depth: 16 },
    { type: "corridor",   width: 7,  depth: 6  },
    { type: "arena",      width: 26, depth: 22 },
    { type: "corridor",   width: 7,  depth: 6  },
    { type: "extraction", width: 14, depth: 14 },
  ],
  // Level 2 — 6 rooms, nest introduced
  [
    { type: "start",      width: 16, depth: 16 },
    { type: "corridor",   width: 7,  depth: 5  },
    { type: "arena",      width: 26, depth: 22 },
    { type: "corridor",   width: 7,  depth: 5  },
    { type: "nest",       width: 20, depth: 18 },
    { type: "extraction", width: 14, depth: 14 },
  ],
  // Level 3 — 7 rooms
  [
    { type: "start",      width: 16, depth: 16 },
    { type: "corridor",   width: 7,  depth: 5  },
    { type: "arena",      width: 28, depth: 24 },
    { type: "corridor",   width: 7,  depth: 5  },
    { type: "nest",       width: 22, depth: 18 },
    { type: "corridor",   width: 7,  depth: 5  },
    { type: "extraction", width: 14, depth: 14 },
  ],
  // Level 4 — 8 rooms, double combat
  [
    { type: "start",      width: 16, depth: 14 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "arena",      width: 28, depth: 24 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "nest",       width: 22, depth: 18 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "arena",      width: 26, depth: 22 },
    { type: "extraction", width: 14, depth: 14 },
  ],
  // Level 5 — 9 rooms, max density gauntlet
  [
    { type: "start",      width: 16, depth: 14 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "arena",      width: 30, depth: 26 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "nest",       width: 24, depth: 20 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "arena",      width: 28, depth: 24 },
    { type: "corridor",   width: 6,  depth: 5  },
    { type: "extraction", width: 14, depth: 14 },
  ],
];

const WALL_THICKNESS = 0.6;
const WALL_HEIGHT = 2.8;

interface Opening {
  min: number;
  max: number;
}

export class World {
  readonly group = new THREE.Group();
  readonly colliders: AABB[] = [];
  readonly rooms: Room[];
  readonly playerSpawn = new THREE.Vector3();
  readonly extraction: { x: number; z: number; r: number };
  readonly bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  private readonly extractionBeacon: THREE.Mesh;
  private beaconTime = 0;

  constructor(levelIndex = 0) {
    this.rooms = this.layoutRooms(levelIndex);
    this.bounds = this.computeBounds();

    const start = this.rooms[0];
    this.playerSpawn.set(
      (start.minX + start.maxX) / 2,
      0,
      (start.minZ + start.maxZ) / 2,
    );

    const last = this.rooms[this.rooms.length - 1];
    this.extraction = {
      x: last.maxX - 2.5,
      z: (last.minZ + last.maxZ) / 2,
      r: 1.6,
    };

    this.buildFloor();
    this.buildWalls();
    this.buildCover();
    this.buildExteriorFill();
    this.extractionBeacon = this.buildExtractionPad();
    this.buildRoomLights();
  }

  update(dt: number): void {
    this.beaconTime += dt;
    const pulse = 1 + Math.sin(this.beaconTime * 3) * 0.15;
    this.extractionBeacon.scale.y = pulse;
  }

  collidesPoint(p: THREE.Vector3): boolean {
    for (const c of this.colliders) {
      if (pointInAABB(p.x, p.z, c)) return true;
    }
    return false;
  }

  insideAnyRoom(x: number, z: number, margin = 0): boolean {
    for (const r of this.rooms) {
      if (
        x >= r.minX + margin &&
        x <= r.maxX - margin &&
        z >= r.minZ + margin &&
        z <= r.maxZ - margin
      ) {
        return true;
      }
    }
    return false;
  }

  randomPointInRoom(room: Room, margin = 1): { x: number; z: number } | null {
    const tmp = new THREE.Vector3();
    const w = room.maxX - room.minX - margin * 2;
    const d = room.maxZ - room.minZ - margin * 2;
    if (w <= 0 || d <= 0) return null;
    for (let i = 0; i < 40; i++) {
      const x = room.minX + margin + Math.random() * w;
      const z = room.minZ + margin + Math.random() * d;
      tmp.set(x, 0, z);
      if (this.collidesPoint(tmp)) continue;
      return { x, z };
    }
    return null;
  }

  randomSpawnPointAround(
    cx: number,
    cz: number,
    minDist: number,
    maxDist: number,
  ): { x: number; z: number } | null {
    const tmp = new THREE.Vector3();
    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;
      if (!this.insideAnyRoom(x, z, 0.6)) continue;
      tmp.set(x, 0, z);
      if (this.collidesPoint(tmp)) continue;
      return { x, z };
    }
    return null;
  }

  private layoutRooms(levelIndex: number): Room[] {
    const spec = LEVEL_SPECS[Math.min(levelIndex, LEVEL_SPECS.length - 1)];
    const rooms: Room[] = [];
    let cursor = 0;
    for (const s of spec) {
      const halfD = s.depth / 2;
      rooms.push({
        type: s.type,
        minX: cursor,
        maxX: cursor + s.width,
        minZ: -halfD,
        maxZ: halfD,
      });
      cursor += s.width;
    }
    const startCenterX = (rooms[0].minX + rooms[0].maxX) / 2;
    for (const r of rooms) {
      r.minX -= startCenterX;
      r.maxX -= startCenterX;
    }
    return rooms;
  }

  private computeBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const r of this.rooms) {
      if (r.minX < minX) minX = r.minX;
      if (r.maxX > maxX) maxX = r.maxX;
      if (r.minZ < minZ) minZ = r.minZ;
      if (r.maxZ > maxZ) maxZ = r.maxZ;
    }
    return { minX, maxX, minZ, maxZ };
  }

  private addCollider(x: number, z: number, sx: number, sz: number): void {
    this.colliders.push({
      minX: x - sx / 2,
      maxX: x + sx / 2,
      minZ: z - sz / 2,
      maxZ: z + sz / 2,
    });
  }

  private addWallBox(x: number, z: number, sx: number, sz: number): void {
    if (sx <= 0 || sz <= 0) return;
    const geo = new THREE.BoxGeometry(sx, WALL_HEIGHT, sz);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2f3947, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, WALL_HEIGHT / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.addCollider(x, z, sx, sz);
  }

  private addCoverBox(x: number, z: number, sx: number, sz: number, h = 1.2): void {
    const geo = new THREE.BoxGeometry(sx, h, sz);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a4658, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    this.group.add(mesh);
    this.addCollider(x, z, sx, sz);
  }

  private buildFloor(): void {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const pad = 14;
    const w = maxX - minX + pad * 2;
    const d = maxZ - minZ + pad * 2;
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x141924, roughness: 0.95 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    floor.receiveShadow = true;
    this.group.add(floor);

    const gridSize = Math.max(w, d);
    const divisions = Math.floor(gridSize / 2);
    const grid = new THREE.GridHelper(gridSize, divisions, 0x2a3446, 0x1a2332);
    grid.position.set((minX + maxX) / 2, 0.01, (minZ + maxZ) / 2);
    this.group.add(grid);
  }


  private buildWalls(): void {
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const west = i > 0 ? this.rooms[i - 1] : null;
      const east = i < this.rooms.length - 1 ? this.rooms[i + 1] : null;

      const westOpening = west ? overlap(room.minZ, room.maxZ, west.minZ, west.maxZ) : null;
      const eastOpening = east ? overlap(room.minZ, room.maxZ, east.minZ, east.maxZ) : null;

      this.buildVerticalWall(room.minX, room.minZ, room.maxZ, westOpening);
      this.buildVerticalWall(room.maxX, room.minZ, room.maxZ, eastOpening);
      this.buildHorizontalWall(room.maxZ, room.minX, room.maxX, null);
      this.buildHorizontalWall(room.minZ, room.minX, room.maxX, null);
    }
  }

  private buildVerticalWall(
    x: number,
    minZ: number,
    maxZ: number,
    opening: Opening | null,
  ): void {
    if (!opening || opening.max <= opening.min) {
      this.addWallBox(x, (minZ + maxZ) / 2, WALL_THICKNESS, maxZ - minZ);
      return;
    }
    if (opening.min > minZ) {
      const len = opening.min - minZ;
      this.addWallBox(x, (minZ + opening.min) / 2, WALL_THICKNESS, len);
    }
    if (opening.max < maxZ) {
      const len = maxZ - opening.max;
      this.addWallBox(x, (opening.max + maxZ) / 2, WALL_THICKNESS, len);
    }
  }

  private buildHorizontalWall(
    z: number,
    minX: number,
    maxX: number,
    opening: Opening | null,
  ): void {
    if (!opening || opening.max <= opening.min) {
      this.addWallBox((minX + maxX) / 2, z, maxX - minX, WALL_THICKNESS);
      return;
    }
    if (opening.min > minX) {
      this.addWallBox((minX + opening.min) / 2, z, opening.min - minX, WALL_THICKNESS);
    }
    if (opening.max < maxX) {
      this.addWallBox((opening.max + maxX) / 2, z, maxX - opening.max, WALL_THICKNESS);
    }
  }

  private buildExteriorFill(): void {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const pad = 14;
    const fillH = 5.5;
    const mat = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 1.0 });

    const addFill = (x1: number, x2: number, z1: number, z2: number) => {
      const sx = x2 - x1;
      const sz = z2 - z1;
      if (sx <= 0 || sz <= 0) return;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, fillH, sz), mat);
      mesh.position.set((x1 + x2) / 2, fillH / 2, (z1 + z2) / 2);
      this.group.add(mesh);
    };

    addFill(minX - pad, minX, minZ - pad, maxZ + pad);
    addFill(maxX, maxX + pad, minZ - pad, maxZ + pad);
    for (const room of this.rooms) {
      addFill(room.minX, room.maxX, minZ - pad, room.minZ);
      addFill(room.minX, room.maxX, room.maxZ, maxZ + pad);
    }
  }

  private buildCover(): void {
    for (const room of this.rooms) {
      if (room.type === "arena") this.buildArenaCover(room);
      else if (room.type === "nest") this.buildNestCover(room);
    }
  }

  private buildArenaCover(room: Room): void {
    const cx = (room.minX + room.maxX) / 2;
    const cz = (room.minZ + room.maxZ) / 2;
    const hw = (room.maxX - room.minX) / 2;
    const hd = (room.maxZ - room.minZ) / 2;

    // Four corner pillars — sturdy square cover
    const px = hw * 0.52;
    const pz = hd * 0.52;
    this.addCoverBox(cx - px, cz - pz, 1.6, 1.6);
    this.addCoverBox(cx + px, cz - pz, 1.6, 1.6);
    this.addCoverBox(cx - px, cz + pz, 1.6, 1.6);
    this.addCoverBox(cx + px, cz + pz, 1.6, 1.6);

    // Mid-wall cover segments on each side — L-shaped pairs
    const mx = hw * 0.28;
    const mz = hd * 0.28;
    // North and south mid barriers (long side along X)
    this.addCoverBox(cx - mx, cz - hd * 0.74, 3.2, 0.9);
    this.addCoverBox(cx + mx, cz + hd * 0.74, 3.2, 0.9);
    // East and west mid barriers (long side along Z)
    this.addCoverBox(cx - hw * 0.74, cz + mz, 0.9, 3.2);
    this.addCoverBox(cx + hw * 0.74, cz - mz, 0.9, 3.2);

    // Central low cover — two boxes flanking center
    this.addCoverBox(cx - mx * 0.7, cz, 0.9, 2.8, 0.9);
    this.addCoverBox(cx + mx * 0.7, cz, 0.9, 2.8, 0.9);

    // Extra scatter — break long diagonal sightlines in larger rooms
    this.addCoverBox(cx - hw * 0.36, cz - hd * 0.36, 1.0, 1.0, 1.0);
    this.addCoverBox(cx + hw * 0.36, cz + hd * 0.36, 1.0, 1.0, 1.0);
  }

  private buildNestCover(room: Room): void {
    const cx = (room.minX + room.maxX) / 2;
    const cz = (room.minZ + room.maxZ) / 2;
    const hw = (room.maxX - room.minX) / 2;
    const hd = (room.maxZ - room.minZ) / 2;

    // Organic cluster — varied heights and sizes
    const ox = hw * 0.42;
    const oz = hd * 0.42;
    this.addCoverBox(cx - ox, cz - oz, 2.0, 1.2, 1.4);
    this.addCoverBox(cx + ox, cz - oz, 1.2, 2.0, 1.4);
    this.addCoverBox(cx - ox, cz + oz, 1.2, 2.0, 1.4);
    this.addCoverBox(cx + ox, cz + oz, 2.0, 1.2, 1.4);

    // Central ring blockers
    this.addCoverBox(cx,       cz - hd * 0.55, 3.6, 1.0, 1.1);
    this.addCoverBox(cx,       cz + hd * 0.55, 3.6, 1.0, 1.1);
    this.addCoverBox(cx - hw * 0.55, cz, 1.0, 3.6, 1.1);
    this.addCoverBox(cx + hw * 0.55, cz, 1.0, 3.6, 1.1);
  }

  private buildExtractionPad(): THREE.Mesh {
    const padGeo = new THREE.CircleGeometry(this.extraction.r, 28);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x66ff99,
      emissive: 0x33aa66,
      emissiveIntensity: 1.6,
      roughness: 0.25,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(this.extraction.x, 0.02, this.extraction.z);
    this.group.add(pad);

    const ringGeo = new THREE.RingGeometry(this.extraction.r * 1.05, this.extraction.r * 1.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x66ffaa,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(this.extraction.x, 0.03, this.extraction.z);
    this.group.add(ring);

    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 3, 10);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x66ffaa,
      emissive: 0x33ffaa,
      emissiveIntensity: 3,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(this.extraction.x, 1.5, this.extraction.z);
    this.group.add(beacon);

    const light = new THREE.PointLight(0x66ffaa, 3, 12);
    light.position.set(this.extraction.x, 2.8, this.extraction.z);
    this.group.add(light);

    return beacon;
  }

  private buildRoomLights(): void {
    for (const room of this.rooms) {
      const cx = (room.minX + room.maxX) / 2;
      const cz = (room.minZ + room.maxZ) / 2;
      if (room.type === "arena" || room.type === "nest") {
        // Two offset ceiling fixtures per large room
        const color = room.type === "nest" ? 0x8844aa : 0x3a5a80;
        const offX = (room.maxX - room.minX) * 0.22;
        const offZ = (room.maxZ - room.minZ) * 0.22;
        for (const [ox, oz] of [[-offX, -offZ], [offX, offZ]] as [number, number][]) {
          const l = new THREE.PointLight(color, 1.2, 14, 2);
          l.position.set(cx + ox, 4, cz + oz);
          this.group.add(l);
        }
      } else if (room.type === "corridor" || room.type === "start") {
        const l = new THREE.PointLight(0x2a3a50, 1.0, 10, 2);
        l.position.set(cx, 4, cz);
        this.group.add(l);
      }
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) m.dispose();
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

function overlap(a1: number, a2: number, b1: number, b2: number): Opening {
  return { min: Math.max(a1, b1), max: Math.min(a2, b2) };
}
