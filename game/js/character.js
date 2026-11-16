// The chibi angler: big round head with a cute face, small body, stubby limbs,
// and every outfit as a procedural 3D attachment. All meshes are three.js
// primitives; the face is small meshes on the front of the head so it reads
// from every angle and in every screenshot.

import * as THREE from 'three';
import { CLOTHES } from './config.js';

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function clothesById(id) {
  return CLOTHES.find((item) => item.id === id) ?? null;
}

/** Build one hat mesh for the hat slot, or null. */
function buildHat(item) {
  if (!item) return null;
  const group = new THREE.Group();
  const color = new THREE.Color(item.color);
  if (item.id === 'straw-hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.06, 20), lambert(color));
    brim.position.y = 0.02;
    group.add(brim);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 16), lambert(color));
    top.position.y = 0.22;
    group.add(top);
  } else if (item.id === 'cap') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert(color));
    dome.position.y = 0.05;
    group.add(dome);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.4), lambert(color));
    brim.position.set(0, 0.08, 0.62);
    group.add(brim);
  } else if (item.id === 'wizard-hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 20), lambert(color));
    group.add(brim);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.05, 16), lambert(color));
    cone.position.y = 0.52;
    cone.rotation.z = 0.12;
    group.add(cone);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), lambert(0xffd60a));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.18;
    group.add(band);
  } else if (item.id === 'crown') {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.28, 12), lambert(color, { emissive: 0x664400 }));
    band.position.y = 0.16;
    group.add(band);
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 6), lambert(color, { emissive: 0x664400 }));
      spike.position.set(Math.cos(a) * 0.44, 0.42, Math.sin(a) * 0.44);
      group.add(spike);
    }
  } else if (item.id === 'pirate-hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 20), lambert(color));
    brim.scale.set(1.15, 1, 0.62);
    brim.position.y = 0.05;
    group.add(brim);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(color));
    dome.scale.set(1, 0.7, 0.7);
    dome.position.y = 0.05;
    group.add(dome);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 20), lambert(0xe63946));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.12;
    band.scale.set(1, 0.7, 1);
    group.add(band);
  }
  return group;
}

/** Build one accessory mesh for the accessory slot, or null. */
function buildAccessory(item) {
  if (!item) return null;
  const group = new THREE.Group();
  if (item.id === 'angel-wings') {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.5, 0.5, 1.1, 0.7, 1.35, 1.15);
    shape.bezierCurveTo(0.9, 1.0, 0.55, 0.75, 0.3, 0.35);
    shape.bezierCurveTo(0.5, 0.15, 0.25, -0.1, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, emissive: 0x555555 });
    const left = new THREE.Mesh(geo, mat);
    left.position.set(-0.18, 0.1, 0);
    left.rotation.set(0, 0.35, 0.25);
    const right = new THREE.Mesh(geo, mat);
    right.position.set(0.18, 0.1, 0);
    right.rotation.set(0, -0.35, -0.25);
    right.scale.x = -1;
    group.add(left, right);
  } else if (item.id === 'backpack') {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.28), lambert(0x8a5a3b));
    pack.position.y = 0;
    group.add(pack);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.2, 0.3), lambert(0x6c4a2f));
    flap.position.y = 0.24;
    group.add(flap);
  } else if (item.id === 'sunglasses') {
    const lensMat = lambert(0x14181d);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.06), lensMat);
      lens.position.set(side * 0.2, 0, 0);
      group.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), lensMat);
    group.add(bridge);
  } else if (item.id === 'cape') {
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.05, 1, 4), new THREE.MeshLambertMaterial({ color: 0xb26bff, side: THREE.DoubleSide }));
    cape.position.y = -0.15;
    cape.rotation.x = 0.12;
    // Give the cape a slight wave by bending its lower vertices.
    const pos = cape.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const y = pos.getY(i);
      pos.setZ(i, (0.5 - y) * 0.18);
    }
    cape.geometry.computeVertexNormals();
    group.add(cape);
  }
  return group;
}

/** Create the chibi angler. `outfit` is { hat, top, shoes, accessory } item ids. */
export function createAngler() {
  const group = new THREE.Group();
  const skin = lambert(0xffd9b3);
  const shirtMat = lambert(0x58c96b);
  const pantsMat = lambert(0x4361ee);

  // Head: big sphere, hair cap, eyes, smile, blush — the face is the point.
  const head = new THREE.Group();
  head.position.y = 1.52;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), skin);
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.57, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), lambert(0x6c4a2f));
  hair.position.y = 0.08;
  head.add(hair);
  const eyeMat = lambert(0x14181d);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), eyeMat);
    eye.position.set(side * 0.2, 0.06, 0.49);
    head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), lambert(0xffffff));
    shine.position.set(side * 0.2 + 0.025, 0.09, 0.55);
    head.add(shine);
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lambert(0xff8fab));
    blush.scale.set(1, 0.6, 0.4);
    blush.position.set(side * 0.34, -0.08, 0.46);
    head.add(blush);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 8, 16, Math.PI), lambert(0x8a4a2f));
  smile.position.set(0, -0.12, 0.5);
  smile.rotation.z = Math.PI;
  head.add(smile);
  group.add(head);

  // Body: shirt cylinder with a belly sphere.
  const body = new THREE.Group();
  body.position.y = 0.92;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.72, 14), shirtMat);
  body.add(torso);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), shirtMat);
  belly.scale.set(1, 0.8, 0.9);
  belly.position.y = -0.18;
  body.add(belly);
  group.add(body);

  // Arms: pivot groups at the shoulders so they can swing.
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.44, 1.18, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.55, 8), skin);
    arm.position.y = -0.26;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skin);
    hand.position.y = -0.56;
    pivot.add(hand);
    group.add(pivot);
    return pivot;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Legs: pivot groups at the hips; feet are the shoes slot.
  const shoeMat = lambert(0xb08968);
  function makeLeg(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.17, 0.52, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.42, 8), pantsMat);
    leg.position.y = -0.2;
    pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.36), shoeMat);
    foot.position.set(0, -0.46, 0.06);
    pivot.add(foot);
    group.add(pivot);
    return { pivot, foot };
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // Slots for outfits.
  const hatSlot = new THREE.Group();
  hatSlot.position.y = 2.02;
  group.add(hatSlot);
  const accessorySlot = new THREE.Group();
  accessorySlot.position.set(0, 1.12, -0.34);
  group.add(accessorySlot);
  const faceSlot = new THREE.Group();
  faceSlot.position.set(0, 1.58, 0.5);
  group.add(faceSlot);

  // Fishing rod, hidden until a cast.
  const rod = new THREE.Group();
  const rodShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 2.3, 6), lambert(0x8a5a3b));
  rodShaft.position.y = 1.15;
  rod.add(rodShaft);
  const rodTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lambert(0x333333));
  rodTip.position.y = 2.3;
  rod.add(rodTip);
  rod.position.set(0.5, 1.0, 0.35);
  rod.rotation.x = -0.7;
  rod.visible = false;
  group.add(rod);

  let walkPhase = 0;

  return {
    group,
    head,
    rod,

    /** Dress the chibi in an outfit: { hat, top, shoes, accessory } item ids. */
    setOutfit(outfit) {
      while (hatSlot.children.length > 0) hatSlot.remove(hatSlot.children[0]);
      while (accessorySlot.children.length > 0) accessorySlot.remove(accessorySlot.children[0]);
      while (faceSlot.children.length > 0) faceSlot.remove(faceSlot.children[0]);
      const hat = buildHat(clothesById(outfit.hat));
      if (hat) hatSlot.add(hat);
      const accessory = buildAccessory(clothesById(outfit.accessory));
      if (accessory) {
        if (outfit.accessory === 'sunglasses') faceSlot.add(accessory);
        else accessorySlot.add(accessory);
      }
      const top = clothesById(outfit.top);
      if (top) shirtMat.color.set(top.color);
      const shoes = clothesById(outfit.shoes);
      if (shoes) {
        shoeMat.color.set(shoes.color);
        const tall = shoes.id === 'boots' ? 1.5 : shoes.id === 'sneakers' ? 1.15 : 1;
        for (const leg of [legL, legR]) leg.foot.scale.set(1, tall, 1);
      } else {
        shoeMat.color.set(0xb08968);
        for (const leg of [legL, legR]) leg.foot.scale.set(1, 1, 1);
      }
    },

    /** Face a direction (radians, 0 = facing +z). */
    face(angle) {
      group.rotation.y = angle;
    },

    /** Animate: walk cycle when moving, idle sway otherwise, fishing poses on top. */
    update(dt, moving, speed, fishingPose) {
      if (moving) {
        walkPhase += dt * speed * 4.2;
        const swing = Math.sin(walkPhase) * 0.65;
        legL.pivot.rotation.x = swing;
        legR.pivot.rotation.x = -swing;
        armL.rotation.x = -swing * 0.8;
        armR.rotation.x = swing * 0.8;
        group.position.y = Math.abs(Math.sin(walkPhase)) * 0.07;
      } else {
        legL.pivot.rotation.x *= 0.8;
        legR.pivot.rotation.x *= 0.8;
        armL.rotation.x *= 0.8;
        armR.rotation.x *= 0.8;
        group.position.y = Math.sin(performance.now() * 0.0016) * 0.02;
        head.rotation.z = Math.sin(performance.now() * 0.0011) * 0.03;
      }
      if (fishingPose === 'cast') {
        armR.rotation.x = -2.2;
        armL.rotation.x = -0.4;
      } else if (fishingPose === 'reel') {
        armR.rotation.x = -1.1;
        armL.rotation.x = -1.1;
      }
    },
  };
}
