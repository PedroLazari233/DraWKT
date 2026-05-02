import { formatNumber } from "../utils/math.js";

const wktOutput = document.getElementById("wktOutput");

export function updateWkt(geometries) {
  wktOutput.value = "";

  for (const geometry of geometries) {
    if (geometry.points.length === 0) {
      continue;
    }

    if (geometry.type === "POLYGON") {
      wktOutput.value += `POLYGON ((${geometry.points.map(format).join(", ")}))\n`;
      continue;
    }

    if (geometry.points.length === 1) {
      wktOutput.value += `POINT (${format(geometry.points[0])})\n`;
      continue;
    }

    wktOutput.value += `LINESTRING (${geometry.points.map(format).join(", ")})\n`;
  }
}

function format(p) {
  return `${formatNumber(p.x)} ${formatNumber(p.y)}`;
}