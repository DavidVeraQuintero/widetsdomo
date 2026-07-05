// src/utils/responsiveScale.js

/**
 * Detect dashboard width vs viewport width and calculate optimal scale
 * Returns scale factor (1.0 = no scaling, 0.33 = 33% of original size)
 */
export function detectDashboardScale(canvasElement) {
  if (!canvasElement) return 1;

  const viewportWidth = window.innerWidth;
  const dashboardWidth = canvasElement.scrollWidth;

  // If dashboard fits in viewport: scale = 1.0
  // If dashboard is wider: scale = viewport / dashboard
  return Math.min(1, viewportWidth / dashboardWidth);
}

/**
 * Apply scale transform to canvas element
 * scale: number between 0 and 1
 * origin: "top left" (default for dashboard)
 */
export function applyCanvasScale(canvasElement, scale) {
  if (!canvasElement) return;
  canvasElement.style.transform = `scale(${scale})`;
  canvasElement.style.transformOrigin = 'top left';
}

/**
 * Zoom state management for pinch-to-zoom
 * Clamps zoom between 1.0 (auto-scale) and 1.5 (max)
 */
export function clampZoom(zoom) {
  return Math.min(1.5, Math.max(1, zoom));
}

/**
 * Calculate final transform combining auto-scale + user zoom
 * baseScale: auto-detected scale (from detectDashboardScale)
 * userZoom: user pinch-to-zoom multiplier (default 1.0)
 */
export function calculateFinalScale(baseScale, userZoom = 1.0) {
  return baseScale * userZoom;
}

/**
 * Recalculate scale on window resize
 * Returns callback function for use in useEffect
 */
export function createResizeObserver(canvasElement, callback) {
  const observer = new ResizeObserver(() => {
    const scale = detectDashboardScale(canvasElement);
    callback(scale);
  });

  if (canvasElement) {
    observer.observe(canvasElement);
  }

  return observer;
}
