import { camera, initializeCamera } from "./camera/camera.js";
import { getGridStep, drawGrid } from "./drawing/grid.js";
import { clamp, getDistance } from "./utils/math.js"
import { getMousePos } from "./interaction/mouse.js";
import { currentDrawingMode, DrawingMode, registerOnDrawingModeChanged } from "./interaction/keyboard.js";
import { createNewGeometry, createLineString, tryCreatePolygon, copyGeometry, createNewCircle, resetGeometry, createCirclePolygon, resetCircle, extrudePolyline } from "./geometry/factory.js";
import { updateWkt } from "./wkt/wkt.js";
import { drawGeometries } from "./drawing/geometry.js";
import { drawPreview, drawAnglePreview, drawCircleRadiusPreview } from "./drawing/preview.js";

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

registerOnDrawingModeChanged(onDrawingModeChanged);

// Register canvas and button events.
canvas.addEventListener("click", onClick);
canvas.addEventListener("contextmenu", onRightClick);
clearBtn.addEventListener("click", reset);

let showPreview = true;
let currentGeometry = createNewGeometry();
let previewPolygon = createNewGeometry();
let currentCircle = createNewCircle();
geometries.push(currentGeometry);
geometries.push(currentCircle);

function onDrawingModeChanged(newMode) {
  console.log(newMode);
  resetGeometry(currentGeometry);
  resetCircle(currentCircle);
  draw();
  updateWkt(geometries);
}

let isChoosingPathOffset = false;
let pathBasePoints = null;

function onRightClick(e) {
  e.preventDefault(); // prevents browser menu from opening
  if (currentDrawingMode === DrawingMode.STANDART) {
    showPreview = !showPreview;
    finishGeometry();
    showPreview = !showPreview;
    draw();
  }
  else if (currentDrawingMode === DrawingMode.PATH && currentGeometry.points.length > 0)
  {
    if (!isChoosingPathOffset) {
      isChoosingPathOffset = true;
      pathBasePoints = [...currentGeometry.points];

      showPreview = !showPreview;
    } else {
      isChoosingPathOffset = false;

      finishGeometry();

      pathBasePoints = null;
      showPreview = !showPreview;
      draw();
      updateWkt(geometries);
    }
  }
}

window.addEventListener("mousemove", (e) => {
  if (isChoosingPathOffset && currentDrawingMode === DrawingMode.PATH) {
    const mousePoint = getMousePos(e, geometries, canvas, camera);

    const offset = getSignedDistanceFromPolyline(pathBasePoints, mousePoint);

    currentGeometry.type = "POLYGON";
    currentGeometry.points = extrudePolyline(pathBasePoints, offset);

    draw();
  }
});

function getSignedDistanceFromPolyline(points, mousePoint) {
  if (points.length < 2) {
    return 0;
  }

  const segmentStart = points[points.length - 2];
  const segmentEnd = points[points.length - 1];

  return getSignedDistanceFromSegment(
    mousePoint,
    segmentStart,
    segmentEnd
  ).distance;
}

function getSignedDistanceFromSegment(point, segmentStart, segmentEnd) {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return { distance: 0 };
  }

  const normal = {
    x: -dy / length,
    y: dx / length
  };

  const vx = point.x - segmentStart.x;
  const vy = point.y - segmentStart.y;

  const signedDistance = vx * normal.x + vy * normal.y;

  return {
    distance: signedDistance
  };
}

function getDistanceFromPolyline(points, mousePoint) {
  let minDistance = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const distance = getDistanceFromSegment(
      mousePoint,
      points[i],
      points[i + 1]
    );

    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

function getDistanceFromSegment(point, segmentStart, segmentEnd) {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return getDistance(point, segmentStart);
  }

  const t = Math.max(0, Math.min(1,
    ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared
  ));

  const projection = {
    x: segmentStart.x + t * dx,
    y: segmentStart.y + t * dy
  };

  return getDistance(point, projection);
}

function onClick(e) {
  const p = getMousePos(e, geometries, canvas, camera);
  if (currentDrawingMode === DrawingMode.STANDART) {
    currentGeometry.points.push(p);
    previewPolygon = createNewGeometry();

    tryCloseLineString();
    tryClosePolygon();

    draw();
    updateWkt(geometries);
  }
  else if (currentDrawingMode == DrawingMode.PATH && !isChoosingPathOffset) {
    currentGeometry.points.push(p);
    previewPolygon = createNewGeometry();

    tryCloseLineString();

    draw();
    updateWkt(geometries);
  }
  else if (currentDrawingMode === DrawingMode.CIRCLE) {
    if (currentCircle.isCenterInitialized) {
      currentCircle = createNewCircle();
      geometries.push(currentCircle);    

      draw();
      updateWkt(geometries);
    }
    else {
      currentCircle.center = p;
      currentCircle.isCenterInitialized = true;
    }
  }
}

canvas.addEventListener("wheel", onWheel);

function onWheel(e) {
  e.preventDefault();

  const mousePosBeforeZoom = getMousePos(e, geometries, canvas, camera)
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

  mouse = getMousePos(e, geometries, canvas, camera);
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
  drawGeometries(ctx, [previewPolygon], camera);
  drawPreview(ctx, showPreview, mouse, currentGeometry);
  drawAnglePreview(ctx, currentGeometry, mouse, camera);
  drawCircleRadiusPreview(ctx, currentCircle, mouse, camera);

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


function tryClosePreviewPolygon() {
  previewPolygon = copyGeometry(currentGeometry);
  previewPolygon.points.push(mouse);
  
  if(!tryCreatePolygon(previewPolygon, getGridStep(camera)/4))
  {
    previewPolygon = createNewGeometry();
  }
}


function updateCurrentCircleRadius() {
  if (currentCircle.isCenterInitialized)
  {
    currentCircle.radius = getDistance(currentCircle.center, mouse);
    createCirclePolygon(currentCircle);
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

  mouse = getMousePos(e, geometries, canvas, camera);

  if (currentDrawingMode === DrawingMode.STANDART) {
    tryClosePreviewPolygon();
  }
  else if (currentDrawingMode === DrawingMode.CIRCLE){
    updateCurrentCircleRadius();
  }
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