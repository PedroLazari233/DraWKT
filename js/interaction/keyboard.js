export const DrawingMode = {
  POLYGON: "polygon",
  PATH: "path",
  CIRCLE: "circle"
}

export let isSnapEnabled = false;
export let currentDrawingMode = DrawingMode.POLYGON;

let onDrawingModeChangedCallback = null;

export function registerOnDrawingModeChanged(callback) {
  onDrawingModeChangedCallback = callback;
}

window.addEventListener("keyup", (e) => {
  if (e.key === "g") {
    isSnapEnabled = !isSnapEnabled;
    console.log('Snapping: ', isSnapEnabled);
  }
  else if (e.key == "c") {
    currentDrawingMode = currentDrawingMode === DrawingMode.CIRCLE ? DrawingMode.POLYGON : DrawingMode.CIRCLE;
    onDrawingModeChangedCallback(currentDrawingMode);
  }
  else if (e.key == "p") {
    currentDrawingMode = currentDrawingMode === DrawingMode.PATH ? DrawingMode.POLYGON : DrawingMode.PATH;
    onDrawingModeChangedCallback(currentDrawingMode);
  }
});

