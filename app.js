const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wktOutput = document.getElementById("wktOutput");
const clearBtn = document.getElementById("clearBtn");

// Stores all clicked points in drawing order.
const geometries = [];

// Stores the current mouse position.
// Used only to draw the preview line.
let mouse = null;

// Register canvas and button events.
canvas.addEventListener("click", onClick);
canvas.addEventListener("contextmenu", onRightClick);
canvas.addEventListener("mousemove", onMouseMove);
clearBtn.addEventListener("click", reset);

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

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  return {
    x: Math.round(x - rect.width / 2),
    y: Math.round(-(y - rect.height / 2))
  };
}

function draw() {
  // The canvas is redrawn from scratch every time.
  // This keeps the drawing simple and avoids visual artifacts.
  clearCanvas();

  ctx.save();
  // Move origin to center
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Invert Y axis
  ctx.scale(1, -1);

  drawGrid(25);
  drawGeometries();
  drawPreview();

  ctx.restore();
}

function drawGrid(step) {
  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;

  ctx.beginPath();

  // Vertical lines
  for (let x = -halfWidth; x <= halfWidth; x += step) {
    ctx.moveTo(x, -halfHeight);
    ctx.lineTo(x, halfHeight);
  }

  // Horizontal lines
  for (let y = -halfHeight; y <= halfHeight; y += step) {
    ctx.moveTo(-halfWidth, y);
    ctx.lineTo(halfWidth, y);
  }

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(-halfWidth, 0);
  ctx.lineTo(halfWidth, 0);

  // Y axis
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(0, halfHeight);

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Restore default drawing style
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
}

function clearCanvas() {
  // Clear the entire canvas area.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGeometries() {
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
  ctx.fillStyle = "#aaa";
  ctx.fill();
  ctx.fillStyle = "#000";
}

function drawPoints(points) {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

   ctx.beginPath();
   ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
   ctx.fill();
  }
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
  // WKT coordinate format is: X Y
  return `${p.x} ${p.y}`;
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

  if (getDistance(firstPoint, lastPoint) < 10) {
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
