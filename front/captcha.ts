import "./style.css";

/* ====== Configuration ====== */
const CAPTCHA_LENGTH = 5;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DISTANCE_THRESHOLD = 900;

/* ====== DOM References ======*/
const pre = document.getElementById("ascii-logo") as HTMLElement;
document.addEventListener("mousemove", (e: MouseEvent) => {
    // find the topmost element under the pointer
    const hit = document.elementFromPoint(e.clientX, e.clientY);
  
    // if it’s one of our ASCII spans, hide; otherwise restore
    if (
      hit instanceof HTMLElement &&
      hit.matches("#ascii-logo span[data-char]")
    ) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "";
    }
  });

const wrapper = document.querySelector<HTMLElement>(".ascii-wrapper")!;

/* ====== CAPTCHA ======*/
let accessCode = generateCaptcha(CAPTCHA_LENGTH);
console.log("[CAPTCHA] Access code:", accessCode);
let inputBuffer = "";
let wrongCount = 0;
const typedSpans: HTMLElement[] = [];

/* ====== ASCII Setup ======*/
const chars = [...pre.textContent!];
pre.innerHTML = chars
  .map(c => `<span data-char="${c}" data-glitching="false">${c === ' ' ? '&nbsp;' : c}</span>`)
  .join("");

const spans = Array.from(pre.querySelectorAll<HTMLSpanElement>("span"));
let spanPositions: { span: HTMLElement; x: number; y: number }[] = [];
let mouse = { x: -Infinity, y: -Infinity };
let hintCharVisible = false;  // track if a hint is active

/* ====== Event Listeners ======*/
wrapper.addEventListener("mousemove", (e: MouseEvent) => {
  mouse = { x: e.clientX, y: e.clientY };
});
wrapper.addEventListener("mouseleave", () => {
  mouse = { x: -Infinity, y: -Infinity };
});
document.addEventListener("keydown", handleKeyDown);

/* ====== Animation Loops ======*/
requestAnimationFrame(updateSpanPositions);
requestAnimationFrame(glitchEffectLoop);

/** Generate a random string from alphabet */
function generateCaptcha(len: number, alphabet = ALPHABET): string {
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

/** Convert RGB to HSL */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** Highlight hint character */
function styleHint(span: HTMLElement) {
  const rgb = getComputedStyle(span).color.match(/\d+/g)?.map(Number);
  if (!rgb) return;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  span.style.color = `hsl(${(h + 20) % 360}, ${Math.min(s + 50, 100)}%, ${Math.min(l + 20, 90)}%)`;
}

/** Update span center positions */
function updateSpanPositions() {
  spanPositions = spans.map(span => {
    const { left, top, width, height } = span.getBoundingClientRect();
    return { span, x: left + width / 2, y: top + height / 2 };
  });
  requestAnimationFrame(updateSpanPositions);
}

/** Main glitch effect loop */
function glitchEffectLoop() {
  const nextChar = accessCode[inputBuffer.length];

  for (const { span, x, y } of spanPositions) {
    const distSq = (mouse.x - x) ** 2 + (mouse.y - y) ** 2;
    if (distSq > DISTANCE_THRESHOLD) continue;

    const original = span.dataset.char!;
    if (span.dataset.glitching === "true" || span.dataset.glitchKey === "typed" || !original.trim()) continue;

    const showHint = !hintCharVisible && nextChar && Math.random() < 0.1;
    const char = showHint ? nextChar : String.fromCharCode(33 + ((Math.random() * 94) | 0));

    span.dataset.glitching = "true";
    if (showHint) {
      hintCharVisible = true;
      styleHint(span);
    }

    span.textContent = char;
    setTimeout(() => {
      span.textContent = original === " " ? " " : original;
      span.dataset.glitching = "false";
      if (showHint) {
        span.style.color = "";
        hintCharVisible = false;
      }
    }, 100 + Math.random() * 120);
  }

  requestAnimationFrame(glitchEffectLoop);
}

/** Handle keyboard input */
function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") return handleDelete();
  if (e.key === "Enter") return handleSubmit();
  if (!/^[a-z]$/i.test(e.key)) return;
  handleLetter(e.key.toUpperCase());
}

function handleDelete() {
  if (wrongCount > 0) { wrongCount--; return; }
  if (!inputBuffer) return;
  inputBuffer = inputBuffer.slice(0, -1);
  const span = typedSpans.pop();
  if (span) {
    span.style.color = "";
    delete span.dataset.glitchKey;
    span.textContent = span.dataset.char === " " ? " " : span.dataset.char || "";
  }
}

function handleSubmit() {
  if (inputBuffer === accessCode) {
    // 1. Generate and store a short-lived session token
    const sessionToken = crypto.randomUUID();
    sessionStorage.setItem("auth_token", sessionToken);
    sessionStorage.setItem("last_activity", Date.now().toString());

    // 2. Animate fade-out
    document.body.style.transition = "opacity 1.5s ease";
    document.body.style.opacity = "0";

    // 3. After transition, navigate to protected page
    setTimeout(() => {
      window.location.href = "/granted.html";
    }, 1600);
  }
}

function handleLetter(letter: string) {
  if (inputBuffer.length >= CAPTCHA_LENGTH) return;
  const expected = accessCode[inputBuffer.length];
  if (letter !== expected) { wrongCount++; return; }

  wrongCount = 0;
  inputBuffer += letter;
  const span = spans.find(
    s => s.dataset.char?.toUpperCase() === expected && s.dataset.glitchKey !== "typed"
  );
  if (!span) return;

  span.textContent = expected;
  span.style.color = "#0f0";
  span.dataset.glitchKey = "typed";
  typedSpans.push(span);
}
