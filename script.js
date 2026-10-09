const DEFAULT_COLOUR = "#490a54";
const DEFAULT_FAVICON = "assets/favicon.svg";
const input = document.getElementById("font-colour");
const root = document.documentElement;

// The "A" from assets/aubergine-quin.svg (same as assets/a-mark.svg)
const A_PATH =
  "M1.65,159.15l14.21-21.6c7.86,16.08,16.41,25.17,23.31,25.17,7.86,0,10.07-24.2,13.65-38.33,4.41-18.19,13.1-32.65,31.45-36.06l-.14-.33c-16,0-40.96-9.42-53.1-26.96l13.1-22.58c9.79,26.31,25.38,46.29,39.45,48.56-9.52-14.29-13.38-26.96-13.38-37.19,0-15.92,9.24-25.66,20-25.66,9.52,0,20.27,7.8,26.34,25.66l31.03,90.79h-27.58l-17.38-51h-2.07c-11.03,0-17.52,17.22-20.14,34.76-5.79,27.45-23.58,41.42-49.79,41.42-9.65,0-19.72-2.11-28.96-6.66ZM102.05,88.01l-13.38-38.98c-2.9-8.28-6.76-12.02-10.07-12.02-3.86,0-7.17,5.04-7.17,13.48,0,9.09,3.72,22.09,14.07,37.52h16.55Z";

// Square viewBoxes around the A's bounds (1.5, 24.25, 146 x 141.75)
const CURSOR_VIEWBOX = "-0.5 20.125 150 150";
const CURSOR_HOTSPOT = "8 3";
const FAVICON_VIEWBOX = "-2.5 18.125 154 154";

function svgUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function cursorSvg(colour, px) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${CURSOR_VIEWBOX}">` +
    `<path d="${A_PATH}" fill="${colour}"/></svg>`
  );
}

function applyCursor(colour) {
  root.style.cursor =
    `image-set(${svgUrl(cursorSvg(colour, 28))} 1x, ${svgUrl(cursorSvg(colour, 56))} 2x) ` +
    `${CURSOR_HOTSPOT}, auto`;
}

// Browsers often ignore href changes on an existing icon link, so swap in a new one
function applyFavicon(colour) {
  const href =
    colour.toLowerCase() === DEFAULT_COLOUR
      ? DEFAULT_FAVICON
      : "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FAVICON_VIEWBOX}"><path d="${A_PATH}" fill="${colour}"/></svg>`
        );
  document.querySelectorAll('link[rel="icon"]').forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = href;
  document.head.appendChild(link);
}

let frame = 0;
function applyColour(colour) {
  root.style.setProperty("--font-colour", colour);
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    applyCursor(colour);
    applyFavicon(colour);
  });
}

applyColour(input.value);

input.addEventListener("input", (e) => {
  applyColour(e.target.value);
});

const copyEmail = document.getElementById("copy-email");
const copyEmailStatus = document.getElementById("copy-email-status");
const copyEmailWrap = copyEmail.parentElement;
let copyStatusTimer;

copyEmail.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyEmail.dataset.email);
    copyEmailWrap.dataset.tooltip = "Copied!";
    copyEmailStatus.textContent = "Email copied to clipboard.";
  } catch (error) {
    copyEmailWrap.dataset.tooltip = "Copy failed";
    copyEmailStatus.textContent = "Unable to copy email to clipboard.";
    console.error("Unable to copy email to clipboard.", error);
  }

  clearTimeout(copyStatusTimer);
  copyStatusTimer = setTimeout(() => {
    copyEmailWrap.dataset.tooltip = "Copy to clipboard";
  }, 1800);
});

// Drag the full stop anywhere on screen; a plain click still opens the picker.
const DRAG_THRESHOLD = 4;
const stop = document.querySelector(".wordmark__stop");
const offset = { x: 0, y: 0 };
let drag = null;
let suppressClick = false;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

stop.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  suppressClick = false;
  stop.setPointerCapture(e.pointerId);
  const rect = stop.getBoundingClientRect();
  drag = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    baseX: offset.x,
    baseY: offset.y,
    minX: offset.x - rect.left,
    maxX: offset.x + (window.innerWidth - rect.right),
    minY: offset.y - rect.top,
    maxY: offset.y + (window.innerHeight - rect.bottom),
    moved: false,
  };
});

stop.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (!drag.moved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    stop.classList.add("is-dragging");
  }
  offset.x = clamp(drag.baseX + dx, drag.minX, drag.maxX);
  offset.y = clamp(drag.baseY + dy, drag.minY, drag.maxY);
  stop.style.setProperty("--dx", `${offset.x}px`);
  stop.style.setProperty("--dy", `${offset.y}px`);
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.moved) {
    suppressClick = true;
    stop.classList.remove("is-dragging");
  }
  drag = null;
}

stop.addEventListener("pointerup", endDrag);
stop.addEventListener("pointercancel", endDrag);

stop.addEventListener(
  "click",
  (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  },
  true
);
