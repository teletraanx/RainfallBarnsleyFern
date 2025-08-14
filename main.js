import * as THREE from 'three';
import Papa from "papaparse";
import { Text } from 'troika-three-text';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 275;
camera.position.y = 60;

//--------FETCH AND STORE DATA--------------------------
let rainfallData = [];
let currentIndex = 0;
let isReady = false;

fetch("/RainfallDataClean.csv")
  .then(response => response.text())
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    rainfallData = parsed.data;
    isReady = true;
  });

const subdivisionText = new Text();
scene.add(subdivisionText);
subdivisionText.fontSize = 10;
subdivisionText.position.set(-25, -50, 0);
subdivisionText.color = 0x00ff00;
subdivisionText.sync();

const yearText = new Text();
scene.add(yearText);
yearText.text = "Year";
yearText.fontSize = 10;
yearText.position.set(-25, -60, 0);
yearText.color = 0x00ff00;
yearText.sync();

const monthText = new Text();
scene.add(monthText);
monthText.text = "Month";
monthText.fontSize = 10;
monthText.position.set(-25, -70, 0);
monthText.color = 0x00ff00;
monthText.sync();

const dataText = new Text();
scene.add(dataText);
dataText.text = "Data";
dataText.fontSize = 10;
dataText.position.set(-25, -80, 0);
dataText.color = 0x00ff00;
dataText.sync();

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
let currentRowIndex = 0;
let currentMonthIndex = 0;

function animate() {
  requestAnimationFrame(animate);

  if (isReady) {
    const row = rainfallData[currentRowIndex];
    if (row) {
      subdivisionText.text = row["SUBDIVISION"];
      yearText.text = row["YEAR"];

      const monthName = monthNames[currentMonthIndex];
      monthText.text = monthName;

      const value = row[monthName];
      dataText.text = `${value} mm`;

      subdivisionText.sync();
      yearText.sync();
      monthText.sync();
      dataText.sync();
    }

    // Advance to next month
    currentMonthIndex++;
    if (currentMonthIndex >= 12) {
      currentMonthIndex = 0;
      currentRowIndex = (currentRowIndex + 1) % rainfallData.length;
    }

    // Delay update
    isReady = false;
    setTimeout(() => isReady = true, 2000); // 2 second delay
  }

  renderer.render(scene, camera);
}
animate();
/*
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
*/