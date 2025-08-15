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

// === DOM Elements ===
const selectElement = document.getElementById("subdivisionSelect");
const yearSelect = document.getElementById("yearSelect");
const timelineBar = document.getElementById("timelineBar");
const timelineIndicator = document.getElementById("timelineIndicator");

let rainfallData = [];
let filteredRows = [];
let currentRowIndex = 0;
let currentMonthIndex = 0;
let isReady = false;

// === Fern Variables ===
let fern;
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

  let color = new THREE.Color();
  let pointCount = 2000;

  if (rainfall <= 50) {
    color.set("#a56c34");
    pointCount = 15000;
  } else if (rainfall <= 100) {
    color.set("#96ad2f");
    pointCount = 30000;
  } else if (rainfall <= 200) {
    color.set("#3ba84d");
    pointCount = 40000;
  } else if (rainfall <= 300) {
    color.set("#1f6e2c");
    pointCount = 50000;
  } else {
    color.set("#325c49");
    pointCount = 75000;
  }

  fern = generateFern(pointCount, color);
  scene.add(fern);
}

// === Utility ===
const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function rainfallToColor(rainfall) {
  if (rainfall <= 50) return "#a56c34";
  if (rainfall <= 100) return "#96ad2f";
  if (rainfall <= 200) return "#3ba84d";
  if (rainfall <= 300) return "#1f6e2c";
  return "#325c49";
}

// === Timeline ===
function renderTimeline(row) {
  timelineBar.innerHTML = "";
  const labelContainer = document.getElementById("timelineLabels");
  labelContainer.innerHTML = "";

  for (let i = 0; i < 12; i++) {
    const rainfall = parseFloat(row[monthNames[i]]) || 0;
    const segment = document.createElement("div");
    segment.className = "timeline-segment";
    segment.style.background = rainfallToColor(rainfall);
    timelineBar.appendChild(segment);

    const label = document.createElement("div");
    label.textContent = monthNames[i];
    labelContainer.appendChild(label);
  }

  timelineIndicator.style.left = "0%";
}

function updateTimelineIndicator(monthIndex) {
  const percent = (monthIndex / 12) * 100;
  timelineIndicator.style.left = `calc(${percent}% - 5px)`;
}

// === Text Elements ===
const subdivisionText = new Text();
subdivisionText.fontSize = 10;
subdivisionText.position.set(-25, -50, 0);
subdivisionText.color = 0x00ff00;
scene.add(subdivisionText);

const yearText = new Text();
yearText.fontSize = 10;
yearText.position.set(-25, -60, 0);
yearText.color = 0x00ff00;
scene.add(yearText);

const monthText = new Text();
monthText.fontSize = 10;
monthText.position.set(-25, -70, 0);
monthText.color = 0x00ff00;
scene.add(monthText);

const dataText = new Text();
dataText.fontSize = 10;
dataText.position.set(-25, -80, 0);
dataText.color = 0x00ff00;
scene.add(dataText);

// === Dropdowns ===
function populateDropdown() {
  const subdivisions = [...new Set(rainfallData.map(row => row["SUBDIVISION"]))];
  subdivisions.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub;
    selectElement.appendChild(option);
  });

  const years = [...new Set(rainfallData.map(row => row["YEAR"]))];
  years.sort((a, b) => a - b);
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

function getSelectedSubdivisionRows() {
  const selectedSubdivision = selectElement.value;
  const selectedYear = yearSelect.value;
  return rainfallData.filter(row =>
    row["SUBDIVISION"] === selectedSubdivision &&
    row["YEAR"] === selectedYear
  );
}

// === Event Listeners ===
selectElement.addEventListener("change", () => {
  filteredRows = getSelectedSubdivisionRows();
  currentRowIndex = 0;
  currentMonthIndex = 0;
});

yearSelect.addEventListener("change", () => {
  filteredRows = getSelectedSubdivisionRows();
  currentRowIndex = 0;
  currentMonthIndex = 0;
});

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
    if (filteredRows.length > 0) renderTimeline(filteredRows[0]);
    isReady = true;
  });

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

      if (currentMonthIndex === 0) {
        renderTimeline(row);
      }

      updateTimelineIndicator(currentMonthIndex);
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
