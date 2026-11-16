// The 3D island: heightmap terrain in vertex colours, ocean, sky with sun and
// drifting clouds, fog for depth, instanced palms / rocks / flowers / grass,
// a small village, a wooden dock, signposted fishing spots in four zones.

import * as THREE from 'three';
import { WORLD, ZONES } from './config.js';
import { mulberry32, range } from './random.js';

/** Terrain height at (x, z): island falloff, gentle noise, volcano cone in the north-east. */
export function groundHeight(x, z) {
  const d = Math.hypot(x, z);
  const island = 1 - smoothstep(30, 55, d);
  const noise = 0.55 * Math.sin(x * 0.32) * Math.cos(z * 0.29) + 0.3 * Math.sin(x * 0.11 + z * 0.17);
  const volcano = 13 * Math.exp(-((x - WORLD.volcanoX) ** 2 + (z - WORLD.volcanoZ) ** 2) / 220);
  return Math.max(-1.5, 0.9 + 4.2 * island + noise * island + volcano);
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Which zone a position is in (by quadrant; the village heart counts as Sunny Beach). */
export function zoneAt(x, z) {
  if (Math.abs(x) < 9 && Math.abs(z) < 9) return 'sunny';
  if (x < 0 && z >= 0) return 'sunny';
  if (x >= 0 && z >= 0) return 'coral';
  if (x < 0 && z < 0) return 'misty';
  return 'ember';
}

function zoneById(id) {
  return ZONES.find((zone) => zone.id === id) ?? ZONES[0];
}

/** A small canvas texture with a zone name, for signposts (drawn at run time, no network). */
function nameTexture(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#f2d492';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = color;
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

/** Build the whole island into the scene. Returns live handles for the game loop. */
export function createWorld(scene) {
  const rng = mulberry32(1337);
  const group = new THREE.Group();
  scene.add(group);

  // ---- terrain: displaced plane, vertex colours by height and zone tint
  const terrainGeo = new THREE.PlaneGeometry(150, 150, 72, 72);
  terrainGeo.rotateX(-Math.PI / 2);
  const positions = terrainGeo.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const sand = new THREE.Color(0xf2d492);
  const grass = new THREE.Color(0x58c96b);
  const rock = new THREE.Color(0x8d99ae);
  const snow = new THREE.Color(0xf8f9fa);
  const tmp = new THREE.Color();
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const h = groundHeight(x, z);
    positions.setY(i, h);
    const zone = zoneById(zoneAt(x, z));
    tmp.set(zone.grass);
    if (h < 1.3) tmp.copy(sand).lerp(new THREE.Color(zone.sand), 0.6);
    else if (h < 7.5) tmp.lerp(grass, 0.55);
    else if (h < 11) tmp.copy(rock);
    else tmp.copy(snow);
    // Ember zone: darken the grass, redden the sand.
    if (zone.id === 'ember') tmp.multiplyScalar(0.85);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  group.add(terrain);

  // ---- ocean: two overlapping planes, gently bobbing
  const waterMat = new THREE.MeshPhongMaterial({ color: 0x2fa8c9, transparent: true, opacity: 0.82, shininess: 120, specular: 0x99ddff });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = WORLD.waterY;
  group.add(water);
  const water2 = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshPhongMaterial({ color: 0x1b7f9e, transparent: true, opacity: 0.35, shininess: 80 }));
  water2.rotation.x = -Math.PI / 2;
  water2.position.y = WORLD.waterY - 0.08;
  group.add(water2);

  // ---- sky: sun disc and drifting clouds
  const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0xffe066, fog: false }));
  sun.position.set(-70, 62, -110);
  sun.lookAt(0, 0, 0);
  group.add(sun);
  const clouds = [];
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 9; i += 1) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p += 1) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(range(rng, 2.5, 5), 10, 8), cloudMat);
      s.position.set(p * 3.4 - puffs * 1.6, range(rng, -0.6, 0.6), range(rng, -1.5, 1.5));
      s.scale.y = 0.55;
      cloud.add(s);
    }
    cloud.position.set(range(rng, -90, 90), range(rng, 26, 42), range(rng, -90, 60));
    cloud.userData.speed = range(rng, 0.4, 1.1);
    clouds.push(cloud);
    group.add(cloud);
  }

  // ---- instanced vegetation: palms, rocks, flowers, grass tufts
  const dummy = new THREE.Object3D();
  function scatter(count, place) {
    const spots = [];
    let guard = 0;
    while (spots.length < count && guard < count * 40) {
      guard += 1;
      const x = range(rng, -52, 52);
      const z = range(rng, -52, 52);
      const h = groundHeight(x, z);
      if (h < 1.4 || h > 10.5) continue;
      if (Math.hypot(x, z) < 12) continue; // keep the village clear
      spots.push([x, h, z]);
    }
    return spots;
  }

  const palmSpots = scatter(42, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 3.4, 6);
  const trunkMat = lambert(0x8a5a3b);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
  const leafGeo = new THREE.ConeGeometry(1.1, 2.0, 4);
  const leafMat = lambert(0x2f9e44, { flatShading: true });
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, palmSpots.length * 5);
  palmSpots.forEach(([x, h, z], i) => {
    const lean = range(rng, -0.12, 0.12);
    dummy.position.set(x, h + 1.7, z);
    dummy.rotation.set(lean, rng() * Math.PI * 2, 0);
    dummy.scale.setScalar(range(rng, 0.85, 1.3));
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let l = 0; l < 5; l += 1) {
      const a = (l / 5) * Math.PI * 2;
      dummy.position.set(x + Math.cos(a) * 0.9, h + 3.5, z + Math.sin(a) * 0.9);
      dummy.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
      dummy.scale.set(1, 0.55, 1);
      dummy.updateMatrix();
      leaves.setMatrixAt(i * 5 + l, dummy.matrix);
    }
  });
  group.add(trunks, leaves);

  const rockSpots = scatter(55, 0);
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), lambert(0x8d99ae, { flatShading: true }), rockSpots.length);
  rockSpots.forEach(([x, h, z], i) => {
    dummy.position.set(x, h + 0.2, z);
    dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    dummy.scale.set(range(rng, 0.3, 1.4), range(rng, 0.25, 0.9), range(rng, 0.3, 1.4));
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  });
  group.add(rocks);

  const flowerSpots = scatter(90, 0);
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 6, 5), lambert(0xff6b9d), flowerSpots.length);
  const flowerColors = [0xff6b9d, 0xffd60a, 0xb26bff, 0xffffff, 0xff8500];
  flowerSpots.forEach(([x, h, z], i) => {
    dummy.position.set(x, h + 0.28, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(range(rng, 0.7, 1.4));
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color(flowerColors[i % flowerColors.length]));
  });
  group.add(flowers);

  const grassSpots = scatter(130, 0);
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.9, 4), lambert(0x2f9e44, { flatShading: true }), grassSpots.length);
  grassSpots.forEach(([x, h, z], i) => {
    dummy.position.set(x, h + 0.4, z);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.setScalar(range(rng, 0.7, 1.6));
    dummy.updateMatrix();
    tufts.setMatrixAt(i, dummy.matrix);
  });
  group.add(tufts);

  // ---- village: huts, market stalls, lanterns, stone path
  const village = new THREE.Group();
  village.position.set(0, groundHeight(0, 16), 16);
  group.add(village);
  function hut(x, z, w, wallColor, roofColor) {
    const g = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, w), lambert(wallColor));
    walls.position.y = 1.1;
    g.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.95, 1.8, 4), lambert(roofColor, { flatShading: true }));
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), lambert(0x5c3a21));
    door.position.set(0, 0.75, w / 2 + 0.05);
    g.add(door);
    g.position.set(x, 0, z);
    g.rotation.y = range(rng, -0.4, 0.4);
    village.add(g);
  }
  hut(-6, -3, 3.4, 0xf2d492, 0xe63946);
  hut(6, -4, 3.0, 0xffe8b3, 0x3fa9f5);
  hut(-7, 4, 2.8, 0xf6e27a, 0x58c96b);
  hut(7, 3, 3.2, 0xf2d492, 0xff8500);
  function stall(x, z, color) {
    const g = new THREE.Group();
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.4), lambert(0x8a5a3b));
    counter.position.y = 0.5;
    g.add(counter);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2), lambert(color));
    awning.position.y = 2.4;
    g.add(awning);
    for (const px of [-1.5, 1.5]) {
      for (const pz of [-0.8, 0.8]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), lambert(0x5c3a21));
        pole.position.set(px, 1.2, pz);
        g.add(pole);
      }
    }
    const goods = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.0), lambert(0xffd60a));
    goods.position.y = 1.2;
    g.add(goods);
    g.position.set(x, 0, z);
    village.add(g);
  }
  stall(-2.5, -8, 0xff6b9d);
  stall(3.5, -8, 0x3fa9f5);
  for (let i = 0; i < 6; i += 1) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), lambert(0x5c3a21));
    const angle = (i / 6) * Math.PI * 2;
    pole.position.set(Math.cos(angle) * 9, 1.3, Math.sin(angle) * 9);
    village.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
    lamp.position.set(Math.cos(angle) * 9, 2.8, Math.sin(angle) * 9);
    village.add(lamp);
  }
  // stone path from the village to the dock
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const x = -6 - t * 22;
    const z = 20 + t * 16;
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.18, 8), lambert(0xadb5bd, { flatShading: true }));
    stone.position.set(x + range(rng, -0.5, 0.5), groundHeight(x, z) + 0.1, z + range(rng, -0.5, 0.5));
    group.add(stone);
  }

  // ---- wooden dock at Sunny Beach, reaching into the water
  const dock = new THREE.Group();
  const dockDir = new THREE.Vector3(-0.7, 0, 0.7).normalize();
  for (let i = 0; i < 7; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 1.5), lambert(0x8a5a3b));
    plank.position.copy(dockDir).multiplyScalar(i * 1.5);
    plank.position.y = 1.0;
    plank.rotation.y = Math.atan2(dockDir.x, dockDir.z);
    dock.add(plank);
  }
  for (const side of [-1.4, 1.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 6), lambert(0x5c3a21));
    post.position.copy(dockDir).multiplyScalar(9.5);
    post.position.x += -dockDir.z * side;
    post.position.z += dockDir.x * side;
    post.position.y = 0.9;
    dock.add(post);
  }
  dock.position.set(-28, 0, 28);
  group.add(dock);
  const dockEnd = new THREE.Vector3(-28, 0, 28).addScaledVector(dockDir, 9.5);
  dockEnd.y = 1.0;

  // ---- fishing spots: glowing rings, signposts and buoys, one per zone
  const spots = [];
  const spotPositions = {
    sunny: new THREE.Vector3(dockEnd.x, 0.6, dockEnd.z),
    coral: new THREE.Vector3(40, 0.6, 40),
    misty: new THREE.Vector3(-40, 0.6, -40),
    ember: new THREE.Vector3(40, 0.6, -40),
  };
  const ringGeo = new THREE.TorusGeometry(2.2, 0.18, 8, 32);
  for (const zone of ZONES) {
    const pos = spotPositions[zone.id];
    const stand = new THREE.Vector3(pos.x, groundHeight(pos.x * 0.92, pos.z * 0.92), pos.z);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: zone.accent, transparent: true, opacity: 0.9 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y = 0.7;
    group.add(ring);
    // signpost with the zone name
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 6), lambert(0x5c3a21));
    post.position.set(stand.x, stand.y + 1.3, stand.z);
    group.add(post);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 1.1),
      new THREE.MeshBasicMaterial({ map: nameTexture(zone.name, '#ffe066'), transparent: false }),
    );
    board.position.set(stand.x, stand.y + 2.6, stand.z);
    board.lookAt(0, stand.y + 2.6, 0);
    group.add(board);
    // buoy bobbing where the line lands
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4d4d }));
    buoy.position.set(pos.x + 2.5, 0.7, pos.z + 1.5);
    group.add(buoy);
    spots.push({ zone: zone.id, ring, buoy, stand: new THREE.Vector3(stand.x, stand.y, stand.z), water: new THREE.Vector3(pos.x, 0.7, pos.z), baseY: 0.7 });
  }

  // ---- volcano smoke: a few grey puffs above the peak
  const smokeMat = new THREE.MeshLambertMaterial({ color: 0xadb5bd, transparent: true, opacity: 0.75 });
  const smoke = [];
  for (let i = 0; i < 5; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(2.2 + i * 0.5, 8, 6), smokeMat);
    puff.position.set(WORLD.volcanoX + i * 1.2, 15 + i * 2.4, WORLD.volcanoZ - i);
    puff.scale.y = 0.7;
    smoke.push(puff);
    group.add(puff);
  }

  return {
    group,
    spots,
    dockEnd,
    villageCenter: new THREE.Vector3(0, groundHeight(0, 16), 16),

    /** Animate the living world: clouds drift, water bobs, spot rings pulse, buoys bob. */
    update(dt, t) {
      for (const cloud of clouds) {
        cloud.position.x += cloud.userData.speed * dt;
        if (cloud.position.x > 110) cloud.position.x = -110;
      }
      water.position.y = WORLD.waterY + Math.sin(t * 0.6) * 0.06;
      water2.position.y = WORLD.waterY - 0.08 + Math.sin(t * 0.6 + 1.5) * 0.05;
      const pulse = 0.75 + Math.sin(t * 3) * 0.2;
      for (const spot of spots) {
        spot.ring.material.opacity = pulse;
        spot.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
        spot.buoy.position.y = spot.baseY + Math.sin(t * 2 + spot.water.x) * 0.15;
      }
      for (let i = 0; i < smoke.length; i += 1) {
        smoke[i].position.y += dt * 0.5;
        smoke[i].position.x += dt * 0.3;
        if (smoke[i].position.y > 28) smoke[i].position.y = 15;
      }
    },
  };
}
