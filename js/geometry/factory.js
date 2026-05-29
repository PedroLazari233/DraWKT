import { getDistance } from "../utils/math.js";

export function createNewGeometry() {
  const geometry = {
    type: "POINT",
    points: []
  };

  return geometry;
}

export function copyGeometry(geometry) {
  const newGeometry = {
    type: geometry.type,
    points: structuredClone(geometry.points)
  }

  return newGeometry;
}

export function resetGeometry(geometry) {
  geometry.type = "POINT";
  geometry.points = [];
}

export function createNewCircle() {
  const circle = {
    center: { x: 0, y: 0 },
    radius: 0,
    isCenterInitialized: false,
    type: "POLYGON",
    points: []
  }

  return circle;
}

export function createCirclePolygon(circle) {
  circle.type = "POLYGON";
  circle.points = [];

  const numPoints = 32;

  for (let i = 0; i <= numPoints; i++) {
    // Calculate the angle for this specific point in radians
    const angle = (i / numPoints) * (Math.PI * 2);

    circle.points.push({
      x: circle.center.x + Math.cos(angle) * circle.radius,
      y: circle.center.y + Math.sin(angle) * circle.radius
    });
  }

  return circle; 
}

export function resetCircle(circle) {
    circle.center = { x: 0, y: 0 };
    circle.radius = 0;
    circle.isCenterInitialized = false;
    circle.type = "POLYGON";
    circle.points = [];
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