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

export function extrudePolyline(points, distance) {
  if (points.length < 2) return [];

  const normals = [];
  
  // 1. Calculate the counter-clockwise normal for each segment
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    
    // Note: If you are using a Canvas/DOM coordinate system where Y goes DOWN, 
    // mathematically CCW (-dy, dx) will visually appear to go to the right (CW). 
    // If you need visual CCW in Canvas, use (dy, -dx) instead.
    normals.push({ x: -dy / len, y: dx / len });
  }

  const offsetPoints = [];

  // 2. Calculate the offset for each vertex using miter joints
  for (let i = 0; i < points.length; i++) {
    let miter = { x: 0, y: 0 };

    if (i === 0) {
      // Start point: just use the first segment's normal
      miter = normals[0];
    } else if (i === points.length - 1) {
      // End point: just use the last segment's normal
      miter = normals[normals.length - 1];
    } else {
      // Inner vertices: calculate the miter joint
      const n1 = normals[i - 1];
      const n2 = normals[i];
      
      // Dot product of the two normals
      const dot = n1.x * n2.x + n1.y * n2.y;

      // Calculate miter extension. We use Math.min to cap the miter 
      // length to prevent massive spikes on extremely sharp inner angles.
      const miterFactor = Math.min(1 / (1 + dot), 5);

      miter = {
        x: (n1.x + n2.x) * miterFactor,
        y: (n1.y + n2.y) * miterFactor
      };
    }

    // Apply the miter vector multiplied by the extrusion distance
    offsetPoints.push({
      x: points[i].x + miter.x * distance,
      y: points[i].y + miter.y * distance
    });
  }

  // 3. Construct the final closed polygon
  const polygon = [];

  // Walk forward along the extruded boundary
  for (let i = 0; i < offsetPoints.length; i++) {
    polygon.push(offsetPoints[i]);
  }

  // Walk backward along the original points to close the swept area
  for (let i = points.length - 1; i >= 0; i--) {
    polygon.push({ x: points[i].x, y: points[i].y });
  }

  // Explicitly close the polygon by duplicating the very first point
  polygon.push({ x: polygon[0].x, y: polygon[0].y });

  return polygon;
}