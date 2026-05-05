import { getDistance } from "../utils/math.js";

export function createNewGeometry() {
  const geometry = {
    type: "POINT",
    points: []
  };

  return geometry;
}

export function createLineString(currentGeometry) {
  const points = currentGeometry.points;

  if (points.length < 2) {
    return;
  }

  currentGeometry.type = "LINESTRING";
}

export function tryCreatePolygon(currentGeometry, threshold) {
  const points = currentGeometry.points;

  if (points.length < 4) {
    return;
  }

  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (getDistance(firstPoint, lastPoint) < threshold) {
    points.pop();
    points.push(firstPoint);

    currentGeometry.type = "POLYGON";

    return true;
  }

  return false;
}