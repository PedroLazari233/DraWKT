export const DrawingMode = {
  POLYGON: "polygon",
  CIRCLE: "circle"
}

export let isSnapEnabled = false;
export let currentDrawingMode = DrawingMode.POLYGON;

let onDrawingModeChangedCallback = null;

export function registerOnDrawingModeChanged(callback) {
  onDrawingModeChangedCallback = callback;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "g") {
    isSnapEnabled = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "g") {
    isSnapEnabled = false;
  }
  else if (e.key == "c") {
    currentDrawingMode = currentDrawingMode === DrawingMode.POLYGON ? DrawingMode.CIRCLE : DrawingMode.POLYGON;
    onDrawingModeChangedCallback(currentDrawingMode);
  }
});

