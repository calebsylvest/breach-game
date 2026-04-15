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

const LEVEL_SPEC: RoomSpec[] = [
  { type: "start", width: 14, depth: 14 },
  { type: "corridor", width: 6, depth: 4 },
  { type: "arena", width: 18, depth: 16 },
  { type: "corridor", width: 6, depth: 4 },
  { type: "nest", width: 14, depth: 14 },
  { type: "corridor", width: 6, depth: 4 },
  { type: "extraction", width: 12, depth: 12 },
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

  constructor() {
    this.rooms = this.layoutRooms();
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
    this.extractionBeacon = this.buildExtractionPad();
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

  private layoutRooms(): Room[] {
    const rooms: Room[] = [];
    let cursor = 0;
    for (const spec of LEVEL_SPEC) {
      const halfD = spec.depth / 2;
      rooms.push({
        type: spec.type,
        minX: cursor,
        maxX: cursor + spec.width,
        minZ: -halfD,
        maxZ: halfD,
      });
      cursor += spec.width;
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.addCollider(x, z, sx, sz);
  }

  private buildFloor(): void {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const pad = 4;
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

  private buildCover(): void {
    for (const room of this.rooms) {
      if (room.type !== "arena" && room.type !== "nest") continue;
      const cx = (room.minX + room.maxX) / 2;
      const cz = (room.minZ + room.maxZ) / 2;
      const qw = (room.maxX - room.minX) / 4;
      const qd = (room.maxZ - room.minZ) / 4;
      this.addCoverBox(cx - qw, cz - qd, 1.4, 1.4);
      this.addCoverBox(cx + qw, cz - qd, 1.4, 1.4);
      this.addCoverBox(cx - qw, cz + qd, 1.4, 1.4);
      this.addCoverBox(cx + qw, cz + qd, 1.4, 1.4);
      if (room.type === "nest") {
        this.addCoverBox(cx, cz + qd * 1.3, 2.2, 1.0);
      }
    }
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
}

function overlap(a1: number, a2: number, b1: number, b2: number): Opening {
  return { min: Math.max(a1, b1), max: Math.min(a2, b2) };
}
