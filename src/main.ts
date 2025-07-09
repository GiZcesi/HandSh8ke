import "./style.css";

/* ====== Captcha Config ====== */
const CAPTCHA_LENGTH = 5;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // add digits if you like

/**
 * Returns a random string of the desired length using the given alphabet.
 */
function generateCaptcha(len: number, alphabet: string = ALPHABET): string {
  return Array.from({ length: len }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

// Random 5‑char code shown to the user
const accessWord = generateCaptcha(CAPTCHA_LENGTH);
let typedChars = "";

/* ====== DOM References ====== */
const DISTANCE_THRESHOLD = 900;
const pre = document.getElementById("ascii-logo") as HTMLElement;
const wrapper = document.querySelector(".ascii-wrapper")!;
const chars = [...pre.textContent!];

/* ====== Utility ====== */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function styleHintChar(span: HTMLElement) {
  const computed = getComputedStyle(span).color;
  const rgb = computed.match(/\d+/g)?.map(Number);
  if (!rgb || rgb.length < 3) return;

  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  const newH = (h + 20) % 360;
  const newS = Math.min(s + 50, 100); // More saturated
  const newL = Math.min(l + 20, 90); // Slightly brighter

  span.style.color = `hsl(${newH}, ${newS}%, ${newL}%)`;
}

/* ====== Initial Render of ASCII ====== */
pre.innerHTML = chars
  .map((c) => `<span data-char="${c}" data-glitching="false">${c === " " ? "&nbsp;" : c}</span>`)
  .join("");

const spanElems = pre.querySelectorAll("span");
let rects: { span: HTMLElement; x: number; y: number }[] = [];

let mouseX = -9999,
  mouseY = -9999;
wrapper.addEventListener("mousemove", (e) => {
  const { clientX, clientY } = e as MouseEvent;
  mouseX = clientX;
  mouseY = clientY;
});
wrapper.addEventListener("mouseleave", () => {
  mouseX = mouseY = -9999;
});

// Keep span positions synced with animation
requestAnimationFrame(function recalcLoop() {
  rects = Array.from(spanElems).map((span) => {
    const { left, top, width, height } = span.getBoundingClientRect();
    return {
      span: span as HTMLElement,
      x: left + width / 2,
      y: top + height / 2,
    };
  });
  requestAnimationFrame(recalcLoop);
});

/* ====== Glitch Loop ====== */
let hintCharVisible = false;

function glitchLoop() {
  const currentTarget = accessWord[typedChars.length];

  for (const { span, x, y } of rects) {
    const dx = mouseX - x,
      dy = mouseY - y;
    const inRange = dx * dx + dy * dy < DISTANCE_THRESHOLD;

    const originalChar = span.dataset.char!;
    if (
      !inRange ||
      span.dataset.glitching === "true" ||
      span.dataset.glitchKey === "typed" ||
      originalChar.trim() === ""
    )
      continue;

    const showHint = !hintCharVisible && Math.random() < 0.1 && currentTarget;
    const glitchChar = showHint
      ? currentTarget
      : String.fromCharCode(33 + (Math.random() * 94) | 0);

    span.dataset.glitching = "true";
    if (showHint) {
      hintCharVisible = true;
      styleHintChar(span);
    }

    span.innerHTML = glitchChar;

    setTimeout(() => {
      span.innerHTML = originalChar === " " ? "&nbsp;" : originalChar;
      span.dataset.glitching = "false";

      if (showHint) {
        span.style.color = "";
        span.dataset.glitchKey = span.dataset.glitchKey || "";
        hintCharVisible = false;
      }
    }, 80 + Math.random() * 120);
  }

  requestAnimationFrame(glitchLoop);
}

// Start glitch loop
glitchLoop();

/* ====== Typing Handler ====== */
document.addEventListener("keydown", (e) => {
  const key = e.key.toUpperCase();
  if (!/^[A-Z]$/.test(key)) return;

  const expectedChar = accessWord[typedChars.length];
  if (key !== expectedChar) return;

  typedChars += key;

  const target = Array.from(spanElems).find(
    (span) =>
      span.dataset.char?.toUpperCase() === expectedChar &&
      span.dataset.glitchKey !== "typed"
  );

  if (target) {
    target.textContent = expectedChar;
    target.style.color = "#0f0";
    target.dataset.glitchKey = "typed";
  }

  if (typedChars === accessWord) {
    document.body.style.transition = "opacity 1.5s ease";
    document.body.style.opacity = "0";
    setTimeout(() => (window.location.href = "/granted.html"), 1600);
  }
});

console.log("[CAPTCHA] Access code:", accessWord);
