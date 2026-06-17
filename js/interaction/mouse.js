import { isSnapEnabled } from "../interaction/keyboard.js";
import { getDistance, roundCoordinate } from "../utils/math.js"
import { getGridStep } from "../drawing/grid.js";

export function getMousePos(e, geometries, canvas, camera) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;
  const screenPos = { 
    x: roundCoordinate((screenX - camera.x) / camera.zoom), 
    y: roundCoordinate(-(screenY - camera.y) / camera.zoom) 
  };

  if (isSnapEnabled)
  {
    const threshold = getGridStep(camera)/4;
    const geometrySnap = trySnapToGeometries(screenPos, geometries, threshold);
    if (geometrySnap !== null) {
      return geometrySnap;
    }
    
    return {
      x: roundCoordinate(snapToGrid((screenX - camera.x) / camera.zoom, camera)),
      y: roundCoordinate(snapToGrid(-(screenY - camera.y) / camera.zoom, camera))
    };
  }

  return screenPos;
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