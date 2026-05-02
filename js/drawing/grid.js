import { clamp } from "../utils/math.js"

export function getGridStep(camera) {
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

export function drawGrid(step, camera, canvas, ctx) {
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