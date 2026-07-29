// --- Configuration ---
const url = `https://seahorse-app-xz5gx.ondigitalocean.app/cards`;
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get("id"); 

// --- Global State ---
let letterData = null;
let isSpeaking = false;

// ── 1. Initialization & Fetching ─────────────────────────────────────────────
async function initializeApp() {
  if (!cardId) {
    document.getElementById("envelope-status").innerText = "No letter ID found.";
    return;
  }

  try {
    const res = await fetch(`${url}/${cardId}`);
    if (!res.ok) throw new Error(`Letter not found`);
    
    letterData = await res.json();
    
    // Data is loaded, prepare the Envelope for opening
    const statusText = document.getElementById("envelope-status");
    const sealBtn = document.getElementById("wax-seal");
    
    statusText.innerText = "A letter has arrived for you.";
    sealBtn.disabled = false;
    sealBtn.classList.add("ready");
    
    // Wait for user to break the seal
    sealBtn.addEventListener("click", breakSeal);

  } catch (error) {
    console.error("Fetch failed:", error);
    document.getElementById("envelope-status").innerText = "Letter could not be found.";
  }
}

// ── 2. Break Seal & Reveal Letter ────────────────────────────────────────────
function breakSeal() {
  const overlay = document.getElementById("envelope-overlay");
  overlay.classList.add("opened");
  
  // Wait for the fade-out animation to finish, then build the letter
  setTimeout(() => {
    buildLetterStructure(letterData);
    overlay.style.display = 'none'; // Remove completely from flow
  }, 1000);
}

// ── 3. Build HTML & Start Typewriter ─────────────────────────────────────────
function buildLetterStructure(data) {
  const container = document.querySelector(".letter--section--container");

  // Build the basic structure (excluding the body text)
  const html = `
    <div class="letter--head animate-fade-up delay-1">
      <h1 class="text-xxl-light">${data.title}</h1>
      <p class="letter--date">${data.date ? data.date : 'Unknown date'}</p>
    </div>
    <p class="cards--para letter--salutation animate-fade-up delay-2">${data.salutation},</p>
    
    <!-- Empty container for the typewriter -->
    <div id="typewriter-box" class="cards--para letter--container typewriter-cursor"></div>
    
    <!-- Hidden closing until typing finishes -->
    <div id="letter-footer" style="opacity: 0; transition: opacity 1s;">
      <p class="letter--closing">${data.closing},</p>
      <p class="letter--from">${data.from}</p>
      
      <!-- Feature Buttons -->
      <div class="letter-actions-group" data-html2canvas-ignore>
        <button id="btn-read" class="feature-btn">🔊 Read to Me</button>
        <button id="btn-share" class="feature-btn">📤 Share</button>
        <button id="btn-save" class="feature-btn">📸 Save Image</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  
  // Start the typewriter effect
  startTypewriter(data.writeup);
}

// ── 4. Typewriter Logic ──────────────────────────────────────────────────────
async function startTypewriter(text) {
  const box = document.getElementById("typewriter-box");
  // Split raw text into paragraphs based on line breaks
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  // Wait a moment before typing starts
  await new Promise(r => setTimeout(r, 1000));

  for (let i = 0; i < paragraphs.length; i++) {
    const pElement = document.createElement('p');
    box.appendChild(pElement);
    
    const characters = paragraphs[i].split('');
    
    for (let char of characters) {
      pElement.innerHTML += char;
      // Adjust typing speed here (15ms per character)
      await new Promise(r => setTimeout(r, 15));
    }
  }

  // Typing finished: Remove cursor, show footer, attach listeners
  box.classList.remove("typewriter-cursor");
  document.getElementById("letter-footer").style.opacity = 1;
  attachFeatureListeners();
}

// ── 5. Feature Action Listeners ──────────────────────────────────────────────
function attachFeatureListeners() {
  document.getElementById("btn-read").addEventListener("click", toggleSpeech);
  document.getElementById("btn-share").addEventListener("click", shareLetter);
  document.getElementById("btn-save").addEventListener("click", downloadLetter);
}

// ── Feature: Text-To-Speech ──
function toggleSpeech() {
  const btn = document.getElementById("btn-read");
  
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    btn.innerText = "🔊 Read to Me";
    return;
  }

  const textToRead = `${letterData.title}. ${letterData.salutation}. ${letterData.writeup}. ${letterData.closing}, ${letterData.from}`;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  
  // Adjust voice properties if desired
  utterance.rate = 0.9; 
  utterance.pitch = 1;

  utterance.onend = () => {
    isSpeaking = false;
    btn.innerText = "🔊 Read to Me";
  };

  window.speechSynthesis.speak(utterance);
  isSpeaking = true;
  btn.innerText = "⏸️ Stop Reading";
}

// ── Feature: Native Share ──
async function shareLetter() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: letterData.title,
        text: 'I wanted to share this letter with you.',
        url: window.location.href,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  } else {
    // Fallback for desktop browsers
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
}

// ── Feature: Save as Image ──
async function downloadLetter() {
  const letterElement = document.querySelector(".letter--section--container");
  try {
    if (typeof html2canvas === "undefined") throw new Error("html2canvas not loaded");
    
    const canvas = await html2canvas(letterElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: document.documentElement.classList.contains("dark") ? "#1a1a22" : "#f4fce3"
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "Letter.png";
    link.click();
  } catch (error) {
    console.error("Save Image failed:", error);
    alert("Failed to save image. Please try again.");
  }
}

// ── Start Everything ──
window.addEventListener("DOMContentLoaded", initializeApp);
