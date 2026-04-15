import * as THREE from "three";

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  container: HTMLElement;
  keyLight: THREE.DirectionalLight;
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
  scene.fog = new THREE.Fog(0x05070a, 30, 80);

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

  scene.add(new THREE.AmbientLight(0x3a4255, 0.85));

  const key = new THREE.DirectionalLight(0xffe2b2, 1.15);
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

  const rim = new THREE.DirectionalLight(0x6ea8ff, 0.45);
  rim.position.set(-10, 10, -10);
  scene.add(rim);

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

  return { renderer, scene, camera, container, keyLight: key };
}
