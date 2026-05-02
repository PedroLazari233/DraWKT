import { camera, initializeCamera } from "./camera/camera.js";
import { getGridStep, drawGrid } from "./drawing/grid.js";
import { clamp } from "./utils/math.js"

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wktOutput = document.getElementById("wktOutput");
const clearBtn = document.getElementById("clearBtn");

// Stores all clicked points in drawing order.
const geometries = [];

// Stores the current mouse position.
// Used only to draw the preview line.
let mouse = null;

const minGridStep = 0.01;
const maxGridStep = 100;

const minZoom = canvas.width / (maxGridStep * 50);
const maxZoom = canvas.width / (minGridStep * 50);

// Register canvas and button events.
canvas.addEventListener("click", onClick);
canvas.addEventListener("contextmenu", onRightClick);
clearBtn.addEventListener("click", reset);

let isShiftPressed = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    isShiftPressed = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    isShiftPressed = false;
  }
});

let showPreview = true;
let currentGeometry = createNewGeometry();

function createNewGeometry() {
  const geometry = {
    type: "LINESTRING",
    points: [],
    isClosed: false
  };

  geometries.push(geometry);

  return geometry;
}

function onRightClick(e) {
  e.preventDefault(); // prevents browser menu from opening

  showPreview = !showPreview;
  finishGeometry();
  showPreview = !showPreview;
  draw();
}

function onClick(e) {
  const p = getMousePos(e);

  currentGeometry.points.push(p);

  tryClosePolygon();

  draw();
  updateWkt();
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  if (isShiftPressed)
  {
    return {
      x: roundCoordinate(snapToGrid((screenX - camera.x) / camera.zoom)),
      y: roundCoordinate(snapToGrid(-(screenY - camera.y) / camera.zoom))
    };
  }

  return {
      x: roundCoordinate((screenX - camera.x) / camera.zoom),
      y: roundCoordinate(-(screenY - camera.y) / camera.zoom)
    };
}

function snapToGrid(value) {
  const step = getGridStep(camera);
  return Math.round(value / step) * step;
}

canvas.addEventListener("wheel", onWheel);

function onWheel(e) {
  e.preventDefault();

  const mousePosBeforeZoom = getMousePos(e)
  const zoomFactor = 1.1;

  if (e.deltaY < 0) {
    camera.zoom *= zoomFactor;
  } else {
    camera.zoom /= zoomFactor;
  }

  camera.zoom = clamp(camera.zoom, minZoom, maxZoom);

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  camera.x = screenX - mousePosBeforeZoom.x * camera.zoom;
  camera.y = screenY + mousePosBeforeZoom.y * camera.zoom;

  mouse = getMousePos(e);
  draw();
}

function draw() {
  // The canvas is redrawn from scratch every time.
  // This keeps the drawing simple and avoids visual artifacts.
  clearCanvas();

  ctx.save();
  // Move origin to center
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, -camera.zoom); 

  drawGrid(getGridStep(camera), camera, canvas, ctx);
  drawGeometries();
  drawPreview();

  ctx.restore();
}

function clearCanvas() {
  // Clear the entire canvas area.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGeometries() {
  ctx.lineWidth = getScreenSize(2);
  for (const geometry of geometries) {
    if(geometry.type == "LINESTRING")
    {
        drawLines(geometry.points);
    }
    else if (geometry.type == "POLYGON")
    {
        drawPolygons(geometry.points)
    }

    drawPoints(geometry.points)
  }
  ctx.lineWidth = 2 / camera.zoom;
}

function getLineWidth(baseWidth) {
  return Math.max(baseWidth / camera.zoom, baseWidth);
}

function drawLines(points) {
  if (points.length < 2) {
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

function drawPolygons(points) {
  if (points.length < 3) {
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.fillStyle = "#aaaaaa67";
  ctx.fill();
  ctx.fillStyle = "#000";
}

function drawPoints(points) {
  for (const point of points) {
    const radius = getScreenSize(4);

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getScreenSize(value) {
  return value / camera.zoom;
}

function drawPreview() {
  if (!showPreview) return;
  if (!mouse) return;
  if (currentGeometry.points.length === 0) return;
  if (currentGeometry.isClosed) return;

  // Get the last clicked point.
  const last = currentGeometry.points.at(-1);

  // Draw a temporary line from the last point to the mouse.
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(mouse.x, mouse.y);

  // Use a lighter color for the preview.
  ctx.strokeStyle = "#aaa";
  ctx.stroke();

  // Restore the default color for the real geometry.
  ctx.strokeStyle = "#000";
}

function updateWkt() {
  wktOutput.value = "";

  for (const geometry of geometries) {
    if (geometry.points.length === 0) {
      continue;
    }

    if (geometry.type === "POLYGON") {
      wktOutput.value += `POLYGON ((${geometry.points.map(format).join(", ")}))\n`;
      continue;
    }

    if (geometry.points.length === 1) {
      wktOutput.value += `POINT (${format(geometry.points[0])})\n`;
      continue;
    }

    wktOutput.value += `LINESTRING (${geometry.points.map(format).join(", ")})\n`;
  }
}

function format(p) {
  return `${formatNumber(p.x)} ${formatNumber(p.y)}`;
}

function formatNumber(value) {
  return Number(value.toFixed(4)).toString();
}
function reset() {
  // Remove all stored points.
  geometries.length = 0;

  // Remove the current mouse preview.
  mouse = null;

  // Clear the canvas and WKT output.
  draw();
  updateWkt();

  currentGeometry = createNewGeometry();
}

function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function tryClosePolygon() {
  const points = currentGeometry.points;

  if (points.length < 4) {
    return;
  }

  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (getDistance(firstPoint, lastPoint) < getGridStep(camera)/4) {
    points.pop();
    points.push(firstPoint);

    currentGeometry.type = "POLYGON";
    currentGeometry.isClosed = true;

    currentGeometry = createNewGeometry();
  }
}

function finishGeometry()
{
    currentGeometry = createNewGeometry();
}

let isPanning = false;
let lastMouse = null;

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mouseleave", onMouseUp);

function onMouseDown(e) {
  // 1 = middle mouse button
  if (e.button !== 1) {
    return;
  }

  e.preventDefault();

  isPanning = true;
  lastMouse = {
    x: e.clientX,
    y: e.clientY
  };
}

function onMouseMove(e) {
  if (isPanning) {
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;

    camera.x += dx;
    camera.y += dy;

    lastMouse = {
      x: e.clientX,
      y: e.clientY
    };

    draw();
    return;
  }

  mouse = getMousePos(e);
  draw();
}

function onMouseUp() {
  isPanning = false;
  lastMouse = null;
}

function roundCoordinate(value) {
  return Number(value.toFixed(4));
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  initializeCamera(canvas);

  draw();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

