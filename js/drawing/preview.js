export function drawPreview(ctx, showPreview, mouse, currentGeometry) {
  if (!showPreview) return;
  if (!mouse) return;
  if (currentGeometry.points.length === 0) return;
  if (currentGeometry.type === "POLYGON") return;

  // Get the last clicked point.
  const last = currentGeometry.points.at(-1);

  // Draw a temporary line from the last point to the mouse.
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(mouse.x, mouse.y);

  // Use a lighter color for the preview.
  ctx.strokeStyle = "#aaa";
  ctx.stroke();

  // Restore the default color for the real geometry.
  ctx.strokeStyle = "#000";
}