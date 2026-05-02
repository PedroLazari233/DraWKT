const initialVisibleUnits = 50;

export const camera = {
  x: 0,
  y: 0,
  zoom: 1
};

export function initializeCamera(canvas) {
  camera.x = canvas.width / 2;
  camera.y = canvas.height / 2;
  camera.zoom = canvas.width / initialVisibleUnits;
}