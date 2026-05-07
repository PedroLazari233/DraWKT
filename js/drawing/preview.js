import { getAngleBetween } from "../utils/math.js";

export function drawPreview(ctx, showPreview, mouse, currentGeometry) {
  if (!showPreview) return;
  if (!mouse) return;
  if (currentGeometry.points.length === 0) return;
  if (currentGeometry.type === "POLYGON") return;

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

export function drawAnglePreview(ctx, currentGeometry, mouse, camera) {
  if (currentGeometry.points.length < 2 || !mouse) {
    return;
  }

  const a = currentGeometry.points.at(-2);
  const b = currentGeometry.points.at(-1);
  const c = mouse;

  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };

  const angle = getAngleBetween(v1, v2);

  drawAngleLabel(ctx, b, `${angle.toFixed(1)}°`, camera);
  drawAngleArc(ctx, a, b, c, camera);
}

function drawAngleLabel(ctx, point, text, camera) {
  const offset = getScreenSize(12, camera);
  ctx.save();

  ctx.scale(1, -1);

  ctx.font = `${12 / camera.zoom}px Arial`;
  ctx.fillText(text, point.x + offset, -(point.y + offset));

  ctx.restore();
}

function drawAngleArc(ctx, a, b, c, camera) {
  const radius = getScreenSize(16, camera);

  const startAngle = getDirectionAngle(b, a);
  const endAngle = getDirectionAngle(b, c);

  ctx.beginPath();
  ctx.arc(b.x, b.y, radius, startAngle, endAngle, false);
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = getScreenSize(2, camera);
  ctx.stroke();

  ctx.strokeStyle = "#000";
}

function getScreenSize(value, camera) {
  return value / camera.zoom;
}

function getDirectionAngle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}