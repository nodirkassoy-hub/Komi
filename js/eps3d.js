/* ============================================================
   PENAPLAST — ultra-realistic EPS foam 3D viewer (Three.js)
   Real bead geometry (instanced spheres) + procedural foam texture
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Procedural EPS foam texture: bead speckle used as map + bump */
function foamTexture(material) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const white = material === 'white';
  x.fillStyle = white ? '#e8edf5' : '#14171d';
  x.fillRect(0, 0, S, S);
  // gaps
  for (let i = 0; i < 900; i++) {
    x.fillStyle = white ? 'rgba(120,135,160,0.25)' : 'rgba(0,0,0,0.5)';
    x.beginPath();
    x.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 2.4, 0, 7);
    x.fill();
  }
  // beads
  for (let i = 0; i < 2400; i++) {
    const r = 2 + Math.random() * 4.2;
    const px = Math.random() * S;
    const py = Math.random() * S;
    const g = x.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r);
    if (white) {
      const l = 88 + Math.random() * 10;
      g.addColorStop(0, `hsl(220,18%,${Math.min(l + 6, 99)}%)`);
      g.addColorStop(0.65, `hsl(220,14%,${l}%)`);
      g.addColorStop(1, 'hsl(220,16%,72%)');
    } else {
      const l = 9 + Math.random() * 9;
      g.addColorStop(0, `hsl(220,14%,${l + 9}%)`);
      g.addColorStop(0.65, `hsl(222,12%,${l}%)`);
      g.addColorStop(1, 'hsl(224,16%,4%)');
    }
    x.fillStyle = g;
    x.beginPath();
    x.arc(px, py, r, 0, 7);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const rand = (a, b) => a + Math.random() * (b - a);

/**
 * Create an EPS viewer on a <canvas>.
 * Returns { setMaterial, setThickness, setDensity, dispose }.
 */
export function createEpsViewer(canvas, opts = {}) {
  const o = {
    material: 'white',
    thickness: 5,
    density: 15,
    autoRotate: true,
    ...opts,
  };

  const parent = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(4.4, 2.7, 5.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  // Lights
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x0a0f18, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(4, 6.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.PointLight(0x3f8cff, 30, 30, 1.8);
  rim.position.set(-4.5, 1.6, -3.2);
  scene.add(rim);
  const fill = new THREE.PointLight(0x6ee7ff, 6, 20, 2);
  fill.position.set(3.4, -0.6, 3.4);
  scene.add(fill);

  // Ground shadow + soft AO disc
  const groundY = -1.5;
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 48),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;
  scene.add(ground);

  const W = 3.0;
  const H = 2.0;
  const depthFor = (t) => 0.35 + ((Math.min(Math.max(t, 1), 60) - 1) / 59) * 1.9;

  const block = new THREE.Group();
  scene.add(block);

  const texCache = {};
  const getTex = (m) => texCache[m] || (texCache[m] = foamTexture(m));

  let core = null;
  let beads = null;
  const beadGeo = new THREE.IcosahedronGeometry(1, 1);
  const beadMat = new THREE.MeshStandardMaterial({
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.32,
  });

  const isMobile = () => parent.clientWidth < 620;

  function buildCore() {
    const D = depthFor(o.thickness);
    const map = getTex(o.material);
    if (core) {
      core.geometry.dispose();
      core.material.dispose();
      block.remove(core);
    }
    core = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, D),
      new THREE.MeshStandardMaterial({
        map,
        bumpMap: map,
        bumpScale: 0.6,
        roughness: 0.94,
        metalness: 0,
        envMapIntensity: 0.25,
      })
    );
    core.castShadow = true;
    core.receiveShadow = true;
    block.add(core);
  }

  function buildBeads() {
    if (beads) {
      block.remove(beads);
      beads.dispose();
    }
    const D = depthFor(o.thickness);
    // Higher density -> slightly smaller, tighter beads
    const densK = 1.14 - ((Math.min(Math.max(o.density, 7), 20) - 7) / 13) * 0.3;
    const step = (isMobile() ? 0.098 : 0.078) * densK;
    const rBase = step * 0.62;

    const mats = [];
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const white = o.material === 'white';

    const faces = [
      { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], su: W, sv: H, off: D / 2 },
      { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], su: W, sv: H, off: D / 2 },
      { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], su: W, sv: D, off: H / 2 },
      { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], su: W, sv: D, off: H / 2 },
      { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], su: D, sv: H, off: W / 2 },
      { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], su: D, sv: H, off: W / 2 },
    ];

    const items = [];
    for (const f of faces) {
      const nu = Math.max(2, Math.round(f.su / step));
      const nv = Math.max(2, Math.round(f.sv / step));
      for (let iu = 0; iu <= nu; iu++) {
        for (let iv = 0; iv <= nv; iv++) {
          const au = (iu / nu - 0.5) * (f.su + step * 0.7) + rand(-step * 0.28, step * 0.28);
          const av = (iv / nv - 0.5) * (f.sv + step * 0.7) + rand(-step * 0.28, step * 0.28);
          const embed = rand(0.1, 0.5);
          items.push({
            p: [
              f.n[0] * (f.off + rBase * embed) + f.u[0] * au + f.v[0] * av,
              f.n[1] * (f.off + rBase * embed) + f.u[1] * au + f.v[1] * av,
              f.n[2] * (f.off + rBase * embed) + f.u[2] * au + f.v[2] * av,
            ],
            s: rBase * rand(0.72, 1.28),
          });
        }
      }
    }

    beads = new THREE.InstancedMesh(beadGeo, beadMat, items.length);
    items.forEach((it, i) => {
      dummy.position.set(...it.p);
      dummy.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      dummy.scale.set(it.s, it.s * rand(0.85, 1.1), it.s);
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
      if (white) col.setHSL(0.585, rand(0.05, 0.14), rand(0.87, 0.97));
      else col.setHSL(0.6, rand(0.06, 0.14), rand(0.07, 0.15));
      beads.setColorAt(i, col);
    });
    beads.instanceMatrix.needsUpdate = true;
    if (beads.instanceColor) beads.instanceColor.needsUpdate = true;
    beads.castShadow = true;
    beads.receiveShadow = true;
    block.add(beads);
    mats.push(beads);
    return mats;
  }

  // Ambient dust
  const dustGeo = new THREE.BufferGeometry();
  {
    const N = 130;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = rand(-4, 4);
      pos[i * 3 + 1] = rand(-1.4, 3);
      pos[i * 3 + 2] = rand(-3, 3);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  }
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0x6ee7ff, size: 0.022, transparent: true, opacity: 0.45,
      depthWrite: false, sizeAttenuation: true,
    })
  );
  scene.add(dust);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 11;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.target.set(0, -0.05, 0);
  controls.autoRotate = o.autoRotate && !reduced();
  controls.autoRotateSpeed = 0.9;
  let resumeT = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(resumeT);
  });
  controls.addEventListener('end', () => {
    clearTimeout(resumeT);
    if (o.autoRotate && !reduced()) {
      resumeT = setTimeout(() => {
        controls.autoRotate = true;
      }, 2600);
    }
  });

  // Sizing
  function resize() {
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  resize();

  // Render loop (only while visible)
  let running = true;
  let raf = 0;
  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    controls.update();
    if (!reduced()) {
      dust.rotation.y += 0.0009;
      block.position.y = Math.sin(performance.now() * 0.0006) * 0.045;
    }
    renderer.render(scene, camera);
  };
  const vis = new IntersectionObserver(
    (en) => {
      const v = en[0].isIntersecting && !document.hidden;
      if (v && !running) {
        running = true;
        loop();
      } else if (!v) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0.02 }
  );
  vis.observe(canvas);

  buildCore();
  buildBeads();
  loop();

  return {
    setMaterial(m) {
      if (m !== 'white' && m !== 'black') return;
      o.material = m;
      buildCore();
      buildBeads();
    },
    setThickness(t) {
      o.thickness = t;
      buildCore();
      buildBeads();
    },
    setDensity(d) {
      o.density = d;
      buildBeads();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resumeT);
      vis.disconnect();
      ro.disconnect();
      controls.dispose();
      beadGeo.dispose();
      beadMat.dispose();
      dustGeo.dispose();
      dust.material.dispose();
      Object.values(texCache).forEach((tx) => tx.dispose());
      if (core) {
        core.geometry.dispose();
        core.material.dispose();
      }
      if (beads) beads.dispose();
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
