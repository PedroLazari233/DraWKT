import { isSnapEnabled } from "../interaction/keyboard.js";
import { roundCoordinate } from "../utils/math.js"
import { getGridStep } from "../drawing/grid.js";

export function getMousePos(e, canvas, camera) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  if (isSnapEnabled)
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