export const DrawingMode = {
  STANDART: "standart",
  PATH: "path",
  CIRCLE: "circle"
}

export let isSnapToGridEnabled = false;
export let isSnapToVertexEnabled = false;
export let currentDrawingMode;


let onDrawingModeChangedCallback = null;

export function registerOnDrawingModeChanged(callback) {
  onDrawingModeChangedCallback = callback;
}

const buttonsByMode = {
  circle: document.getElementById("circleModeBtn"),
  path: document.getElementById("pathModeBtn"),
  standart: document.getElementById("standartModeBtn"),
};

setDrawMode(DrawingMode.STANDART);

const snapMode = {
  vertex: document.getElementById("snapToVertexModeBtn"),
  grid: document.getElementById("snapToGridModeBtn"),
};

function setHover(mode) {
  Object.values(snapMode).forEach(button => {
    button.classList.remove("active");
  });

  snapMode[mode].classList.add("active");
}

snapMode.vertex.addEventListener("click", () => {
  isSnapToVertexEnabled = !isSnapToVertexEnabled;
  snapMode.vertex.classList.toggle("active", isSnapToVertexEnabled);
});

snapMode.grid.addEventListener("click", () => {
  isSnapToGridEnabled = !isSnapToGridEnabled;
  snapMode.grid.classList.toggle("active", isSnapToGridEnabled);
});

buttonsByMode.circle.addEventListener("click", () => setDrawMode(DrawingMode.CIRCLE));
buttonsByMode.path.addEventListener("click", () => setDrawMode(DrawingMode.PATH));
buttonsByMode.standart.addEventListener("click", () => setDrawMode(DrawingMode.STANDART));

function setDrawMode(mode) {
  currentDrawingMode = mode;
  Object.values(buttonsByMode).forEach(button => {
    button.classList.remove("active");
  });

  buttonsByMode[mode].classList.add("active");
}

window.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.key.toLowerCase() === "c") {
    setDrawMode(DrawingMode.CIRCLE);
    onDrawingModeChangedCallback(currentDrawingMode);
  }
  else if (event.shiftKey && event.key.toLowerCase() === "g") {
    isSnapToGridEnabled = !isSnapToGridEnabled;
    snapMode.grid.classList.toggle("active", isSnapToGridEnabled);
  }
  else if (event.shiftKey && event.key.toLowerCase() === "v") {
    isSnapToVertexEnabled = !isSnapToVertexEnabled;
    snapMode.vertex.classList.toggle("active", isSnapToVertexEnabled);
  }
  else if (event.shiftKey && event.key.toLowerCase() === "p") {
    setDrawMode(DrawingMode.PATH);
    onDrawingModeChangedCallback(currentDrawingMode);
  }
  else if (event.shiftKey && event.key.toLowerCase() === "s") {
    setDrawMode(DrawingMode.STANDART);
    onDrawingModeChangedCallback(currentDrawingMode);
  }
});