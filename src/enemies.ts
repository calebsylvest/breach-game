import * as THREE from "three";
import type { Player } from "./player.ts";
import type { World } from "./world.ts";
import { resolveMovement } from "./collision.ts";

export type EnemyType = "scuttler" | "brute" | "spitter" | "lurker" | "nest";

type Behavior = "chase" | "keepDistance" | "ambush" | "stationary";

interface TypeDef {
  maxHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  contactCooldown: number;
  behavior: Behavior;
  preferredDistance?: number;
  retreatDistance?: number;
  attackRange?: number;
  attackCooldown?: number;
  attackDamage?: number;
  ambushRevealRange?: number;
  spawnType?: EnemyType;
  spawnInterval?: number;
}

const TYPES: Record<EnemyType, TypeDef> = {
  scuttler: {
    maxHp: 30,
    speed: 4.5,
    radius: 0.38,
    contactDamage: 10,
    contactCooldown: 0.7,
    behavior: "chase",
  },
  brute: {
    maxHp: 250,
    speed: 2.0,
    radius: 0.75,
    contactDamage: 40,
    contactCooldown: 1.2,
    behavior: "chase",
  },
  spitter: {
    maxHp: 80,
    speed: 3.0,
    radius: 0.42,
    contactDamage: 0,
    contactCooldown: 0,
    behavior: "keepDistance",
    preferredDistance: 9,
    retreatDistance: 5,
    attackRange: 16,
    attackCooldown: 1.8,
    attackDamage: 25,
  },
  lurker: {
    maxHp: 100,
    speed: 3.8,
    radius: 0.42,
    contactDamage: 50,
    contactCooldown: 2.0,
    behavior: "ambush",
    ambushRevealRange: 5,
  },
  nest: {
    maxHp: 400,
    speed: 0,
    radius: 0.9,
    contactDamage: 0,
    contactCooldown: 0,
    behavior: "stationary",
    spawnType: "scuttler",
    spawnInterval: 4,
  },
};

interface Enemy {
  type: EnemyType;
  alive: boolean;
  position: THREE.Vector3;
  hp: number;
  contactTimer: number;
  attackTimer: number;
  spawnTimer: number;
  revealed: boolean;
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  extraMats: THREE.MeshStandardMaterial[];
  hitFlash: number;
}

const HIT_FLASH_DURATION = 0.1;
const SPAWN_INTERVAL = 2.2;
const SPAWN_BURST_MIN = 2;
const SPAWN_BURST_MAX = 4;
const MIN_SPAWN_DIST = 9;
const MAX_SPAWN_DIST = 16;
const MAX_ALIVE = 24;
const LURKER_OPACITY_HIDDEN = 0.12;

export class EnemyManager {
  readonly enemies: Enemy[] = [];
  readonly spits: SpitSystem;
  private readonly group = new THREE.Group();
  private spawnTimer = SPAWN_INTERVAL;
  killCount = 0;

  constructor(parent: THREE.Scene) {
    parent.add(this.group);
    this.spits = new SpitSystem(parent);
  }

  aliveCount(): number {
    let n = 0;
    for (const e of this.enemies) if (e.alive) n++;
    return n;
  }

  spawn(type: EnemyType, x: number, z: number): Enemy {
    let e = this.enemies.find((en) => !en.alive && en.type === type);
    if (!e) {
      e = this.create(type);
      this.enemies.push(e);
      this.group.add(e.group);
    }
    const def = TYPES[type];
    e.alive = true;
    e.group.visible = true;
    e.position.set(x, 0, z);
    e.group.position.copy(e.position);
    e.hp = def.maxHp;
    e.contactTimer = 0;
    e.attackTimer = def.attackCooldown ?? 0;
    e.spawnTimer = def.spawnInterval ?? 0;
    e.revealed = def.behavior !== "ambush";
    e.hitFlash = 0;
    e.bodyMat.emissive.setRGB(0, 0, 0);
    this.applyLurkerVisibility(e);
    return e;
  }

  update(dt: number, player: Player, world: World): void {
    this.spits.update(dt, player, world);
    if (player.hp <= 0) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      this.updateEnemy(e, dt, player, world);
    }
  }

  tickSpawner(dt: number, playerPos: THREE.Vector3, world: World): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = SPAWN_INTERVAL;
    if (this.aliveCount() >= MAX_ALIVE) return;

    const count =
      SPAWN_BURST_MIN +
      Math.floor(Math.random() * (SPAWN_BURST_MAX - SPAWN_BURST_MIN + 1));
    for (let i = 0; i < count; i++) {
      const point = world.randomSpawnPointAround(
        playerPos.x,
        playerPos.z,
        MIN_SPAWN_DIST,
        MAX_SPAWN_DIST,
      );
      if (point) this.spawn("scuttler", point.x, point.z);
    }
  }

  damageAtPoint(point: THREE.Vector3, amount: number): Enemy | null {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = point.x - e.position.x;
      const dz = point.z - e.position.z;
      const r = TYPES[e.type].radius;
      if (dx * dx + dz * dz <= r * r) {
        if (e.type === "lurker") e.revealed = true;
        this.damage(e, amount);
        return e;
      }
    }
    return null;
  }

  private damage(e: Enemy, amount: number): void {
    e.hp -= amount;
    e.hitFlash = HIT_FLASH_DURATION;
    if (e.hp <= 0) {
      e.alive = false;
      e.group.visible = false;
      this.killCount++;
    }
  }

  private create(type: EnemyType): Enemy {
    const built = buildMesh(type);
    built.group.visible = false;
    return {
      type,
      alive: false,
      position: new THREE.Vector3(),
      hp: 0,
      contactTimer: 0,
      attackTimer: 0,
      spawnTimer: 0,
      revealed: true,
      group: built.group,
      bodyMat: built.bodyMat,
      extraMats: built.extraMats,
      hitFlash: 0,
    };
  }

  private updateEnemy(e: Enemy, dt: number, player: Player, world: World): void {
    const def = TYPES[e.type];
    const dx = player.position.x - e.position.x;
    const dz = player.position.z - e.position.z;
    const distSq = dx * dx + dz * dz;
    const dist = Math.sqrt(distSq);

    let moveX = 0;
    let moveZ = 0;

    switch (def.behavior) {
      case "chase":
        if (dist > 0.05) {
          moveX = dx / dist;
          moveZ = dz / dist;
        }
        break;
      case "keepDistance":
        if (dist < def.retreatDistance!) {
          moveX = -dx / dist;
          moveZ = -dz / dist;
        } else if (dist > def.preferredDistance! + 1.5) {
          moveX = (dx / dist) * 0.6;
          moveZ = (dz / dist) * 0.6;
        }
        break;
      case "ambush":
        if (!e.revealed && dist < def.ambushRevealRange!) {
          e.revealed = true;
        }
        if (e.revealed && dist > 0.05) {
          moveX = dx / dist;
          moveZ = dz / dist;
        }
        break;
      case "stationary":
        break;
    }

    if (moveX !== 0 || moveZ !== 0) {
      const step = def.speed * dt;
      const resolved = resolveMovement(
        { x: e.position.x, z: e.position.z, r: def.radius },
        moveX * step,
        moveZ * step,
        world.colliders,
      );
      e.position.x = resolved.x;
      e.position.z = resolved.z;
      e.group.position.copy(e.position);
    }

    if (def.behavior !== "stationary" && (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01)) {
      e.group.rotation.y = Math.atan2(-dz, dx);
    }

    e.contactTimer -= dt;
    if (def.contactDamage > 0 && e.contactTimer <= 0) {
      const touchR = def.radius + 0.42;
      if (distSq < touchR * touchR) {
        player.damage(def.contactDamage);
        e.contactTimer = def.contactCooldown;
      }
    }

    if (def.behavior === "keepDistance" && def.attackRange !== undefined) {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0 && dist < def.attackRange && dist > 0.5) {
        this.spits.spawn(e.position, dx / dist, dz / dist, def.attackDamage!);
        e.attackTimer = def.attackCooldown!;
      }
    }

    if (def.behavior === "stationary" && def.spawnType) {
      e.spawnTimer -= dt;
      if (e.spawnTimer <= 0 && this.aliveCount() < MAX_ALIVE) {
        e.spawnTimer = def.spawnInterval!;
        const angle = Math.random() * Math.PI * 2;
        const r = def.radius + 0.7;
        this.spawn(
          def.spawnType,
          e.position.x + Math.cos(angle) * r,
          e.position.z + Math.sin(angle) * r,
        );
      }
    }

    if (def.behavior === "ambush") {
      this.applyLurkerVisibility(e);
    }

    if (e.hitFlash > 0) {
      e.hitFlash -= dt;
      const t = Math.max(0, e.hitFlash / HIT_FLASH_DURATION);
      e.bodyMat.emissive.setRGB(t, t * 0.9, t * 0.9);
    } else if (e.bodyMat.emissive.r !== 0) {
      e.bodyMat.emissive.setRGB(0, 0, 0);
    }
  }

  private applyLurkerVisibility(e: Enemy): void {
    if (e.type !== "lurker") return;
    const target = e.revealed ? 1 : LURKER_OPACITY_HIDDEN;
    if (e.bodyMat.opacity !== target) {
      e.bodyMat.opacity = target;
      for (const m of e.extraMats) m.opacity = target;
    }
  }
}

interface Spit {
  mesh: THREE.Mesh;
  alive: boolean;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
}

const SPIT_SPEED = 16;
const SPIT_LIFE = 2.5;
const SPIT_POOL_SIZE = 48;
const SPIT_HIT_RADIUS = 0.55;

class SpitSystem {
  private readonly items: Spit[] = [];
  private readonly group = new THREE.Group();

  constructor(parent: THREE.Scene) {
    parent.add(this.group);
    const geo = new THREE.SphereGeometry(0.2, 8, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x66ff66,
      emissive: 0x33ff33,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    });
    for (let i = 0; i < SPIT_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.items.push({
        mesh,
        alive: false,
        velocity: new THREE.Vector3(),
        life: 0,
        damage: 0,
      });
    }
  }

  spawn(origin: THREE.Vector3, dirX: number, dirZ: number, damage: number): void {
    for (const s of this.items) {
      if (s.alive) continue;
      s.alive = true;
      s.mesh.visible = true;
      s.mesh.position.set(origin.x, 1.0, origin.z);
      s.velocity.set(dirX * SPIT_SPEED, 0, dirZ * SPIT_SPEED);
      s.life = SPIT_LIFE;
      s.damage = damage;
      return;
    }
  }

  update(dt: number, player: Player, world: World): void {
    for (const s of this.items) {
      if (!s.alive) continue;
      s.life -= dt;
      if (s.life <= 0) {
        this.retire(s);
        continue;
      }
      s.mesh.position.addScaledVector(s.velocity, dt);
      if (world.collidesPoint(s.mesh.position)) {
        this.retire(s);
        continue;
      }
      const dx = s.mesh.position.x - player.position.x;
      const dz = s.mesh.position.z - player.position.z;
      if (dx * dx + dz * dz < SPIT_HIT_RADIUS * SPIT_HIT_RADIUS) {
        player.damage(s.damage);
        this.retire(s);
      }
    }
  }

  private retire(s: Spit): void {
    s.alive = false;
    s.mesh.visible = false;
  }
}

interface MeshBundle {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  extraMats: THREE.MeshStandardMaterial[];
}

function buildMesh(type: EnemyType): MeshBundle {
  switch (type) {
    case "scuttler":
      return buildScuttler();
    case "brute":
      return buildBrute();
    case "spitter":
      return buildSpitter();
    case "lurker":
      return buildLurker();
    case "nest":
      return buildNest();
  }
}

function buildScuttler(): MeshBundle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8f2f2f,
    roughness: 0.55,
    emissive: 0x000000,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bodyMat);
  body.position.y = 0.38;
  body.scale.set(1.1, 0.85, 1);
  body.castShadow = true;
  group.add(body);

  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0x1a0606,
    roughness: 0.4,
  });
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 6), spikeMat);
  spike.rotation.z = -Math.PI / 2;
  spike.position.set(0.35, 0.38, 0);
  spike.castShadow = true;
  group.add(spike);

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x3e1414,
    roughness: 0.7,
  });
  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.42), legMat);
    const angle = (i / 6) * Math.PI * 2;
    leg.position.set(Math.cos(angle) * 0.3, 0.14, Math.sin(angle) * 0.3);
    leg.rotation.y = angle + Math.PI / 2;
    leg.castShadow = true;
    group.add(leg);
  }
  return { group, bodyMat, extraMats: [] };
}

function buildBrute(): MeshBundle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x5a2424,
    roughness: 0.65,
    emissive: 0x000000,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.1), bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x2e1010,
    roughness: 0.4,
    metalness: 0.4,
  });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 1.25), plateMat);
  plate.position.y = 1.3;
  plate.castShadow = true;
  group.add(plate);

  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x704040,
    roughness: 0.5,
  });
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 6), hornMat);
    horn.position.set(0.55, 1.55, 0.3 * side);
    horn.rotation.z = -Math.PI / 3;
    horn.castShadow = true;
    group.add(horn);
  }

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a0a0a, roughness: 0.7 });
  for (const x of [-0.4, 0.4]) {
    for (const z of [-0.35, 0.35]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), legMat);
      leg.position.set(x, 0.25, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }
  return { group, bodyMat, extraMats: [] };
}

function buildSpitter(): MeshBundle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x446626,
    roughness: 0.55,
    emissive: 0x000000,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.0, 6, 10), bodyMat);
  body.position.y = 0.9;
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  const headMat = new THREE.MeshStandardMaterial({
    color: 0x99ff66,
    emissive: 0x224411,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), headMat);
  head.position.set(0.55, 0.95, 0);
  head.castShadow = true;
  group.add(head);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x223311, roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), legMat);
    const side = i < 2 ? 1 : -1;
    const front = i % 2 === 0 ? 0.25 : -0.25;
    leg.position.set(front, 0.35, side * 0.35);
    leg.castShadow = true;
    group.add(leg);
  }
  return { group, bodyMat, extraMats: [] };
}

function buildLurker(): MeshBundle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xaabbcc,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x000000,
    transparent: true,
    opacity: LURKER_OPACITY_HIDDEN,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), bodyMat);
  body.position.y = 0.85;
  body.scale.set(1.0, 1.3, 1.0);
  body.castShadow = false;
  group.add(body);

  const tendrilMat = new THREE.MeshStandardMaterial({
    color: 0x88aabb,
    roughness: 0.3,
    transparent: true,
    opacity: LURKER_OPACITY_HIDDEN,
  });
  for (let i = 0; i < 5; i++) {
    const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.7, 6), tendrilMat);
    const angle = (i / 5) * Math.PI * 2;
    tendril.position.set(Math.cos(angle) * 0.3, 0.4, Math.sin(angle) * 0.3);
    tendril.rotation.z = Math.cos(angle) * 0.3;
    tendril.rotation.x = Math.sin(angle) * 0.3;
    group.add(tendril);
  }
  return { group, bodyMat, extraMats: [tendrilMat] };
}

function buildNest(): MeshBundle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x663322,
    roughness: 0.85,
    emissive: 0x221100,
    emissiveIntensity: 0.5,
  });
  const base = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), bodyMat);
  base.position.y = 0.9;
  base.scale.set(1, 0.75, 1);
  base.castShadow = true;
  group.add(base);

  const sacMat = new THREE.MeshStandardMaterial({
    color: 0xcc4444,
    emissive: 0x551111,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });
  for (let i = 0; i < 5; i++) {
    const sac = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.12, 8, 6), sacMat);
    const angle = (i / 5) * Math.PI * 2;
    sac.position.set(Math.cos(angle) * 0.7, 1.25 + Math.random() * 0.3, Math.sin(angle) * 0.7);
    sac.castShadow = true;
    group.add(sac);
  }
  return { group, bodyMat, extraMats: [] };
}
