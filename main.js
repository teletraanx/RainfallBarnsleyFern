import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 275;
camera.position.y = 60;

// === Barnsley Fern Coefficients (classic) ===
const ifs = [
  [0.00,  0.00,  0.00,  0.16, 0.00,  0.00, 0.01],
  [0.85,  0.04, -0.04,  0.85, 0.00,  1.60, 0.85],
  [0.20, -0.26,  0.23,  0.22, 0.00,  1.60, 0.07],
  [-0.15, 0.28,  0.26,  0.24, 0.00,  0.44, 0.07]
];

// === POINT GENERATION ===
let numPoints = 10000;
const positions = [];
const colors = [];

let x = 0, y = 0;
let minY = Infinity, maxY = -Infinity;
const colorBottom = new THREE.Color(0x00ff00); // Bright green
const colorTop = new THREE.Color(0x9900cc);    // Deep purple

for (let i = 0; i < numPoints; i++) {
  const r = Math.random();
  let a, b, c, d, e, f;

  if (r < ifs[0][6])       [a, b, c, d, e, f] = ifs[0];
  else if (r < 0.86)       [a, b, c, d, e, f] = ifs[1];
  else if (r < 0.93)       [a, b, c, d, e, f] = ifs[2];
  else                     [a, b, c, d, e, f] = ifs[3];

  const nextX = a * x + b * y + e;
  const nextY = c * x + d * y + f;
  x = nextX;
  y = nextY;

  const px = x * 30;
  const py = y * 30 - 55;

  positions.push(px, py, 0);

  // Track min/max for gradient
  minY = Math.min(minY, py);
  maxY = Math.max(maxY, py);
}

// === Normalize Y to create gradient
for (let i = 0; i < positions.length; i += 3) {
  const y = positions[i + 1];
  const t = (y - minY) / (maxY - minY); // Normalize between 0 and 1
  const color = colorBottom.clone().lerp(colorTop, t); // Interpolate color
  colors.push(color.r, color.g, color.b);
}

// === GEOMETRY + MATERIAL ===
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  vertexColors: true,
  size: 0.05
});

const fern = new THREE.Points(geometry, material);
scene.add(fern);

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

console.log("code end");
