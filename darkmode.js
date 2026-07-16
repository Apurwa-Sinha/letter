// darkmode.js — Letterio
// Adds a dark mode toggle button to the navbar and remembers the preference.

// ── Inject the toggle button into the navbar ──────────────────────────────────
function injectToggle() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  const btn = document.createElement("button");
  btn.className = "darkmode-toggle";
  btn.setAttribute("aria-label", "Toggle dark mode");
  btn.innerHTML = `
    <span class="darkmode-toggle--icon darkmode-toggle--sun">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </span>
    <span class="darkmode-toggle--icon darkmode-toggle--moon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    </span>
  `;

  nav.appendChild(btn);
  btn.addEventListener("click", toggleDarkMode);
}

// ── Apply / remove dark mode ──────────────────────────────────────────────────
function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
  localStorage.setItem("letterio-darkmode", enabled ? "1" : "0");

  const btn = document.querySelector(".darkmode-toggle");
  if (btn) {
    btn.setAttribute("aria-label", enabled ? "Switch to light mode" : "Switch to dark mode");
    btn.classList.toggle("darkmode-toggle--active", enabled);
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains("dark");
  applyDarkMode(!isDark);
}

// ── On load: restore saved preference ────────────────────────────────────────
function init() {
  injectToggle();
  const saved = localStorage.getItem("letterio-darkmode");
  if (saved === "1") {
    applyDarkMode(true);
  } else if (saved === null) {
    // Respect OS preference on first visit
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyDarkMode(prefersDark);
  }
}

init();
