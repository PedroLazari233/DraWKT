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

export function getAngleBetween(v1, v2) {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const len1 = Math.hypot(v1.x, v1.y);
  const len2 = Math.hypot(v2.x, v2.y);

  const cos = dot / (len1 * len2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cos)));

  return angleRad * 180 / Math.PI;
}