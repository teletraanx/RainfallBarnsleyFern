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

// === DOM: Subdivision Selector ===
const selectElement = document.getElementById("subdivisionSelect");

function populateDropdown() {
  const subdivisions = [...new Set(rainfallData.map(row => row["SUBDIVISION"]))];
  subdivisions.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub;
    selectElement.appendChild(option);
  });
}

function getSelectedSubdivisionRows() {
  const selected = selectElement.value;
  return rainfallData.filter(row => row["SUBDIVISION"] === selected);
}

let rainfallData = [];
let filteredRows = [];
let currentRowIndex = 0;
let currentMonthIndex = 0;
let isReady = false;

// === Fern Variables ===
let fern;
const maxPoints = 12000;
const minPoints = 2000;
const maxRainfall = 1000; // Adjust as needed
const lushGreen = new THREE.Color(0x3ba84d);
const dryBrown = new THREE.Color(0xa56c34);

function generateFern(numPoints, color) {
  const ifs = [
    [0.00,  0.00,  0.00,  0.16, 0.00,  0.00, 0.01],
    [0.85,  0.04, -0.04,  0.85, 0.00,  1.60, 0.85],
    [0.20, -0.26,  0.23,  0.22, 0.00,  1.60, 0.07],
    [-0.15, 0.28,  0.26,  0.24, 0.00,  0.44, 0.07]
  ];

  let x = 0, y = 0;
  const positions = [];
  const colors = [];

  for (let i = 0; i < numPoints; i++) {
    const r = Math.random();
    let a, b, c, d, e, f;
    if (r < ifs[0][6]) [a, b, c, d, e, f] = ifs[0];
    else if (r < 0.86) [a, b, c, d, e, f] = ifs[1];
    else if (r < 0.93) [a, b, c, d, e, f] = ifs[2];
    else               [a, b, c, d, e, f] = ifs[3];

    const nextX = a * x + b * y + e;
    const nextY = c * x + d * y + f;
    x = nextX;
    y = nextY;

    const px = x * 30;
    const py = y * 30 - 55;
    positions.push(px, py, 0);

    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({ vertexColors: true, size: 0.05 });
  return new THREE.Points(geometry, material);
}

function updateFern(rainfall) {
  if (fern) scene.remove(fern);

  const clamped = Math.max(0, Math.min(rainfall, maxRainfall));
  const t = clamped / maxRainfall;
  const pointCount = Math.floor(minPoints + (maxPoints - minPoints) * t);
  const color = dryBrown.clone().lerp(lushGreen, t);

  fern = generateFern(pointCount, color);
  scene.add(fern);
}

// === Fetch Data ===
fetch("/RainfallDataClean.csv")
  .then(response => response.text())
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    rainfallData = parsed.data;
    populateDropdown();
    filteredRows = getSelectedSubdivisionRows();
    isReady = true;
  });

selectElement.addEventListener("change", () => {
  filteredRows = getSelectedSubdivisionRows();
  currentRowIndex = 0;
  currentMonthIndex = 0;
});

// === Text Elements ===
const subdivisionText = new Text();
scene.add(subdivisionText);
subdivisionText.fontSize = 10;
subdivisionText.position.set(-25, -50, 0);
subdivisionText.color = 0x00ff00;

const yearText = new Text();
scene.add(yearText);
yearText.fontSize = 10;
yearText.position.set(-25, -60, 0);
yearText.color = 0x00ff00;

const monthText = new Text();
scene.add(monthText);
monthText.fontSize = 10;
monthText.position.set(-25, -70, 0);
monthText.color = 0x00ff00;

const dataText = new Text();
scene.add(dataText);
dataText.fontSize = 10;
dataText.position.set(-25, -80, 0);
dataText.color = 0x00ff00;

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  if (isReady) {
    const row = filteredRows[currentRowIndex];
    if (row) {
      const monthName = monthNames[currentMonthIndex];
      const rainfallValue = parseFloat(row[monthName]);

      subdivisionText.text = row["SUBDIVISION"];
      yearText.text = row["YEAR"];
      monthText.text = monthName;
      dataText.text = isNaN(rainfallValue) ? "No Data" : `${rainfallValue} mm`;

      subdivisionText.sync();
      yearText.sync();
      monthText.sync();
      dataText.sync();

      updateFern(rainfallValue || 0);
    }

    currentMonthIndex++;
    if (currentMonthIndex >= 12) {
      currentMonthIndex = 0;
      currentRowIndex = (currentRowIndex + 1) % filteredRows.length;
    }

    isReady = false;
    setTimeout(() => isReady = true, 2000);
  }

  renderer.render(scene, camera);
}
animate();
