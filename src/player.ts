import * as THREE from "three";
import type { Input } from "./input.ts";
import type { World } from "./world.ts";
import { resolveMovement } from "./collision.ts";

const PLAYER_RADIUS = 0.4;
const PLAYER_SPEED = 5;

export class Player {
  readonly group: THREE.Group;
  readonly position = new THREE.Vector3(0, 0, 0);
  readonly aim = new THREE.Vector3(1, 0, 0);
  hp = 100;

  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse2 = new THREE.Vector2();
  private readonly aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly tmp = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly worldUp = new THREE.Vector3(0, 1, 0);

  constructor() {
    this.group = new THREE.Group();

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.9, 6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2b6cd9,
      roughness: 0.5,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    this.group.add(body);

    const torsoGeo = new THREE.BoxGeometry(0.75, 0.45, 0.55);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x3a82f7,
      roughness: 0.4,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    this.group.add(torso);

    const headGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8e3,
      roughness: 0.5,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.75;
    head.castShadow = true;
    this.group.add(head);

    const gunGeo = new THREE.BoxGeometry(0.85, 0.15, 0.16);
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x0f1115,
      roughness: 0.6,
    });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.55, 1.15, 0);
    gun.castShadow = true;
    this.group.add(gun);
  }

  update(dt: number, input: Input, camera: THREE.Camera, world: World): void {
    this.updateAim(input, camera);
    this.updateMovement(dt, input, camera, world);
    this.group.position.set(this.position.x, 0, this.position.z);
  }

  private updateAim(input: Input, camera: THREE.Camera): void {
    this.mouse2.set(input.mouseNdcX, input.mouseNdcY);
    this.raycaster.setFromCamera(this.mouse2, camera);
    const hit = this.raycaster.ray.intersectPlane(this.aimPlane, this.tmp);
    if (!hit) return;
    const dx = hit.x - this.position.x;
    const dz = hit.z - this.position.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.001) return;
    this.aim.set(dx / len, 0, dz / len);
    this.group.rotation.y = Math.atan2(-dz, dx);
  }

  private updateMovement(
    dt: number,
    input: Input,
    camera: THREE.Camera,
    world: World,
  ): void {
    const m = input.movement();
    if (m.x === 0 && m.z === 0) return;

    camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    this.forward.normalize();
    this.right.crossVectors(this.forward, this.worldUp);

    const moveX = this.forward.x * -m.z + this.right.x * m.x;
    const moveZ = this.forward.z * -m.z + this.right.z * m.x;
    const mag = Math.hypot(moveX, moveZ);
    if (mag < 0.001) return;

    const step = PLAYER_SPEED * dt;
    const dxWorld = (moveX / mag) * step;
    const dzWorld = (moveZ / mag) * step;

    const resolved = resolveMovement(
      { x: this.position.x, z: this.position.z, r: PLAYER_RADIUS },
      dxWorld,
      dzWorld,
      world.colliders,
    );
    this.position.x = resolved.x;
    this.position.z = resolved.z;
  }
}
