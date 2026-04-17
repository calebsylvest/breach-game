import * as THREE from "three";

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  container: HTMLElement;
  keyLight: THREE.DirectionalLight;
  playerLight: THREE.PointLight;
  flashLight: THREE.SpotLight;
  flashTarget: THREE.Object3D;
}

const FRUSTUM = 22;

export function createScene(container: HTMLElement): SceneCtx {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05070a);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070a, 18, 42);

  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.OrthographicCamera(
    (-FRUSTUM * aspect) / 2,
    (FRUSTUM * aspect) / 2,
    FRUSTUM / 2,
    -FRUSTUM / 2,
    0.1,
    200,
  );
  camera.position.set(16, 20, 16);
  camera.lookAt(0, 0, 0);

  // Low ambient — rooms are dark; player light + flashlight do the work
  scene.add(new THREE.AmbientLight(0x1a2030, 0.5));

  // Directional key light kept for shadow quality but dimmed
  const key = new THREE.DirectionalLight(0xffe2b2, 0.55);
  key.position.set(12, 22, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -24;
  key.shadow.camera.right = 24;
  key.shadow.camera.top = 24;
  key.shadow.camera.bottom = -24;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0005;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.DirectionalLight(0x6ea8ff, 0.15);
  rim.position.set(-10, 10, -10);
  scene.add(rim);

  // Player-carried point light — fills in close surroundings
  const playerLight = new THREE.PointLight(0xffe8c0, 5.0, 20, 2);
  playerLight.position.set(0, 3, 0);
  scene.add(playerLight);

  // Directional flashlight in aim direction — primary long-range visibility
  const flashTarget = new THREE.Object3D();
  scene.add(flashTarget);
  const flashLight = new THREE.SpotLight(0xf0f4ff, 4.5, 22, 0.38, 0.5, 2);
  flashLight.position.set(0, 3, 0);
  flashLight.target = flashTarget;
  flashLight.castShadow = false;
  scene.add(flashLight);

  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const a = w / h;
    camera.left = (-FRUSTUM * a) / 2;
    camera.right = (FRUSTUM * a) / 2;
    camera.top = FRUSTUM / 2;
    camera.bottom = -FRUSTUM / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { renderer, scene, camera, container, keyLight: key, playerLight, flashLight, flashTarget };
}
