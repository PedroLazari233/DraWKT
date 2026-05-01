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
const initialVisibleUnits = 50;

let camera = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  zoom: canvas.width / initialVisibleUnits
};

const minZoom = canvas.width / (maxGridStep * 50);
const maxZoom = canvas.width / (minGridStep * 50);

// Register canvas and button events.
canvas.addEventListener("click", onClick);
canvas.addEventListener("contextmenu", onRightClick);
canvas.addEventListener("mousemove", onMouseMove);
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

function onMouseMove(e) {
  // Store the current mouse position.
  // This is used to draw a temporary preview line.
  mouse = getMousePos(e);

  // Redraw so the preview line follows the mouse.
  draw();
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
  const step = getGridStep();
  return Math.round(value / step) * step;
}

canvas.addEventListener("wheel", onWheel);

function onWheel(e) {
  e.preventDefault();

  const zoomFactor = 1.1;

  if (e.deltaY < 0) {
    camera.zoom *= zoomFactor;
  } else {
    camera.zoom /= zoomFactor;
  }

  camera.zoom = clamp(camera.zoom, minZoom, maxZoom);

  draw();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function draw() {
  // The canvas is redrawn from scratch every time.
  // This keeps the drawing simple and avoids visual artifacts.
  clearCanvas();

  ctx.save();
  // Move origin to center
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, -camera.zoom); 

  drawGrid(getGridStep());
  drawGeometries();
  drawPreview();

  ctx.restore();
}

function getGridStep() {
  const targetPixels = 50;

  let step = targetPixels / camera.zoom;

  const power = Math.pow(10, Math.floor(Math.log10(step)));
  const normalized = step / power;

  if (normalized < 2) {
    step = 1 * power;
  } else if (normalized < 5) {
    step = 2 * power;
  } else {
    step = 5 * power;
  }

  return clamp(step, 0.01, 100);
}

function drawGrid(step) {
  const left = -camera.x / camera.zoom;
  const right = (canvas.width - camera.x) / camera.zoom;
  const bottom = -(canvas.height - camera.y) / camera.zoom;
  const top = camera.y / camera.zoom;

  const startX = Math.floor(left / step) * step;
  const endX = Math.ceil(right / step) * step;

  const startY = Math.floor(bottom / step) * step;
  const endY = Math.ceil(top / step) * step;

  ctx.beginPath();

  for (let x = startX; x <= endX; x += step) {
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
  }

  for (let y = startY; y <= endY; y += step) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1 / camera.zoom;
  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(left, 0);
  ctx.lineTo(right, 0);

  ctx.moveTo(0, bottom);
  ctx.lineTo(0, top);

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1.5 / camera.zoom;
  ctx.stroke();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1 / camera.zoom;
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
  // No points means no geometry.
  if (geometries.length == 0 || geometries[0].length == 0) {
    wktOutput.value = "";
    return;
  }

  wktOutput.value = "";

  for (let i = 0; i < geometries.length; i++) {
    geometry = geometries[i];

    if (geometry.points.length == 0) {
        continue;
    }
    
    if (geometry.type === "POLYGON") {
      wktOutput.value += `POLYGON ((${geometry.points.map(format).join(", ")}))\n`;
    } else if (geometry.points.length === 1) {
      wktOutput.value += `POINT (${format(geometry.points[0])})\n`;
    } else {
      wktOutput.value += `LINESTRING (${geometry.points.map(format).join(", ")})\n`;
    }
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

  if (getDistance(firstPoint, lastPoint) < getGridStep()/4) {
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
canvas.addEventListener("wheel", onWheel);

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
    camera.x += e.clientX - lastMouse.x;
    camera.y += e.clientY - lastMouse.y;

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
