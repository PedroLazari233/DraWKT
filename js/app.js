import { camera, initializeCamera } from "./camera/camera.js";
import { getGridStep, drawGrid } from "./drawing/grid.js";
import { clamp } from "./utils/math.js"
import { getMousePos } from "./interaction/mouse.js";
import { createNewGeometry, createLineString, tryCreatePolygon } from "./geometry/factory.js";
import { updateWkt } from "./wkt/wkt.js";
import { drawGeometries } from "./drawing/geometry.js";
import { drawPreview, drawAnglePreview } from "./drawing/preview.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
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

let showPreview = true;
let currentGeometry = createNewGeometry();
geometries.push(currentGeometry);

function onRightClick(e) {
  e.preventDefault(); // prevents browser menu from opening

  showPreview = !showPreview;
  finishGeometry();
  showPreview = !showPreview;
  draw();
}

function onClick(e) {
  const p = getMousePos(e, canvas, camera);

  currentGeometry.points.push(p);

  tryCloseLineString();
  tryClosePolygon();

  draw();
  updateWkt(geometries);
}

canvas.addEventListener("wheel", onWheel);

function onWheel(e) {
  e.preventDefault();

  const mousePosBeforeZoom = getMousePos(e, canvas, camera)
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

  mouse = getMousePos(e, canvas, camera);
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
  drawGeometries(ctx, geometries, camera);
  drawPreview(ctx, showPreview, mouse, currentGeometry);
  drawAnglePreview(ctx, currentGeometry, mouse, camera);

  ctx.restore();
}

function clearCanvas() {
  // Clear the entire canvas area.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function reset() {
  // Remove all stored points.
  geometries.length = 0;

  // Remove the current mouse preview.
  mouse = null;

  // Clear the canvas and WKT output.
  draw();
  updateWkt(geometries);

  currentGeometry = createNewGeometry();
  geometries.push(currentGeometry);
}

function tryCloseLineString() {
  createLineString(currentGeometry);
}

function tryClosePolygon() {
  if(tryCreatePolygon(currentGeometry, getGridStep(camera)/4))
  {
    currentGeometry = createNewGeometry();
    geometries.push(currentGeometry);
  }
}

function finishGeometry()
{
    currentGeometry = createNewGeometry();
    geometries.push(currentGeometry);
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

  mouse = getMousePos(e, canvas, camera);
  draw();
}

function onMouseUp() {
  isPanning = false;
  lastMouse = null;
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