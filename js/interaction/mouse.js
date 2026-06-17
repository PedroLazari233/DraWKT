import { isSnapToGridEnabled, isSnapToVertexEnabled } from "../interaction/keyboard.js";
import { getDistance, roundCoordinate } from "../utils/math.js"
import { getGridStep } from "../drawing/grid.js";

export function getMousePos(e, geometries, canvas, camera) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;

  const x = (screenX - camera.x) / camera.zoom;
  const y = -(screenY - camera.y) / camera.zoom;

  const mousePos = {
    x: roundCoordinate(x),
    y: roundCoordinate(y)
  };

  if (isSnapToVertexEnabled) {
    const threshold = getGridStep(camera) / 4;
    const geometrySnap = trySnapToGeometries(mousePos, geometries, threshold);

    if (geometrySnap !== null) {
      return geometrySnap;
    }
  }

  if (isSnapToGridEnabled) {
    return {
      x: roundCoordinate(snapToGrid(x, camera)),
      y: roundCoordinate(snapToGrid(y, camera))
    };
  }

  return mousePos;
}

function snapToGrid(value, camera) {
  const step = getGridStep(camera);
  return Math.round(value / step) * step;
}

function trySnapToGeometries(position, geometries, threshold) {
  for (const geometry of geometries) {
    for (const point of geometry.points) {
      if (getDistance(position, point) < threshold) {
        return point;
      }
    }
  }

  return null;
}