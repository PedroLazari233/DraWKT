export let isSnapEnabled = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "g") {
    isSnapEnabled = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "g") {
    isSnapEnabled = false;
  }
});