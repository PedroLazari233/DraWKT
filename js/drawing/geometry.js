export function drawGeometries(ctx, geometries, camera) {
  ctx.lineWidth = getScreenSize(2, camera);
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";

  for (const geometry of geometries) {
    if(geometry.type == "LINESTRING")
    {
        drawLines(ctx, geometry.points);
    }
    else if (geometry.type == "POLYGON")
    {
        drawPolygons(ctx, geometry.points)
    }

    drawPoints(ctx, geometry.points, camera)
  }
  ctx.lineWidth = 2 / camera.zoom;
}

function drawLines(ctx, points) {
  if (points.length < 2) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

function drawPolygons(ctx, points) {
  if (points.length < 3) {
    return;
  }

  ctx.beginPath();
  ctx.fillStyle = "#000";
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.fillStyle = "#aaaaaa67";
  ctx.fill();
}

function drawPoints(ctx, points, camera) {
  for (const point of points) {
    const radius = getScreenSize(4, camera);

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getScreenSize(value, camera) {
  return value / camera.zoom;
}