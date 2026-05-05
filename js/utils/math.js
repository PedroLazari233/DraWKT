export function clamp(value, min, max) {
    
  return Math.min(Math.max(value, min), max);
}

export function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

export function formatNumber(value) {
  return Number(value.toFixed(4)).toString();
}

export function roundCoordinate(value) {
  return Number(value.toFixed(4));
}