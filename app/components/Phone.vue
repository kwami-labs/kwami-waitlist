<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  /** 0 = off-screen below, 1 = fully visible + settled */
  progress: number;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let renderer: any = null;
let scene: any = null;
let camera: any = null;
let phoneGroup: any = null;
let animId: number | null = null;
let idleT = 0;
let resizeHandler: (() => void) | null = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  containerRef.value.appendChild(canvas);

  const rect = containerRef.value.getBoundingClientRect();
  const w = rect.width || window.innerWidth / 2;
  const h = rect.height || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(0, 0.3, 7);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 5);
  scene.add(key);
  const rim1 = new THREE.DirectionalLight(0x359eee, 1.2);
  rim1.position.set(-3, 2, 2);
  scene.add(rim1);
  const rim2 = new THREE.DirectionalLight(0x03cea4, 0.8);
  rim2.position.set(3, -3, 3);
  scene.add(rim2);

  const animate = () => {
    animId = requestAnimationFrame(animate);
    idleT += 0.008;

    if (phoneGroup) {
      const p = Math.max(0, Math.min(1, props.progress));

      // Rise from below and then hold around mid-screen on the right.
      const targetY = -1.15 + (1 - p) * -8.5;
      phoneGroup.position.y += (targetY - phoneGroup.position.y) * 0.08;

      // Portrait phone with a diagonal tilt similar to the reference.
      const settledZ = -0.18;
      const introRotZ = (1 - p) * 0.95;
      const wantZ = settledZ + introRotZ;
      phoneGroup.rotation.z += (wantZ - phoneGroup.rotation.z) * 0.05;

      const settledRotY = -0.52;
      const introRotY = settledRotY + (1 - p) * (Math.PI * 0.38);
      const idleRotY = Math.sin(idleT * 0.22) * 0.04;
      phoneGroup.rotation.y += ((introRotY + idleRotY) - phoneGroup.rotation.y) * 0.05;

      const settledRotX = -0.06;
      const introRotX = settledRotX + (1 - p) * -0.16;
      const idleRotX = Math.sin(idleT * 0.15) * 0.012;
      phoneGroup.rotation.x += ((introRotX + idleRotX) - phoneGroup.rotation.x) * 0.05;

      // Fade in
      const opacity = Math.min(1, p * 2.5);
      phoneGroup.traverse((node: any) => {
        if (!node.isMesh || !node.material) return;
        if (node.material.opacity !== undefined) {
          node.material.transparent = opacity < 1;
          node.material.opacity = opacity;
        }
      });
    }

    if (renderer && scene && camera) renderer.render(scene, camera);
  };
  animate();

  try {
    const gltf = await new GLTFLoader().loadAsync('/phone.glb');
    phoneGroup = gltf.scene;

    const box = new THREE.Box3().setFromObject(phoneGroup);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 3.15 / maxDim;
    phoneGroup.scale.setScalar(s);

    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    phoneGroup.position.set(-center.x, -center.y - 8.5, -center.z);

    phoneGroup.traverse((node: any) => {
      if (!node.isMesh) return;
      const name: string = (node.name ?? '').toLowerCase();
      if (
        name.includes('screen') || name.includes('display') ||
        name.includes('glass') || name.includes('lcd') || name.includes('front')
      ) {
        node.material = node.material.clone();
        node.material.transparent = true;
        node.material.opacity = 0.05;
      }
    });

    scene.add(phoneGroup);
  } catch (err) {
    console.error('[Phone] Failed to load phone.glb:', err);
  }

  resizeHandler = () => {
    if (!renderer || !camera || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const w = rect.width || window.innerWidth / 2;
    const h = rect.height || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resizeHandler, { passive: true });
});

onUnmounted(() => {
  if (animId !== null) cancelAnimationFrame(animId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  if (renderer) { renderer.dispose(); renderer = null; }
  scene = null; camera = null; phoneGroup = null;
});
</script>

<template>
  <div ref="containerRef" class="phone-wrap" aria-hidden="true" />
</template>

<style scoped>
.phone-wrap {
  position: fixed;
  top: 0;
  right: 0;
  width: 50vw;
  height: 100dvh;
  z-index: 2;
  pointer-events: none;
}
</style>
